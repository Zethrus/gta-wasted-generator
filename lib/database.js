const path = require('path');
const Database = require('better-sqlite3');

// This is the corrected path. It goes up one level from `lib`
// and then into the persistent `data` directory.
const dbPath = path.join(__dirname, '..', 'data', 'gallery.sqlite');
const db = new Database(dbPath);

// This schema will now be correctly applied to the database file
// located on your persistent volume.
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

// Add columns if they don't exist (for existing databases)
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


function addImageToGallery(imagePath) {
  const stmt = db.prepare('INSERT INTO gallery (path) VALUES (?)');
  stmt.run(imagePath);
}

function getGalleryImages() {
  const stmt = db.prepare('SELECT id, path, views, likes, createdAt FROM gallery ORDER BY id DESC');
  return stmt.all();
}

function likeImage(id) {
  const stmt = db.prepare('UPDATE gallery SET likes = likes + 1 WHERE id = ?');
  stmt.run(id);
}

module.exports = {
  addImageToGallery,
  getGalleryImages,
  likeImage,
};