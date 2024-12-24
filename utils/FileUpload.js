const fs = require("fs");
const multer = require("multer");
const path = require("path");

// Create the 'uploads' directory if it doesn't exist
const uploadDir = path.join(
  "C:/Users/Ashwin/Downloads/Upgrad Stock and Adharcard/stockImage"
);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // Ensures the full directory path is created
}

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Save file to 'stockImage' directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    ); // Generate a unique filename
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/*"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },

  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    fieldSize: 25 * 1024 * 1024, // Limit field size to 2MB
  },
});

const upload = multer({
  storage: storage,
});
module.exports = upload;
