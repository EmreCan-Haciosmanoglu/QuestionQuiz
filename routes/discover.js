const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Quiz = require('../models/Quiz');

router.get('/', ensureAuthenticated, (req, res, next) => {
    var quizData = [];
    var userData = {};
    var quizzes = [];
    Quiz.find({}, (error, qresult) => {
        if (error) {
            console.error(error);
            return res.redirect('/home');
        }
        if (qresult.length < 1) {
            quizData = qresult;
        }

        User.find({}, (error, result) => {
            if (error) {
                console.error(error);
                return res.redirect('/home');
            } else if (result.length > 0) {
                result.forEach((user) => {
                    userData[user._id] = user;
                });
            }

            quizData.forEach((quiz, index) => {
                if (userData[quiz.userId]) {
                    var q = {
                        quizTitle: ((quiz.title.length > 15) ? quiz.title.substring(0, 15) + "..." : quiz.title),
                        questionCount: quiz.question.length,
                        index: index,
                        ownerName: userData[quiz.userId].username,
                        desc: quiz.description,
                        pin: quiz.pin
                    };
                    if (ImageExist(quiz.img))
                        q["quizImage"] = quiz.img;
                    if (ImageExist(userData[quiz.userId].imgURL))
                        q["ownerImage"] = userData[quiz.userId].imgURL;

                    quizzes.push(q);
                }
            });
            res.render('discover', { Trending: quizzes, Discover: quizzes });
        });
    });
});

function ImageExist(url) {
    var img = new Image();
    img.src = url;
    return img.height != 0;
}

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    return res.redirect('/users' +
        '?LoginError=' + encodeURIComponent('You have to Login to see the page') +
        '&Redirect=' + encodeURIComponent(fullUrl)
    );
}

module.exports = router;