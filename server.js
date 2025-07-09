const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// --- NEW: Import the database module ---
const db = require('./data/database');

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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
    const { bannerTopPercent, isPublic } = req.body;
    const bannerPath = path.join(__dirname, 'public', 'img', 'wasted.png');
    const outputFileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
    const outputFilePath = path.join(UPLOADS_DIR, outputFileName);

    // Get image metadata to calculate dimensions
    const imageMetadata = await sharp(req.file.buffer).metadata();

    // --- NEW: Resize the banner to match the preview (80% width) ---
    const resizedBannerBuffer = await sharp(bannerPath)
      .resize({ width: Math.round(imageMetadata.width * 0.8) }) // Resize to 80% of the base image's width
      .toBuffer();

    // --- NEW: Calculate correct top and left positions ---
    const topPosition = Math.round((parseFloat(bannerTopPercent) / 100) * imageMetadata.height);
    const leftPosition = Math.round(imageMetadata.width * 0.1); // Position 10% from the left to center the 80% banner

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
    const images = db.getGalleryImages(); // <-- Use the new DB function
    res.json(images);
  } catch (error) {
    console.error('Failed to retrieve gallery images:', error);
    res.status(500).json({ success: false, message: 'Could not load gallery.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});