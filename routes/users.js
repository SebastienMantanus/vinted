const express = require("express");
const router = express.Router();

const User = require("../models/User");

// pagkages nécessaires pour remonter l'avatar
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
  secure: true,
});
// convertisseur en Base64 de l'avatar
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// Packages nécessaires pour l'authentification
const sha256 = require("crypto-js/sha256");
const Base64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    // on vérifie que l'utilisateur n'est pas déjà inscrit
    const userToFind = await User.findOne({ email: req.body.email });

    if (req.body.username) {
      if (!userToFind) {
        // on récupère le mot de passe :
        const password = req.body.password;
        // on génère un "Salt" :
        const salt = uid2(16);
        // on crée un hash avec le Salt + le mot de passe :
        const hash = sha256(password + salt).toString(Base64);
        // on génère un token (qui sera remonté dans le cookie du navigateur) :
        const token = uid2(16);
        // on enregistre l'utilisateur dans la base de donnée :

        const newUser = new User({
          email: req.body.email,
          account: {
            username: req.body.username,
          },
          newsletter: req.body.newsletter,
          token: token,
          hash: hash,
          salt: salt,
        });

        if (req.files) {
          // on remonte l'avatar sur Cloudinary
          const forlder = newUser._id;
          const avatar = convertToBase64(req.files.avatar);
          const ticket = await cloudinary.uploader.upload(avatar, {
            folder: `/vinted/users/${folder}`,
          });
          newUser.account.avatar = ticket.secure_url;
        }
        await newUser.save();
        res.status(201).json(newUser);
      } else {
        res
          .status(201)
          .json(`${req.body.email} est déjà inscrit, merci de vous connecter`);
      }
    } else {
      res.status(201).json(`Merci d'entrer un nom d'utilisateur`);
    }
  } catch (error) {
    console.log(error.message);
  }
});

router.post("/user/login", async (req, res) => {
  try {
    // on recherche l'utilisateur
    const userToFind = await User.findOne({ email: req.body.email });
    const userPassword = req.body.password;
    const userSalt = userToFind.salt;

    // on crée le Hash de contrôle
    const hash = sha256(userPassword + userSalt).toString(Base64);

    // on vérifie l'identification de l'utilisateur
    if (hash === userToFind.hash) {
      console.log("access granted !");
      res.status(200).json(userToFind);
    } else {
      console.log("access denied !");
      res.status(200).json("Wrong Username or Password");
    }
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = router;
