const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
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

const fs = require('fs')
const { promisify } = require('util')

const unlinkAsync = promisify(fs.unlink)


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
  if (req.query.Message) 
    data['Message'] = decodeURIComponent(req.query.Message);
  if (req.query.title) 
    data['title'] = decodeURIComponent(req.query.title);
  if (req.query.description) 
    data['description'] = decodeURIComponent(req.query.description);
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

router.post('/', uploadQuiz.single('fileToUpload'), (req, res) => {
  User.findOne({ username: req.user.username }, async (err, user) => {
    if (err || !user) {
      console.error(err);
      req.logOut();
      return res.redirect('/users?LoginError=' + encodeURIComponent('Unauthorized Post Request :\nWe couldn\'t find you in our database!'));
    }
    const { title, description, location, language, visibility } = req.body;

    await body("title", "Title is required").notEmpty().run(req);
    await body("description", "Description is required").notEmpty().run(req);

    var errors = validationResult(req).array();
    if (errors && errors.length > 0) {
      if (req.file)
        await unlinkAsync(req.file.path)
      return res.redirect('/quiz?Message='
        + encodeURIComponent(errors[0].msg)
        + ((title && title != "") ? '&title=' + encodeURIComponent(title) : '')
        + ((description && description != "") ? '&description=' + encodeURIComponent(description) : '')
        + ((location && location != "") ? '&location=' + encodeURIComponent(location) : '')
        + ((visibility && visibility != "") ? '&visibility=' + encodeURIComponent(visibility) : '')
        + ((language && language != "") ? '&language=' + encodeURIComponent(language) : ''));
    }
    pinCreate((pin) => {
      var quizObj = {
        title: title,
        description: description,
        location: location,
        language: language,
        pin: pin,
        img: req.file ? "uploads\\" + req.file.filename : "uploads\\noImage.jpg",
        userId: user._id,
        visibleTo: true,
        visibility: visibility,
        question: [],
        active: false,
        date: Date.now()
      };

      const quiz = new Quiz(quizObj);

      quiz.save().then((result) => {
        return res.redirect('/quiz/question?quiz=' + result._id);
      }).catch((error) => {
        if (error) {
          console.error(error);
          return res.redirect('/quiz?Message=' + encodeURIComponent('Unknown Error occurred!'));
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

router.get('/question', ensureAuthenticated, (req, res, next) => {
  const quizID = req.query.quiz;
  User.findOne({ username: req.user.username }, (error, user) => {
    if (error || !user) {
      console.error(error);
      req.logOut();
      return res.redirect('/users?LoginError=' + encodeURIComponent('Unauthorized Post Request :\nWe couldn\'t find you in our database!'));
    }
    if (!quizID || quizID == "") {
      return res.redirect('/quiz');
    }
    Quiz.findOne({ userId: user._id, _id: quizID }, (error, quiz) => {
      if (error) {
        console.error(error);
        return res.redirect('/quiz');
      }
      if (!quiz)
        return res.redirect('/quiz')
      var questionCount = quiz.question.length;
      questionCount++;
      const firstDigit = questionCount % 10;

      var data = {
        quizID: quizID,
        Count: '' + questionCount + (firstDigit == 1 ? 'st' : firstDigit == 2 ? 'nd' : firstDigit == 3 ? 'rd' : 'th') + ' Question',
        Time: [
          { value: 5 },
          { value: 10 },
          { value: 15 },
          { value: 20 },
          { value: 25 },
          { value: 30 },
          { value: 35 },
          { value: 40 }
        ]
      }
      if (req.query.ErrorMessage)
        data['ErrorMessage'] = decodeURIComponent(req.query.ErrorMessage);
      if (req.query.SuccessMessage)
        data['SuccessMessage'] = decodeURIComponent(req.query.SuccessMessage);
      if (req.query.title)
        data['title'] = decodeURIComponent(req.query.title);
      if (req.query.answer1)
        data['answer1'] = decodeURIComponent(req.query.answer1);
      if (req.query.answer2)
        data['answer2'] = decodeURIComponent(req.query.answer2);
      if (req.query.answer3)
        data['answer3'] = decodeURIComponent(req.query.answer3);
      if (req.query.answer4)
        data['answer4'] = decodeURIComponent(req.query.answer4);
      if (req.query.option)
        data['option' + req.query.option] = decodeURIComponent(req.query.option);
      if (req.query.time) {
        var timeArray = data['Time'];
        for (var i = 0; i < timeArray.length; i++)
          if (timeArray[i].value == req.query.time) {
            timeArray[i]['isSelected'] = true;
            break;
          }
      }
      return res.render('question', data);
    });
  });
});

router.post('/question', uploadQuestion.single("fileToUpload"), (req, res) => {
  User.findOne({ username: req.user.username }, async (err, user) => {
    if (err) {
      console.error(err);
      req.logOut();
      return res.redirect('/users?LoginError=' + encodeURIComponent('Unauthorized Post Request :\nWe couldn\'t find you in our database!'));
    }

    const { answer1, answer2, answer3, answer4, quizID, title, option, time } = req.body;

    await body('title', 'Title is required').notEmpty().run(req);
    await body('answer1', '1st Answer is required').notEmpty().run(req);
    await body('answer2', '2nd Answer is required').notEmpty().run(req);
    await body('answer3', '3rd Answer is required').notEmpty().run(req);
    await body('answer4', '4th Answer is required').notEmpty().run(req);
    await body('quizID', 'Corrupted page').notEmpty().run(req);

    var errors = validationResult(req).array();
    if (errors && errors.length > 0) {
      if (req.file)
        await unlinkAsync(req.file.path)
      if (errors[0].msg == 'Corrupted page')
        return res.redirect('/quiz?ErrorMessage=' + encodeURIComponent(errors[0].msg));
      else
        return res.redirect('/quiz/question?quiz=' + quizID
          + '&ErrorMessage=' + encodeURIComponent(errors[0].msg)
          + ((time && time != "") ? '&time=' + encodeURIComponent(time) : '')
          + ((title && title != "") ? '&title=' + encodeURIComponent(title) : '')
          + ((option && option != "") ? '&option=' + encodeURIComponent(option) : '')
          + ((answer1 && answer1 != "") ? '&answer1=' + encodeURIComponent(answer1) : '')
          + ((answer2 && answer2 != "") ? '&answer2=' + encodeURIComponent(answer2) : '')
          + ((answer3 && answer3 != "") ? '&answer3=' + encodeURIComponent(answer3) : '')
          + ((answer4 && answer4 != "") ? '&answer4=' + encodeURIComponent(answer4) : '')
        );
    }

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
      time: parseInt(req.body.time, 10),
      img: req.file ? 'uploads\\' + req.file.filename : 'uploads\\noImage.jpg'
    }
    if (!quizID || quizID == "")
      return res.redirect('/quiz?Message=' + encodeURIComponent('First you need to create a quiz'));

    Quiz.findOne({ userId: user._id, _id: quizID }, (err, quiz) => {
      if (err) {
        console.error(err);
        return res.redirect('/quiz?Message=' + encodeURIComponent('Unknown Error occurred!'));
      }
      quiz.question.push(question);
      quiz.save();
      return res.redirect('/quiz/question?quiz=' + quizID + '&SuccessMessage=' + encodeURIComponent('Question Successfully added!'));
    });

  });
})

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  return res.redirect('/users?LoginError=' + encodeURIComponent("You have to Login to see the page") + '&Redirect=' + encodeURIComponent(fullUrl));
}
module.exports = router;