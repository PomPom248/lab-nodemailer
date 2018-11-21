// require('dotenv').config();

const nodemailer = require("nodemailer")

const express = require("express");
const passport = require('passport');
const router = express.Router();
const User = require("../models/User");

const transporter = require("../mail/transporter")
// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;


router.get("/login", (req, res, next) => {
  res.render("auth/login", { "message": req.flash("error") });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/auth/login",
  failureFlash: true,
  passReqToCallback: true
}));

router.get("/signup", (req, res, next) => {
  res.render("auth/signup");
});

router.post("/signup", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;

  if (username === "" || password === "") {
    res.render("auth/signup", { message: "Indicate username and password" });
    return;
  }

  User.findOne({ username }, "username", (err, user) => {
    if (user !== null) {
      res.render("auth/signup", { message: "The username already exists" });
      return;
    }

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const hashCode = bcrypt.hashSync(username, salt)


    const newUser = new User({
      username,
      password: hashPass,
      email,
      confirmationCode: hashCode
    });

    const sendMail = (from, to, subject, text) => {
      return transporter.sendMail({
        from: 'Myself',
        to: email,
        subject: 'Registration Confirmed',
        text: `Confirm registration here: http://localhost:3000/auth/confirm/${hashCode}`
      })
        .then(info => console.log(info))
        .catch(error => console.log(error));
    }

    newUser.save()
      .then((user) => {
        sendMail(user).then(() => {
          console.log("mensaje enviado")
          res.redirect("/");
        })
          .catch(err => {
            res.render("auth/signup", { message: "Something went wrong" });
          })
      });
  });

  router.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
  });
});

module.exports = router;