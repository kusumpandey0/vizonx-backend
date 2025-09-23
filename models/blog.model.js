const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    thumbnail: {
      type: String, // Store file path or URL (e.g., /uploads/filename.jpg or cloud URL)
      default: null,
    },
    content: {
      type: String, // HTML content from JoditEditor
      required: [true, 'Blog content is required'],
      trim: true,
    },
    // status: {
    //   type: String,
    //   enum: ['pending', 'approved', 'published'],
    //   default: 'pending',
    // },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);
module.exports = mongoose.model('Blog', blogSchema);