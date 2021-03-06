

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

router.post("/login", [passport.authenticate("local", {
  successRedirect: "/auth/profile",
  failureRedirect: "/auth/login",
  failureFlash: true,
  passReqToCallback: true
}), (req, res) => {
  User.findById(req.params.id)
    .then((message) => {
      res.render("auth/profile", { message })
    }
    )
}]);

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

    // const hashCode = bcrypt.hashSync(username, salt)
    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let token = '';
    for (let i = 0; i < 25; i++) {
      token += characters[Math.floor(Math.random() * characters.length)];
    }

    const newUser = new User({
      username,
      password: hashPass,
      email,
      confirmationCode: token
    });

    const sendMail = () => {
      return transporter.sendMail({
        from: user,
        to: email,
        subject: 'Registration Confirmed',
        text: `Confirm registration here: http://localhost:3000/auth/confirm/${token}.`
      })
    }
    newUser.save()
      .then((user) => {
        sendMail(user)
          .then(() => {
            res.redirect("/");
          })
          .catch(err => {
            res.render("auth/signup", { message: "Something went wrong" });
          })
      });
  });
  router.get("/confirm/:confirmCode", (req, res) => {
    const confirmCode = req.params.confirmCode;
    User.findOneAndUpdate(
      { "confirmationCode": confirmCode },
      {
        $set: { status: "Active" }
      },
      {
        new: true
      })
      .then((message) => {
        res.render("auth/confirmation", { message })
      })
  });

  router.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
  });
});

// router.get('/profile', (req, res, next) => {
//   User.find()
//     .then((profile) => {
//       res.render('auth/profile', { profile });
//     })

// });


module.exports = router;
