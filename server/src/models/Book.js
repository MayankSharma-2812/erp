const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    isbn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    authors: [
      {
        type: String,
        trim: true,
      },
    ],
    publisher: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
    },
    edition: {
      type: String,
    },
    subject: {
      type: String,
      trim: true,
    },
    copies: {
      type: Number,
      required: true,
      min: 0,
    },
    available: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      type: String, // e.g. "Rack 3, Shelf B"
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

bookSchema.index({ isbn: 1 });
bookSchema.index({ title: 1 });

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
