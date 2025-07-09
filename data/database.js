const path = require('path');
const Database = require('better-sqlite3');

// The database will be stored in the persistent /data directory
const dbPath = path.join(__dirname, 'gallery.sqlite');
const db = new Database(dbPath);

// --- One-time Setup: Create the 'gallery' table if it doesn't exist ---
// This schema defines the structure for storing public images.
const createTableStmt = `
  CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;
db.exec(createTableStmt);
console.log("Database initialized and 'gallery' table is ready.");


// --- Database Interaction Functions ---

/**
 * Adds a new image record to the public gallery.
 * @param {string} imagePath - The web-accessible path to the generated image.
 */
function addImageToGallery(imagePath) {
  const stmt = db.prepare('INSERT INTO gallery (path) VALUES (?)');
  const info = stmt.run(imagePath);
  console.log(`Added image to gallery with ID: ${info.lastInsertRowid}`);
}

/**
 * Retrieves all images from the gallery, ordered by most recent.
 * @returns {Array<Object>} An array of image objects.
 */
function getGalleryImages() {
  // We order by ID DESC to get the newest images first.
  const stmt = db.prepare('SELECT path, createdAt FROM gallery ORDER BY id DESC');
  return stmt.all();
}

module.exports = {
  addImageToGallery,
  getGalleryImages,
};