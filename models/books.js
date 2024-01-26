const { Schema, model } = require("mongoose");
const Joi = require("joi");
const { handleMongooseError } = require("../helpers");

const booksSchema = new Schema(
  {
    author: {
      type: String,
      required: true,
    },
    book_image: {
      type: String,
      required: true,
    },
    buy_links: [{ name: String, url: String }],
    description: {
      type: String,
      requred: true,
      default: "",
    },
    list_name: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    saved_id: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { versionKey: false }
);

booksSchema.post("save", handleMongooseError);

const addSchema = Joi.object({
  author: Joi.string().required(),
  book_image: Joi.string().required(),
  buy_links: Joi.array()
    .items(
      Joi.object({
        name: Joi.string(),
        url: Joi.string(),
      })
    )
    .required(),
  description: Joi.string().required(),
  list_name: Joi.string().required(),
  title: Joi.string().required(),
  saved_id: Joi.string().required(),
});

const Book = model("book", booksSchema);

module.exports = {
  Book,
  addSchema,
};
