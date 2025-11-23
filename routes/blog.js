const express = require("express");
const router = express.Router();
const Blog = require("../models/blog.model");
const multer = require("multer");
const sanitize = require("sanitize-html");
const path = require("path");
const fs = require("fs"); // Import fs module for file system operations
const { saveBase64Image } = require("../middleware/base64multer");
const cloudinary = require("../config/cloudinary");

const upload = multer({
storage:multer.memoryStorage(),
  limits: {
    fieldSize: 10 * 1024 * 1024, // allow 10MB text fields
    fileSize: 5 * 1024 * 1024,   // allow 5MB image upload
  },
});

// ✅ Handle both thumbnail and rich text images
router.post("/blogpost", upload.single("thumbnail"), async (req, res) => {
  try {
    const { title, content } = req.body;
    let thumbnail = null;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    // Upload image to Cloudinary properly
    if (req.file) {
      thumbnail = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "blog/thumbnails" }, (err, result) => {
            if (err) return reject(err);
            resolve(result.secure_url);
          })
          .end(req.file.buffer);
      });
    }

    // ✅ Find all base64 images and replace them
    const base64Regex = /data:image\/([a-z]+);base64,([A-Za-z0-9+/=]+)/g;
    const matches = [...content.matchAll(base64Regex)];

    let processedContent = content;

    for (const match of matches) {
      const base64String = match[0]; // full base64 string
      try {
        const savedImage = await saveBase64Image(base64String, "RichText");
        processedContent = processedContent.replace(
          base64String,
          savedImage.url
        );
      } catch (err) {
        console.error("Failed to save base64 image:", err.message);
      }
    }

    // ✅ Sanitize final content
    const sanitizedContent = sanitize(processedContent, {
      allowedTags: sanitize.defaults.allowedTags.concat([
        "ul",
        "ol",
        "li",
        "img",
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "table",
        "tr",
        "td",
      ]),
      allowedAttributes: {
        ...sanitize.defaults.allowedAttributes,
        "*": ["style", "class"],
        img: ["src", "alt"],
        a: ["href", "target"],
      },
      allowedStyles: {
        "*": {
          "text-align": [/^(left|center|right|justify)$/],
          float: [/^(left|right)$/],
          "margin-left": [/^\d+(px|%)$/],
          "margin-right": [/^\d+(px|%)$/],
          "list-style-type": [
            /^(disc|circle|square|decimal|lower-roman|upper-roman|lower-alpha|upper-alpha)$/,
          ],
        },
      },
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
