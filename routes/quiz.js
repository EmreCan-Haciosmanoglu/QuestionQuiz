const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
var multer = require('multer');

var storageQuiz = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    cb(null, 'QuizImage-' + Date.now());
  }
});
var uploadQuiz = multer({ storage: storageQuiz });

var storageQuestion = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    cb(null, 'QuestionImage-' + Date.now());
  }
});
var uploadQuestion = multer({ storage: storageQuestion });


router.get('/', ensureAuthenticated, (req, res, next) => {
  const data = {
    'visibility': [
      { option: "To only Me" },
      { option: "To me with friends" },
      { option: "To everyone" },
      { option: "To ONLY Elon Musk" }
    ],
    'location': [
      { option: "Turkey" },
      { option: "China" },
      { option: "USA" },
      { option: "UK" },
      { option: "Mars" }
    ],
    'language': [
      { option: "Turkish" },
      { option: "Chinese" },
      { option: "English" },
      { option: "ElonIsh" }
    ]
  };
  if (req.query.Message) {
    data['Message'] = decodeURIComponent(req.query.Message);
  }
  if (req.query.title) {
    data['title'] = decodeURIComponent(req.query.title);
  }
  if (req.query.description) {
    data['description'] = decodeURIComponent(req.query.description);
  }
  if (req.query.location) {
    const locationData = decodeURIComponent(req.query.location);
    var locationArr = data.location;
    for (let i = 0; i < locationArr.length; i++) {
      if (locationArr[i].option == locationData) {
        var theLocation = locationArr[i];
        theLocation['isSelected'] = true;
      }
    }
  }
  if (req.query.language) {
    const languageData = decodeURIComponent(req.query.language);
    var languageArr = data.language;
    for (let i = 0; i < languageArr.length; i++) {
      if (languageArr[i].option == languageData) {
        var theLanguage = languageArr[i];
        theLanguage['isSelected'] = true;
      }
    }
  }
  if (req.query.visibility) {
    const visibilityData = decodeURIComponent(req.query.visibility);
    var visibilityArr = data.visibility;
    for (let i = 0; i < visibilityArr.length; i++) {
      if (visibilityArr[i].option == visibilityData) {
        var theVisibility = visibilityArr[i];
        theVisibility['isSelected'] = true;
      }
    }
  }
  return res.render('quiz', data);
});

router.get('/question', ensureAuthenticated, (req, res, next) => {
  const quizID = req.query.quiz;
  User.findOne({ username: req.user.username }, (err, user) => {
    if (err) {
      console.error(err);
      res.redirect("/");
    }
    else if (!quizID || quizID == "") {
      res.redirect("/quiz");
    }
    else {
      Quiz.findOne({ userId: user._id, _id: quizID }, (err, quiz) => {
        if (err) {
          console.error(err);
          res.redirect("/quiz");
        }
        else {
          res.render('question', { quizID: quizID });
        }
      });
    }
  });

});

router.post('/', uploadQuiz.single('fileToUpload'), (req, res) => {
  User.findOne({ username: req.user.username }, (err, user) => {
    if (err || !user || user.length == 0) {
      console.error(err);
      req.logOut();
      return res.redirect('/users?LoginError=' + encodeURIComponent('Unauthorized Post Request :\nWe couldn\'t find you in our database!'));
    }
    const { title, description, location, language, visibility } = req.body;

    req.checkBody("title", "Title is required").notEmpty();
    req.checkBody("description", "Description is required").notEmpty();

    var errors = req.validationErrors();
    if (errors && errors.length > 0)
      return res.redirect('/quiz?Message='
        + encodeURIComponent(errors[0].msg)
        + ((title && title != "") ? '&title=' + encodeURIComponent(title) : '')
        + ((description && description != "") ? '&description=' + encodeURIComponent(description) : '')
        + ((location && location != "") ? '&location=' + encodeURIComponent(location) : '')
        + ((visibility && visibility != "") ? '&visibility=' + encodeURIComponent(visibility) : '')
        + ((language && language != "") ? '&language=' + encodeURIComponent(language) : ''));

    pinCreate((pin)=>{
      var quizObj = {
        title: title,
        description: description,
        location: location,
        language: language,
        pin: pin,
        img: req.file ? "uploads\\" + req.file.filename : "noImage.jpg",
        userId: user._id,
        visibleTo: true,
        visibility: visibility,
        question: [],
        active: false,
        date: Date.now()
      };
  
      const quiz = new Quiz(quizObj);
  
      quiz.save().then((result) => {
        res.redirect('/quiz/question?quiz=' + result._id);
      }).catch((error) => {
        if (error) {
          console.error(error);
          res.redirect('/quiz?Message=' + encodeURIComponent("Unknown Error occurred!"));
        }
      });
    });
  });
})

function pinCreate(callback) {
  let randomKey = 0;
  randomKey = Math.floor(Math.random() * 1000000) + 100000;
  Quiz.findOne({ pin: randomKey }).then((data) => {
    if (data) {
      pinCreate(callback);
    } else {
      callback(randomKey);
    }
  });
}

router.post('/question', uploadQuestion.single("fileToUpload"), (req, res) => {
  const quizID = req.body.quizID;
  console.log(req.body);
  //5d63c91a5316873fecaa8a0f
  var question = {
    questionTitle: req.body.title,
    answers: [
      req.body.answer1,
      req.body.answer2,
      req.body.answer3,
      req.body.answer4
    ],
    answer: parseInt(req.body.option, 10),
    time: parseInt(req.body.time, 10) * 10,
    img: req.file ? "uploads\\" + req.file.filename : "noImage.jpg"
  }
  User.findOne({ username: req.user.username }, (err, user) => {
    if (err) {
      console.error(err);
      res.redirect("/");
    }
    else if (!quizID || quizID == "") {
      res.redirect("/quiz");
    }
    else {
      Quiz.findOne({ userId: user._id, _id: quizID }, (err, data) => {
        if (err) {
          console.error(err);
          res.redirect("/quiz/question?quiz=" + quizID);
        }
        else {
          console.log(data);
          data.question.push(question);
          data.save();
          res.redirect("/quiz/question?quiz=" + quizID);
        }
      });
    }
  });
})

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/users?LoginError=' + encodeURIComponent("You have to Login to see the page"));
}
module.exports = router;