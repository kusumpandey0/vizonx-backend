const express = require("express");
const router = express.Router();
const Blog = require("../models/blog.model");
const multer = require("multer");
const sanitize = require("sanitize-html");
const path = require("path");
const fs = require("fs"); // Import fs module for file system operations
const { saveBase64Image } = require("../middleware/base64multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created uploads directory at ${dir} for this request`);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png, gif) are allowed"));
  },
});

// Ensure uploads folder exists
const ensureUploadsFolder = () => {
  const dir = "uploads";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created uploads directory at ${dir}`);
  }
};
ensureUploadsFolder();


// ✅ Handle both thumbnail and rich text images
router.post("/blogpost", upload.single("thumbnail"), async (req, res) => {
  try {
    const { title, content } = req.body;
    const thumbnail = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

   // ✅ Find all base64 images and replace them
const base64Regex = /data:image\/([a-z]+);base64,([A-Za-z0-9+/=]+)/g;
const matches = [...content.matchAll(base64Regex)];

let processedContent = content;

for (const match of matches) {
  const base64String = match[0]; // full base64 string
  try {
    const savedImage = await saveBase64Image(base64String, "RichText");
    processedContent = processedContent.replace(base64String, savedImage.url);
  } catch (err) {
    console.error("Failed to save base64 image:", err.message);
  }
}

    // ✅ Sanitize final content
    const sanitizedContent = sanitize(processedContent, {
      allowedTags: sanitize.defaults.allowedTags.concat([
        "ul", "ol", "li", "img", "p", "h1", "h2", "h3", "h4", "h5", "h6", "table", "tr", "td"
      ]),
      allowedAttributes: {
        ...sanitize.defaults.allowedAttributes,
        "*": ["style", "class"],
        img: ["src", "alt"],
        a: ["href", "target"]
      },
      allowedStyles: {
        "*": {
          "text-align": [/^(left|center|right|justify)$/],
          "float": [/^(left|right)$/],
          "margin-left": [/^\d+(px|%)$/],
          "margin-right": [/^\d+(px|%)$/],
          "list-style-type": [/^(disc|circle|square|decimal|lower-roman|upper-roman|lower-alpha|upper-alpha)$/],
        }
      }
    });

    // ✅ Save blog post
    const blog = new Blog({
      title,
      thumbnail,
      content: sanitizedContent,
    });

    await blog.save();

    res.status(201).json({ message: "Blog post created successfully", blog });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


router.get("/blogget", async (req, res) => {
  try {
    const blogs = await Blog.find(); // Fetch all blogs
    if (!blogs.length) {
      return res.status(404).json({ message: "No blogs found" });
    }
    res.status(200).json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ error: error.message });
  }
});
router.get("/blogget/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json(blog);
  } catch (error) {
    console.error("Error fetching blog by ID:", error);
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
