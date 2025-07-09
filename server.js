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

// --- STARTUP CHECKS: Ensure directories and files exist ---
(async () => {
  try {
    // Create the /data/uploads directory if it doesn't exist
    await fs.mkdir(uploadsDir, { recursive: true });
    console.log(`Successfully ensured ${uploadsDir} exists.`);

    // Check for database file
    await fs.access(DB_PATH);
    console.log(`${DB_PATH} already exists.`);
  } catch (error) {
    // If fs.access fails, the file doesn't exist, so create it
    if (error.code === 'ENOENT') {
      console.log(`${DB_PATH} not found, creating it...`);
      await fs.writeFile(DB_PATH, JSON.stringify([]));
    } else {
      // For any other errors, log them
      console.error("Error during initial file/dir setup:", error);
    }
  }
})();
// --- END STARTUP CHECKS ---

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

app.listen(port, '0.0.0.0', () => {
  console.log(`GTA Wasted Generator listening on port ${port}`);
});