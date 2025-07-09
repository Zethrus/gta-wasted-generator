const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises'); // Use the promise-based version of fs

const app = express();
const port = process.env.PORT || 8080;

// --- CORRECT PATH CONFIGURATION FOR FLY.IO ---
const dataDir = '/data'; // This is the persistent volume on Fly.io
const uploadsDir = path.join(dataDir, 'uploads');
const DB_PATH = path.join(dataDir, 'database.json');
// ---------------------------------------------

// --- Middleware to ensure database file exists ---
(async () => {
  try {
    await fs.access(DB_PATH);
  } catch {
    // If the file doesn't exist, create it with an empty array
    await fs.writeFile(DB_PATH, JSON.stringify([]));
  }
  next();
});

app.use(express.static('public'));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// This logic can be simplified since we're using promises now
(async () => {
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploads_dir);
  }
})();
app.use('/uploads', express.static(uploadsDir));

// --- API Endpoint for the Gallery ---
app.get('/api/gallery', async (req, res) => {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    const images = JSON.parse(data);
    // Send the images in reverse chronological order
    res.json(images.reverse());
  } catch (error) {
    console.error("Error reading database:", error);
    res.status(500).json({ error: "Could not retrieve gallery images." });
  }
});

// --- Updated Generate Endpoint ---
app.post('/generate', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // Capture the 'isPublic' flag from the form data
  const isPublic = req.body.isPublic === 'true';
  const wastedBannerPath = path.join(__dirname, 'public', 'img', 'wasted.png');
  const outputFileName = `${Date.now()}-wasted.png`;
  const outputPath = path.join(uploadsDir, outputFileName);
  const bannerTopPercent = parseFloat(req.body.bannerTopPercent) || 50;

  try {
    // ADD THIS LINE FOR DEBUGGING
    console.log("Received body:", req.body);

    const isPublic = req.body.isPublic === 'true';
    // END DEBUGGING LINE
    
    // ... (The Sharp image processing logic remains exactly the same)
    const image = sharp(req.file.buffer);
    const imageMetadata = await image.metadata();
    const banner = sharp(wastedBannerPath);
    const bannerWidth = Math.floor(imageMetadata.width * 0.8);
    const resizedBanner = await banner.resize(bannerWidth).toBuffer();
    const resizedBannerMetadata = await sharp(resizedBanner).metadata();
    const topPosition = Math.floor(imageMetadata.height * (bannerTopPercent / 100));
    const leftPosition = Math.floor((imageMetadata.width - resizedBannerMetadata.width) / 2);
    await image.grayscale().composite([{ input: resizedBanner, top: topPosition, left: leftPosition }]).toFile(outputPath);

    // If the image is marked public, save it to our "database"
    if (isPublic) {
      const dbData = await fs.readFile(DB_PATH, 'utf8');
      const images = JSON.parse(dbData);
      images.push({
        fileName: outputFileName,
        createdAt: new Date().toISOString()
      });
      await fs.writeFile(DB_PATH, JSON.stringify(images, null, 2));
    }

    res.json({
      success: true,
      filePath: `/uploads/${outputFileName}`
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing image.');
  }
});

app.listen(port, () => {
  console.log(`GTA Wasted Generator listening at http://localhost:${port}`);
});