const { isValidObjectId } = require("mongoose");

const { HttpError } = require("../helpers");

const isValidId = (req, _, next) => {
  const { bookId } = req.params;

  if (!isValidObjectId(bookId)) {
    next(HttpError(404, `${bookId} is not a valid id`));
  }
  next();
};

module.exports = isValidId;
