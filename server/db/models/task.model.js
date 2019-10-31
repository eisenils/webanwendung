const mongoose = require('mongoose');

// Mongoose schema for task model
const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    _listId: { // To ensure the correct relation to which list the task belongs to
        type: mongoose.Types.ObjectId,
        required: true
    }
})

const Task = new mongoose.model('Task', TaskSchema);

module.exports = { Task }