const sendEmail = require("../services/emailService");

// Find matches between selfie and database photos
exports.findMatches = async (req, res) => {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No selfie uploaded. Please upload an image file.",
      });
    }

    // Validate file type
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: "Invalid file type. Please upload JPG, PNG, or WebP.",
      });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: "File size too large. Maximum 5MB allowed.",
      });
    }

    // Sample database images (in production, this would query a database)
    const images = [
      "http://localhost:4000/uploads/image1.jpg",
      "http://localhost:4000/uploads/image2.jpg",
      "http://localhost:4000/uploads/image3.jpg",
    ];

    console.log(`Processing selfie: ${req.file.filename}`);

    res.json({
      success: true,
      message: "Matches found successfully",
      matches: images,
      count: images.length,
    });
  } catch (err) {
    console.error("Error in findMatches:", err);
    res.status(500).json({
      success: false,
      error: "Error processing image. Please try again.",
      details: err.message,
    });
  }
};

// Send selected photos via email
exports.sendSelectedPhotos = async (req, res) => {
  try {
    const { email, images } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email address is required.",
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address format.",
      });
    }

    // Validate images array
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one image must be selected.",
      });
    }

    // Validate array length
    if (images.length > 50) {
      return res.status(400).json({
        success: false,
        error: "Maximum 50 images can be sent at once.",
      });
    }

    console.log(`Sending ${images.length} images to ${email}`);

    // Send email
    await sendEmail(email, images);

    res.json({
      success: true,
      message: `Email sent successfully to ${email}!`,
      imageCount: images.length,
    });
  } catch (err) {
    console.error("Error in sendSelectedPhotos:", err);
    res.status(500).json({
      success: false,
      error: "Failed to send email. Please try again later.",
      details: err.message,
    });
  }
};