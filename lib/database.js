const path = require('path');
const Database = require('better-sqlite3');

// This path is CRITICAL. It navigates up from the /lib directory
// and then into the /data directory where the persistent volume is.
const dbPath = path.join(__dirname, '..', 'data', 'gallery.sqlite');
const db = new Database(dbPath);

// This schema includes all columns for the gallery.
const createTableStmt = `
  CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;
db.exec(createTableStmt);

// These try/catch blocks add new columns to an existing database
// without crashing the app if the columns already exist.
try {
  db.prepare('SELECT views FROM gallery LIMIT 1').get();
} catch (error) {
  console.log("Adding 'views' column to gallery table...");
  db.exec('ALTER TABLE gallery ADD COLUMN views INTEGER DEFAULT 0');
}

try {
  db.prepare('SELECT likes FROM gallery LIMIT 1').get();
} catch (error) {
  console.log("Adding 'likes' column to gallery table...");
  db.exec('ALTER TABLE gallery ADD COLUMN likes INTEGER DEFAULT 0');
}

console.log(`Database initialized at: ${dbPath}`);

/**
 * Adds a new image record to the public gallery.
 */
function addImageToGallery(imagePath) {
  const stmt = db.prepare('INSERT INTO gallery (path) VALUES (?)');
  stmt.run(imagePath);
}

/**
 * Retrieves all images from the gallery, ordered by most recent.
 */
function getGalleryImages() {
  const stmt = db.prepare('SELECT id, path, views, likes, createdAt FROM gallery ORDER BY id DESC');
  return stmt.all();
}

/**
 * Retrieves a single image by its ID.
 */
function getImageById(id) {
  const stmt = db.prepare('SELECT id, path, views, likes, createdAt FROM gallery WHERE id = ?');
  return stmt.get(id);
}

/**
 * Increments the like count for a specific image.
 */
function likeImage(id) {
  const stmt = db.prepare('UPDATE gallery SET likes = likes + 1 WHERE id = ?');
  stmt.run(id);
}

/**
 * Increments the view count for a specific image.
 */
function incrementViewCount(id) {
  const stmt = db.prepare('UPDATE gallery SET views = views + 1 WHERE id = ?');
  stmt.run(id);
}

module.exports = {
  addImageToGallery,
  getGalleryImages,
  getImageById,
  likeImage,
  incrementViewCount,
};