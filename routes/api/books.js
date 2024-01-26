const express = require("express");
const router = express.Router();

const ctrl = require("../../controllers/books");
const { isValidId, validateBody, authenticate } = require("../../middlewares");
const { addSchema } = require("../../models/books");

router.get("/", authenticate, ctrl.getAllBooks);

router.post("/", authenticate, validateBody(addSchema), ctrl.addBook);

router.delete("/:bookId", authenticate, isValidId, ctrl.removeById);

module.exports = router;
