const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// --- NEW: Import the database module ---
const db = require('./lib/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Directory for user-generated images, which should be persistent
const UPLOADS_DIR = path.join(__dirname, 'data', 'uploads');
// Ensure the uploads directory exists
fs.mkdirSync(UPLOADS_DIR, { recursive: true });


// --- Express Middleware ---
app.use(express.static('public')); // Serve static files like index.html
app.use('/uploads', express.static(UPLOADS_DIR)); // Serve generated images from the persistent directory
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- Multer Setup for Image Uploads ---
const upload = multer({
  storage: multer.memoryStorage(), // Process image in memory
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'), false);
    }
  },
});


// --- Route to Handle Image Generation ---
app.post('/generate', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded.' });
  }

  try {
    const { bannerTopPercent, isPublic, bannerWidthPercent } = req.body;
    const bannerPath = path.join(__dirname, 'public', 'img', 'wasted.png');
    const outputFileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
    const outputFilePath = path.join(UPLOADS_DIR, outputFileName);

    // Get image metadata to calculate dimensions
    const imageMetadata = await sharp(req.file.buffer).metadata();

    // Use the new bannerWidthPercent (defaulting to 80 if not provided)
    const finalBannerWidth = Math.round(imageMetadata.width * (parseFloat(bannerWidthPercent || 80) / 100));

    const resizedBannerBuffer = await sharp(bannerPath)
      .resize({ width: finalBannerWidth }) // Use the dynamic width
      .toBuffer();

    const topPosition = Math.round((parseFloat(bannerTopPercent) / 100) * imageMetadata.height);
    const resizedBannerMetadata = await sharp(resizedBannerBuffer).metadata();
    // This calculation now correctly centers the dynamically-sized banner
    const leftPosition = Math.round((imageMetadata.width - resizedBannerMetadata.width) / 2);

    // Composite the image using the RESIZED banner
    await sharp(req.file.buffer)
      .grayscale()
      .composite([{
        input: resizedBannerBuffer, // <-- Use the resized banner
        top: topPosition,
        left: leftPosition,      // <-- Use the calculated left position
      }])
      .toFile(outputFilePath);

    const finalImagePath = `/uploads/${outputFileName}`;

    // --- DATABASE LOGIC ---
    if (isPublic === 'true') {
      db.addImageToGallery(finalImagePath);
    }

    res.json({ success: true, filePath: finalImagePath });

  } catch (error) {
    console.error('Image generation failed:', error);
    res.status(500).json({ success: false, message: 'Failed to process image.' });
  }
});


// --- Route to Get Gallery Images ---
app.get('/gallery-images', (req, res) => {
  try {
    const images = db.getGalleryImages();
    res.json(images);
  } catch (error) {
    console.error('Failed to retrieve gallery images:', error);
    res.status(500).json({ success: false, message: 'Could not load gallery.' });
  }
});

// --- Route to Like an Image ---
app.post('/api/gallery/:id/like', (req, res) => {
  try {
    const imageId = parseInt(req.params.id, 10);
    db.likeImage(imageId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Failed to like image ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Could not process like.' });
  }
});

// --- API endpoint to get a single image's data ---
app.get('/api/gallery/:id', (req, res) => {
  try {
    const imageId = parseInt(req.params.id, 10);
    // Increment the view count every time this data is fetched
    db.incrementViewCount(imageId);
    const image = db.getImageById(imageId);

    if (image) {
      res.json(image);
    } else {
      res.status(404).json({ success: false, message: 'Image not found.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// --- Route to serve the individual image page ---
app.get('/gallery/:id', (req, res) => {
  // We just serve the static HTML file. The data will be loaded by a script on that page.
  res.sendFile(path.join(__dirname, 'public', 'image.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});