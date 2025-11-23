const express = require("express");
const router = express.Router();
const Blog = require("../models/blog.model");
const sanitize = require("sanitize-html");
const { uploadToCloudinary, upload } = require("../middleware/cloudinary");


// ✅ Handle both thumbnail and rich text images
router.post("/blogpost", upload.single("thumbnail"), async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

let processedContent = content;

const thumbnailUrl = req.file
      ? await uploadToCloudinary(req.file.path)
      : null;

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
      thumbnail: thumbnailUrl,
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
