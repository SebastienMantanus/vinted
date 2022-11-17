const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const Offer = require("../models/Offers");

const isAuthenticated = require("../middlewares/isAuthenticated");
const { route } = require("./users");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
  secure: true,
});

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const offerToAdd = new Offer({
        product_name: req.body.title,
        product_description: req.body.description,
        product_price: req.body.price,
        product_details: [
          { Marque: req.body.brand },
          { Taille: req.body.size },
          { Etat: req.body.condition },
          { Couleur: req.body.color },
          { Emplacement: req.body.city },
        ],
        owner: req.user,
      });
      const folder = offerToAdd._id;
      const image = convertToBase64(req.files.picture);
      const ticket = await cloudinary.uploader.upload(image, {
        folder: `/vinted/offers/${folder}`,
      });
      offerToAdd.product_image = ticket.secure_url;

      offerToAdd.save();

      res.status(201).json(offerToAdd);
    } catch (error) {
      console.log(error.messaeg);
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    const filters = {};
    if (req.query.priceMin) {
      filters.product_price = { $gte: req.query.priceMin };
    }
    if (req.query.priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = req.query.priceMax;
      } else {
        filters.product_price = {};
        filters.product_price.$lte = req.query.priceMax;
      }
    }
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }
    // trier par prix croissant ou décroissant
    const sortValue = {};

    if (req.query.sort === "price-desc") {
      sortValue.product_price = "desc";
    } else if (req.query.sort === "price-asc") {
      sortValue.product_price = "asc";
    }

    // pagination des résultats
    const limit = 5;
    let skip = 0;
    if (req.query.page) {
      const page = req.query.page;
      skip = limit * (page - 1);
    }

    const result = await Offer.find(filters)
      .select("product_name product_price product_description -_id")
      .sort({ product_price: 1 })
      .limit(limit)
      .skip(skip);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json(error.message);
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    const offerFound = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account",
    });
    res.status(200).json(offerFound);
  } catch (error) {
    res.status(400).json(error.message);
  }
});

module.exports = router;
