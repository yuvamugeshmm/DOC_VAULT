const path = require('path');
const fs = require('fs').promises;

// Allowed file types
const ALLOWED_MIME_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png'
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Sanitize filename
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
};

// Validate file
const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES[file.mimetype]) {
    return { valid: false, error: 'Invalid file type. Only PDF, JPG, PNG allowed' };
  }

  // Block executable files by extension
  const ext = path.extname(file.originalname).toLowerCase();
  const dangerousExts = ['.exe', '.sh', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar'];
  if (dangerousExts.includes(ext)) {
    return { valid: false, error: 'Executable files are not allowed' };
  }

  return { valid: true };
};

// Generate unique filename
const generateFilename = (originalFilename, studentId) => {
  const ext = path.extname(originalFilename);
  const sanitized = sanitizeFilename(path.basename(originalFilename, ext));
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${sanitized}_${timestamp}_${random}${ext}`;
};

// Ensure directory exists
const ensureDirectory = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

module.exports = {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  sanitizeFilename,
  validateFile,
  generateFilename,
  ensureDirectory
};
