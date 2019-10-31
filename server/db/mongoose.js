/* This file will handle connection logic to the MongoDB database*/

const mongoose = require('mongoose');

//Use global JS Promise
mongoose.Promise = global.Promise;

//Connect to Datatbase at default port
mongoose.connect('mongodb://localhost:27017/TaskManager', {useNewUrlParser: true, useUnifiedTopology: true}).then(() =>{
console.log("Connected to database successfully")
}).catch((e) => {
    console.log("Error occured while connecting to database");
    console.log(e);
});

//Prevent deprecation warnings
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

module.exports = {
    mongoose
};