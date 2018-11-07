var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

// imports of user and message objects
var user = require('../model/User.js');
var message = require('../model/Messages.js');

// programatically get the directory for app.get
var path = require("path");
var directoryPath = path.resolve("./");
var directory = directoryPath.slice(0,-14);

// chat variables
var chatCapacity = 250;
var chatCounter = 0;
var chatMessageList = [];
var userList = [];

// constant variables for checking objects
var messageFlag = 'MessageObjectFlag';
var userFlag = 'UserObjectFlag';

var chatAdd = function (message) {
    if (chatMessageList.length === chatCapacity) {
        chatMessageList.shift()
        chatCounter--;
    }
    // do not count is used only for the first message, it only doesn't count the first time a message is submitted.
    var doNotCount = false;
    if (chatMessageList[chatCounter] !== undefined) {
        if (message.user.nickName === chatMessageList[chatCounter].user.nickName) {
            message.displayNickname = '> ';
        }
    }
    else {
        doNotCount = true;
    }
    chatMessageList.push(message);
    if (doNotCount === false) {
        chatCounter++;
    }
    io.emit('chatListUpdated', chatMessageList);
}

// just a function that returns the chatlog so that when new users connect, they can get the entire thing
var chatUpdate = function () {
    return chatMessageList;
}

// function that pushes a user to the userList when they connect
var userListAdd = function (user) {
    userList.push(user);
    io.emit('userListUpdated',userList);

}

// filters through the userlist and returns a userlist WITHOUT the user in the arguement
var userListRemove = function (user) {
    userList = userList.filter(u => u.nickName !== user.nickName);
    io.emit('userListUpdated',userList);
}

app.get('/', function (req, res) {
    app.use(express.static(directory));
    res.sendFile('/view/index.html', { root: directory });
});

http.listen(port, function () {
    console.log('listening on *:' + port);
});

io.on('connection', function (socket) {
    console.log('New Connection Established');
    var socketUser = socket.user;
    socket.on('chat message', function (message) {
        if (message && message.ObjectFlag === messageFlag) {
            if (message.messageData !== '') {
                chatAdd(message);
            }
        }
    })
    socket.on('updateList', function () {
        io.emit('chatListUpdated', chatMessageList);
    });
    socket.on('updateUserList', function () {
        io.emit('userListUpdated', userList);
    });
    socket.on('submitNickName', function (user) {
        if (user && user.ObjectFlag === userFlag) {
            userListAdd(user);
        }
        socketUser = user;
    });
    socket.on('disconnect', function () {
        if (socketUser && socketUser.ObjectFlag === userFlag) {
            if (socketUser.nickName !== "NewUser") {
                userListRemove(socketUser);
                console.log(socketUser.nickName + ' has disconnected!');
            }
            else
            {
                console.log('A new user has disconnected before submitting a nickname!');
            }
        }
    });
});
