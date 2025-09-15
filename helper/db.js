const mongoose = require('mongoose');

module.exports = () => {
    mongoose.connect('mongodb+srv://emrecanhaci:e52HCECddqIP0mWI@cluster0.mtcr9zl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useCreateIndex: true });

    mongoose.connection.on('open', () => {
        console.log('MongDB: Connected');
    });
    mongoose.connection.on('error', (err) => {
        console.log('MongDB: Error ' + err);
    });

    mongoose.Promise = global.Promise;

} 
