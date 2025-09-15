const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

router.post('/register', async (req, res, next) => {
  const { email, password1, firstname, lastname, username } = req.body;

  await body("firstname", "First name is required").notEmpty().run(req);
  await body("lastname", "Last name is required").notEmpty().run(req);
  await body("username", "Username is required").notEmpty().run(req);
  await body("email", "E-mail is required").notEmpty().run(req);
  await body("email", "E-mail is not valid").isEmail().run(req);
  await body("password1", "Password is required").notEmpty().run(req);
  await body("password2", "Passwords do not match").equals(req.body.password1).run(req);

  var errors = validationResult(req).array();
  if (errors && errors.length > 0)
    return res.redirect('/users'
      + '?RegisterError=' + encodeURIComponent(errors[0].msg)
      + ((firstname && firstname != "") ? '&firstname=' + encodeURIComponent(firstname) : '')
      + ((lastname && lastname != "") ? '&lastname=' + encodeURIComponent(lastname) : '')
      + ((username && username != "") ? '&username=' + encodeURIComponent(username) : '')
      + ((email && email != "") ? '&email=' + encodeURIComponent(email) : '')
    );

  User.findOne({ 'username': username }, (user) => {
    if (user) {
      return res.redirect('/users'
        + '?RegisterError=' + encodeURIComponent('Username is already taken')
        + ((firstname && firstname != "") ? '&firstname=' + encodeURIComponent(firstname) : '')
        + ((lastname && lastname != "") ? '&lastname=' + encodeURIComponent(lastname) : '')
        + ((email && email != "") ? '&email=' + encodeURIComponent(email) : '')
      );
    }
  });
  User.findOne({ 'email': email }, (user) => {
    if (user) {
      return res.redirect('/users'
        + '?RegisterError=' + encodeURIComponent('Email is already taken')
        + ((firstname && firstname != "") ? '&firstname=' + encodeURIComponent(firstname) : '')
        + ((lastname && lastname != "") ? '&lastname=' + encodeURIComponent(lastname) : '')
        + ((username && username != "") ? '&username=' + encodeURIComponent(username) : '')
      );
    }
  });
  bcrypt.hash(password1, 10).then((hash) => {
    const user = new User({
      email: email,
      firstname: firstname,
      lastname: lastname,
      username: username,
      password: hash
    });

    user.save().then((data) => {
      return res.redirect('/users');
    }).catch((error) => {
      console.error(error);
    });
  });
});

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  User.getUserById(id, (err, user) => {
    done(err, user);
  });
});
passport.use(new LocalStrategy((username, password, done) => {
  User.getUserByUsername(username, (err, user) => {
    if (err) {
      throw err;
    }
    if (!user) {
      return done(null, false, { message: "Unknown user" });
    }

    User.comparePassword(password, user.password, (err, isMatch) => {
      if (err) return done(err);
      if (isMatch) return done(null, user);
      else return done(null, false, "Invalid Password");
    });
  });
}));

router.post('/login', passport.authenticate('local', { failureRedirect: "/users", failureFlash: "Invalid username or password" }), (req, res) => {
  if (req.body.Redirect)
    return res.redirect('' + req.body.Redirect);
  else
    return res.redirect('/home')
});

router.get('/', ensureNotAuthenticated, function (req, res, next) {
  var handlebarsData = {};
  if (req.query.RegisterError && req.query.RegisterError != "")
    handlebarsData['RegisterError'] = decodeURIComponent(req.query.RegisterError);
  if (req.query.LoginError && req.query.LoginError != "")
    handlebarsData['LoginError'] = decodeURIComponent(req.query.LoginError);
  if (req.query.Redirect && req.query.Redirect != "")
    handlebarsData['Redirect'] = decodeURIComponent(req.query.Redirect);
  if (req.query.firstname)
    handlebarsData['firstname'] = decodeURIComponent(req.query.firstname);
  if (req.query.lastname)
    handlebarsData['lastname'] = decodeURIComponent(req.query.lastname);
  if (req.query.username)
    handlebarsData['username'] = decodeURIComponent(req.query.username);
  if (req.query.email)
    handlebarsData['email'] = decodeURIComponent(req.query.email);

  return res.render('users', handlebarsData);
});

function ensureNotAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) return next();
  res.redirect('/home');
}

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/?Message=' + encodeURIComponent('Successfully Loged out!'));
});

module.exports = router;
