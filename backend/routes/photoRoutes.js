const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
  findMatches,
  sendSelectedPhotos,
} = require("../controllers/photoController");

// ===== MULTER CONFIGURATION =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    cb(null, `${timestamp}-${random}${path.extname(file.originalname)}`);
  },
});

// Filter for image files only
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

  const ext = path.extname(file.originalname).toLowerCase();

  if (
    allowedMimes.includes(file.mimetype) &&
    allowedExtensions.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPG, PNG, and WebP images are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// ===== ROUTES =====

// Health check route
router.get("/health", (req, res) => {
  res.json({
    status: "success",
    message: "Photo API is healthy",
  });
});

// Test route
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "API working correctly",
  });
});

// Find matching photos
router.post(
  "/find-matches",
  upload.single("selfie"),
  findMatches
);

// Send selected photos via email
router.post("/send-email", sendSelectedPhotos);

// Error handling for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum file size is 5MB.",
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  next();
});

module.exports = router;