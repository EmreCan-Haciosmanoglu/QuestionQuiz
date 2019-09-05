const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const fs = require('fs');

router.get('/', ensureAuthenticated, (req, res, next) => {
    var quizData = [];
    var userData = {};
    var quizzes = [];
    Quiz.find({}, (error, qresult) => {
        if (error) {
            console.error(error);
            return res.redirect('/home');
        }
        quizData = qresult;

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
                    fileExist('public\\' + quiz.img, () => { q["quizImage"] = quiz.img; }, () => {
                        fileExist('public\\' + userData[quiz.userId].imgURL, () => {  q["ownerImage"] = userData[quiz.userId].imgURL; }, () => {

                        });
                    });

                    quizzes.push(q);
                }
            });
            res.render('discover', { Trending: quizzes, Discover: quizzes });
        });
    });
});

function fileExist(filePath, callback1, callback2) {
    fs.access(filePath, fs.F_OK, (err) => {
        if (!err)
            callback1();
        callback2();
    });
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