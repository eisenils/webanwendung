const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {mongoose} = require('./db/mongoose');
const jwt = require('jsonwebtoken');

/* Load in the mongoose models*/
const { List, Task, User } = require('./db/models');

/* Load middleware - Parse HTTP request body */
app.use(bodyParser.json());

//CORS HEADERS - append CORS Headers to the responses
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // Update to match the domain you will make the request from
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PATCH, DELETE"); //To allow which methods server can handle
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");
    res.header("Access-Control-Expose-Headers", "x-access-token, x-refresh-token");
    next();
  });

// Check if request has a valid JWT access token  
let authenticate = (req, res, next) => {
    let token = req.header('x-access-token');

    // Verify the token 
    jwt.verify(token, User.getJWTSecret(), (err, decoded) => {
        if(err) {
            // Error occured - jwt is invalid
            res.status(401).send(err);
        } else {
            // jwt is valid
            req.user_id = decoded._id;
            next();
        }
    });
}

// Verify Refresh Token Middleware - will be verifying the session
let verifySession = (req, res, next) => {
    // Take refresh token from the request header
    let refreshToken = req.header('x-refresh-token');

    //Take _id from the request header
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if(!user) {
            // User couldn't be found
            return Promise.reject({
                'error' : 'User not found. Refresh token or user id may invalid'
            });
        }

        // User was found - Session is valid
        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;
        
        // Check if session is expired
        user.sessions.forEach((session) => {
            if(session.token === refreshToken){
                if(User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    // Refresh token has not expired
                    isSessionValid = true;
                }
            }
        });

        //Checks if session is valid
        if(isSessionValid) {
            // Session is valid; call next() to continue request
            next();
        } else{
            // Session is not valid
            return Promise.reject({
                'error' : 'Refresh token has expired or session is invalid'
            })
        }
    }).catch((e) => {
        res.status(401).send(e);
    })
}

/**
 * LIST ROUTES
 */

/* GET /lists - Get all lists */
app.get('/lists', authenticate, (req,res)=> {
    // Return an array of all the lists that belong to the authenticated user
    List.find({
        _userId: req.user_id
    }).then((lists) => {
        res.send(lists);
    });
});

/* POST /lists - Creat a list */
app.post('/lists', authenticate, (req,res)=> {
    // Create new lists and retur new list document back to user 
    let title = req.body.title;
    let newList = new List({
        title,
        _userId: req.user_id
    });
    newList.save().then((listDoc) => {
        // Full list document will be returned
        res.send(listDoc);
    })
});

/* PATCH /lists/:id - Update specified list */
app.patch('/lists/:id', authenticate, (req,res)=> {
    // Update the list with the new values
    List.findOneAndUpdate({ 
        _id: req.params.id, 
        _userId: req.user_id
    }, {
        $set: req.body
    }).then(() => {
        res.sendStatus(200);
    });
});

/* DELETE /lists/:id - Delete a list */
app.delete('/lists/:id', authenticate, (req,res)=> {
    // Delete the specified lists
    List.findOneAndRemove({
        _id: req.params.id,
        _userId: req.user_id
    }).then((removedListDoc) => {
        res.send(removedListDoc);

        // Delete all tasks in the deleted list
        deleteTasksFromList(removedListDoc._id);
    });
});

/**
 * TASK ROUTES
 */

/* GET /lists/:listId/tasks - Get all tasks in a specified list */
app.get('/lists/:listId/tasks', authenticate, (req,res) => {
    //Return all tasks that belong to a specific list
    Task.find({
        _listId: req.params.listId
    }).then((tasks) =>{
        res.send(tasks);
    });
});

/* POST /lists/:listId/tasks - Create a new task in the specified list */
app.post('/lists/:listId/tasks', authenticate, (req,res)=> {
    //Create a new task in the specified ist by listId
    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if(list){
            // List object is valid - User can create tasks
            return true;
        }
        return false;
    }).then((canCreateTask) => {
        if(canCreateTask) {
            let newTask = new Task({
                title: req.body.title,
                _listId: req.params.listId
            });
            newTask.save().then((newTaskDoc) => {
                res.send(newTaskDoc);
            })
        } else{
            res.sendStatus(403);
        }
    })
});

/* PATCH /lists/:listId/tasks/:taskId -  Upadate an existing task */
app.patch('/lists/:listId/tasks/:taskId', authenticate, (req,res) => {
    //Upadate an existing task by taskId
    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if(list) {
            // List object is valid - User can update task
            return true;
        }
        return false;
    }).then((canUpdateTasks) => {
        if(canUpdateTasks) {
            Task.findOneAndUpdate({
                _id: req.params.taskId,
                _listId: req.params.listId
            }, {
                    $set: req.body
            }
            ).then(() => {
                res.send({message: 'Updated sucessfully'});
            })
        } else {
            res.sendStatus(403);
        }
    })
    
});

/* DELETE /lists/:listId/tasks/:taskId - Delete a task */
app.delete('/lists/:listId/tasks/:taskId', authenticate, (req,res)=> {
    // Delete the specified lists
    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if(list) {
            // List object is valid - User can update task
            return true;
        }
        return false;
    }).then((canDeleteTasks) => {
        if(canDeleteTasks) {
            Task.findOneAndRemove({
                _id: req.params.taskId,
                _listId: req.params.listId
            }).then((removedTaskDoc) => {
                res.send(removedTaskDoc);
            });
        } else {
            res.sendStatus(403);
        }
    })

});

/**
 * USER ROUTES
 */

 /* POST /users - Sign up */
 app.post('/users', (req, res) => {
     // User sign up
     let body = req.body;
     let newUser = new User(body);

     newUser.save().then(() => {
         return newUser.createSession();
     }).then((refreshToken) =>{
         // Session created successfully - refreshToken returned

         return newUser.generateAccessAuthToken().then((accessToken) => {
             // Access to the AuthToken sucessfully
             return{accessToken, refreshToken}
         });
     }).then((authToken) => {
         // Construct and send response to the User with AuthToken in header and user object in body
         res
            .header('x-refresh-token', authToken.refreshToken)
            .header('x-access-token', authToken.accessToken)
            .send(newUser);
     }).catch((e) => {
         res.status(400).send(e);
     })
 })

/* POST /users/login - Login */
app.post('/users/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
         // Session created successfully - refreshToken returned
         return user.generateAccessAuthToken().then((accessToken) => {
            // Access to the AuthToken sucessfully
            return {accessToken, refreshToken}
        });
        }).then((authToken) => {
            // Construct and send response to the User with AuthToken in header and user object in body
            res
            .header('x-refresh-token', authToken.refreshToken)
            .header('x-access-token', authToken.accessToken)
            .send(user);
        })
    }).catch((e) => {
        res.status(400).send(e);
    });
})

/* GET /users/me/access-token - Generates and returns an access token */
app.get('/users/me/access-token', verifySession, (req, res) => {
    // User is authenticated and user_id and user object is available
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({accessToken});
    }).catch((e) =>{
        res.status(400).send(e);
    });
})

/* Helper Methods */
let deleteTasksFromList = (_listId) => {
    Task.deleteMany({
        _listId
    }).then(() => {
        console.log('Tasks were deleted');
    })
}

app.listen(3000, () => {
    console.log("Server is listening on port 3000");
})