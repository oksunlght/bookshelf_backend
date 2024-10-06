const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const { Storage } = require("@google-cloud/storage");
const { User } = require("../models/user");
const { HttpError, ctrlWrapper } = require("../helpers");
const { SECRET_KEY } = process.env;

const tempAvatar = path.join(__dirname, "../", "temp", "profileAvatar.jpg");

const {
  PRIVATE_KEY_ID,
  PRIVATE_KEY,
  PROJECT_ID,
  CLIENT_EMAIL,
  CLIENT_ID,
  CLIENT_CERT_URL,
} = process.env;

const privateKey = PRIVATE_KEY.split(String.raw`\n`).join("\n");

const storage = new Storage({
  projectId: "bookshelf-store-437509",

  credentials: {
    type: "service_account",
    project_id: `${PROJECT_ID}`,
    private_key_id: `${PRIVATE_KEY_ID}`,
    private_key: `${privateKey}`,
    client_email: `${CLIENT_EMAIL}`,
    client_id: `${CLIENT_ID}`,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `${CLIENT_CERT_URL}`,
    universe_domain: "googleapis.com",
  },
});

const register = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const avatarURLTemp = tempAvatar;

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL: avatarURLTemp,
  });

  const payload = {
    id: newUser._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });

  res.status(201).json({
    token,
    user: {
      name: newUser.name,
      email: newUser.email,
      avatarURL: newUser.avatarURL,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }

  const comparedPassword = await bcrypt.compare(password, user.password);

  if (!comparedPassword) {
    throw HttpError(401, "Email or password is wrong");
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });

  await User.findByIdAndUpdate(user._id, { token });

  res.json({
    token,
    user: { email, name: user.name, avatarURL: user.avatarURL },
  });
};

const getCurrent = async (req, res) => {
  const { email, name, avatarURL, shopping_list } = req.user;
  res.json({
    email,
    name,
    avatarURL,
    shopping_list,
  });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });

  res.status(204).json("");
};

const updateAvatar = async (req, res, next) => {
  try {
    const bucketName = "bookshelf-1323-store-bucket";
    const { _id } = req.user;
    const { originalname, path } = req.file;
    const uniqueFilename = `${_id}_${originalname}`;

    const fileName = `avatars/${uniqueFilename}`;

    const [fileUpload] = await storage.bucket(bucketName).upload(path, {
      destination: fileName,
      predefinedAcl: "publicRead",
    });

    if (!fileUpload) {
      throw HttpError(
        404,
        "Can't upload user avatar, check your authorisation"
      );
    }

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

    const user = await User.findByIdAndUpdate(
      _id,
      { avatarURL: publicUrl },
      { new: true }
    );

    if (!user) {
      throw HttpError(404, "Can't update user avatar, user not found");
    }

    const currentUser = await User.findById(_id);

    res.json({
      user: currentUser,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateAvatar: ctrlWrapper(updateAvatar),
};
