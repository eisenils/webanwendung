const mongoose = require('mongoose');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * JWT SECRET
 */
const jwtSecret = "1yXLTmOW4POIFDkDmoBbRLD7FVrhcEHGwNGWyfyt"

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    sessions: [{
        token: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Number,
            required: true
        }
    }]
});

/* Instance methods */

// Return document except of the password and sessions
UserSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();

    return _.omit(userObject, ['password', 'sessions']);
}

// Create the JSON Web Token and return it (for sign in)
UserSchema.methods.generateAccessAuthToken = function() {
    const user = this;
    return new Promise((resolve, reject) => {
        jwt.sign({ _id: user._id.toHexString() }, jwtSecret, { expiresIn: "1m"}, (err, token) => {
            if(!err) {
                resolve(token);
            } else {
                reject();
            }
        })
    })
}

// Generates a 64 byte hex string
UserSchema.methods.generateRefreshAuthToken = function() {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buffer)  => {
            if(!err) {
                let token = buffer.toString('hex');
                return resolve(token);
            }
        })
    })
}

UserSchema.methods.createSession = function() {
    let user = this;

    return user.generateRefreshAuthToken().then((refreshToken) => {
        return saveSessionToDatabase(user, refreshToken);
    }).then((refreshToken) => {
        // Saved to database successfully
        return refreshToken;
    }).catch((e) => {
        return Promise.reject('Failed to save session in database\n' + e);
    })
}

/* Middleware */

// Before a user document is saved, this code runs
UserSchema.pre('save', function (next) {
    let user = this;
    let costFactor = 10;

    // if password field has been edited run this code
    if(user.isModified('password')) {
        // Generate salt and hash password
        bcrypt.genSalt(costFactor, (err, salt)  => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            })
        })
    } else {
        next();
    }
});

/* Model methods */

UserSchema.statics.getJWTSecret = () =>{
    return jwtSecret;
}

// Finds a user by id and token
UserSchema.statics.findByIdAndToken = function(_id, token) {
    const User = this;

    return User.findOne({
        _id,
        'sessions.token': token
    });
}

UserSchema.statics.findByCredentials = function (email, password) {
    let User = this;
    return User.findOne({ email}).then((user) => {
        if(!user) return Promise.reject();

        return new Promise((resolve, reject)  => {
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) resolve(user);
                else {
                    reject();
                }
            })
        })
    })
}

UserSchema.statics.hasRefreshTokenExpired = (expiresAt) => {
    let secondsSinceEpoch = Date.now()/ 1000;
    if(expiresAt > secondsSinceEpoch) {
        // Hasn't expired
        return false;
    } else{
        // Has expired
        return true;
    }
}

/* Helper mehods */

// Save session to database
let saveSessionToDatabase = (user, refreshToken) => {
    return new Promise((resolve, reject) => {
        let expiresAt = generateRefreshTokenExpiryTime()

        user.sessions.push({ 'token': refreshToken, expiresAt});

        // Saved session sucessfully
        user.save().then(() => {
            return resolve(refreshToken);
        }).catch((e) => {
            reject(e);
        });
    })
} 

// Generate a UNIX timestamp from now for 7 days
let generateRefreshTokenExpiryTime = () => {
    let daysUntilExpire = "7";
    let secondsUntilExpire = ((daysUntilExpire *24) *60) *60;
    return ((Date.now() / 1000) * secondsUntilExpire);
}

const User = mongoose.model('User', UserSchema);

module.exports = { User}