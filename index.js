require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

// Packages nécessaires pour l'authentification sont dans le fichier routes/users.js

// lancement du serveur
const app = express();
app.use(express.json()); //lecture des req "body"

// initialisation de la base de donnée
mongoose.connect(process.env.MONGODB_URI);

// importation des routes routes/users.js
const usersRoutes = require("./routes/users");
app.use(usersRoutes);
const offersRoutes = require("./routes/offers");
app.use(offersRoutes);

// catch all route
app.all("*", (req, res) => {
  try {
    return res
      .status(404)
      .json("Tous ceux qui errent ne sont pas forcément perdus");
  } catch (error) {
    console.log(error.message);
  }
});

// démarrage du serveur
app.listen(process.env.PORT, () => {
  console.log("Server Online : let the show begin baby !");
});
