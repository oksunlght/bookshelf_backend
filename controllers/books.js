const { Book } = require("../models/books");

const { HttpError, ctrlWrapper } = require("../helpers");

const getAllBooks = async (req, res) => {
  const { _id: owner } = req.user;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const result = await Book.find({ owner }, "-createdAt -updatedAt", {
    skip,
    limit,
  }).populate("owner", "email");

  res.json(result);
};

const addBook = async (req, res) => {
  const { _id: owner } = req.user;

  const result = await Book.create({ ...req.body, owner });

  res.status(201).json(result);
};

const removeById = async (req, res) => {
  const { bookId } = req.params;
  const userId = req.user._id;

  const result = await Book.findByIdAndDelete({ _id: bookId, owner: userId });

  if (!result) {
    throw HttpError(404, "Not found");
  }

  res.json({ message: "Book deleted" });
};

module.exports = {
  getAllBooks: ctrlWrapper(getAllBooks),
  addBook: ctrlWrapper(addBook),
  removeById: ctrlWrapper(removeById),
};
