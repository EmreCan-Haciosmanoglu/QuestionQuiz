const express = require('express');
const router = express.Router();
const User = require('../models/User');
const fs = require('fs');
const Quiz = require('../models/Quiz');

router.post('/delete', ensureAuthenticated, (req, res) => {
  User.findOne({ username: req.user.username }, (err, user) => {
    if (err) {
      console.error(err);
    }
    else {
      Quiz.deleteOne({ userId: user._id, _id: req.body.id }, (err) => {
        console.log(err);
      });
    }
  });
  return res.redirect("/home");
});

function fileExist(filePath, callback1, callback2) {
    fs.access(filePath, fs.F_OK, (err) => {
        if (!err)
            callback1();
        callback2();
    });
}

router.get('/', ensureAuthenticated, (req, res, next) => {

  User.findOne({ username: req.user.username }, (err, user) => {
    if (err) {
      console.error(err);
      req.logOut();
      return res.redirect('/?Message=' + encodeURIComponent('Unknown Error occurred!'));
    }
    Quiz.find({ 'userId': user._id }, (error, quizData) => {
      var quizzes = [];
      if (error) {
        console.error(error);
        req.logOut();
        return res.redirect('/?Message=' + encodeURIComponent('Unknown Error occurred!'));
      }
      quizData.forEach((quiz, index) => {
        var q = {
          id: '' + quiz._id,
          title: quiz.title,
          desc: quiz.description,
          pin: quiz.pin,
          index: index,
          userImage: user.imgURL,
          count: quiz.question.length,
          username: user.username
        }
        fileExist('public\\' + quiz.img, () => { q["img"] = quiz.img; }, () => { });
        quizzes.push(q);
      });
      return res.render('home',
        {
          myQuizzes: quizzes,
          quizCreated: quizzes.length,
          gamePlayed: 0,
          imgURL: user.imgURL,
          firstname: user.firstname,
          lastname: user.lastname,
          username: user.username
        });
    });
  });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  return res.redirect('/users'
    + '?LoginError=' + encodeURIComponent('You have to Login to see the page')
    + '&Redirect=' + encodeURIComponent(fullUrl)
  );
}

module.exports = router;