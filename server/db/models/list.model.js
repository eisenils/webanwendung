const mongoose = require('mongoose');

// Mongoose schema for list model
const ListSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    _userId: {
        type: mongoose.Types.ObjectId,
        required: true
    }
})

const List = new mongoose.model('List', ListSchema);

module.exports = { List }