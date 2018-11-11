function User(nickName) {
    this.nickName = nickName;
    this.ObjectFlag = 'UserObjectFlag';
}

function Message(user, messageData) {
    this.user = user;
    this.messageData = messageData;
    this.displayNickname = user.nickName + ": ";
    this.ObjectFlag = 'MessageObjectFlag';
}

var app = angular.module("angularMessages", []);
app.controller("ClientController", function ($scope) {
    // chat log.
    $scope.chatMessages = [];
    $scope.userList = [];

    // socket is declared and a User is instantiated in the socket with the nickname "NewUser" so the frontend knows which box to show.
    var socket = io();
    socket.User = new User('NewUser');

    var messageFlag = 'MessageObjectFlag';
    var userFlag = 'UserObjectFlag';

    // variables that are used in the frontend for sumbission of messages/control of CSS properties
    $scope.message = '';
    $scope.nickName = '';
    $scope.changeNickName = false;
    $scope.showNicknameError = false;
    $scope.showNicknameErrorMessage = '';

    socket.on('userListUpdated', function (userList) {
        // $apply updates the chatmessagelist and forces the frontend to update it, because otherwise it gets updated when you type 1 character in the message box.
        $scope.$apply(function () {
            $scope.userList = userList;
        });
    });

    socket.on('chatListUpdated', function (chatMessageList) {
        // $apply updates the chatmessagelist and forces the frontend to update it, because otherwise it gets updated when you type 1 character in the message box.
        $scope.$apply(function () {
            $scope.chatMessages = chatMessageList;
        });
    });

    socket.emit('updateList');
    socket.emit('updateUserList')


    // function to focus the nickname input field when the page loads
    var focusNickNameInput = function(){
        window.setTimeout(function () {
            document.getElementById('nickName').focus();
        }, 0);
    }

    window.onload = focusNickNameInput;

    // submits the chosen Nickname and changes focus to the messageBox.
    $scope.submitNickName = function () {
        $scope.showNicknameError = false;
        $scope.showNicknameErrorMessage = '';
        var nickNameOk = checkIfNickNameValid($scope.nickName);
        if (nickNameOk === true) {
            socket.User.nickName = $scope.nickName;
            // changeNickName is used to control a css class in the frontend.
            $scope.changeNickName = true;
            socket.emit('submitNickName', socket.User);
            // .setTimeout is necessary to make the .focus() work, i don't know why
            window.setTimeout(function () {
                document.getElementById('messageBox').focus();
            }, 0);
        }
        else {
            $scope.showNicknameError = true;
        }
    }

    // checks if the nickname has any invalid characters, commas dollar signs, hash etc. and if the name is unique
    var checkIfNickNameValid = function (nickName) {
        var userList = $scope.userList;
        var cleanNickName = cleanString(nickName);
        if (cleanNickName === nickName) {
            var nameIsUnique = userList.filter(u => u.nickName === cleanNickName);
            if (nameIsUnique.length === 0) {
                return true;
            }
            else {
                $scope.showNicknameErrorMessage = 'Nickname is already taken!'
                return false;
            }
        }
        else {
            $scope.showNicknameErrorMessage = 'Nickname contains invalid characters!'
            return false;
        }
    }

    // emits the message to the server and clears the submit box.
    $scope.submitMessage = function () {
        socket.emit('chat message', new Message(socket.User, $scope.message));
        $scope.message = '';
    }

    // if the string is ">" it applies a special css to it
    $scope.textBefore = function (messageItem) {
        if (messageItem.displayNickname === '> ') {
            return 'unselectable';
        }
        else {
            return 'user';
        }
    }

    // checks each message if you are mentioned in the message and if you are, applies the 'i-am-mentioned' css tag the message
    $scope.amiMentioned = function (message) {
        if (message !== undefined && message.ObjectFlag === 'MessageObjectFlag') {
            if (message.user.nickName !== socket.User.nickName && privateAmiMentioned(message.messageData)) {
                return true;
            }
            else {
                return false;
            }
        }
    }

    // checks each message if you are the one that wrote it, applies the 'msg-own' css tag the message
    $scope.isMyOwnMessage = function (message) {
        if (message !== undefined && message.ObjectFlag === 'MessageObjectFlag') {
            if (message.user.nickName === socket.User.nickName) {
                return true;
            }
            else {
                return false;
            }
        }
    }

    // improves readability in the if statement of the $scope.amiMentioned function
    var privateAmiMentioned = function (msg) {
        msg = cleanString(msg);
        msg = msg.split(' ');
        var mentionedUsers = msg.filter(m => mentionedIn(m));
        if (mentionedUsers !== undefined && Array.isArray(mentionedUsers) && mentionedUsers.length > 0) {
            return true;
        }
        else {
            return false;
        }
    }

    // removing special chars, commas etc for easier searching through string. This can be made more broad with the searches, but for now its ok.
    var cleanString = function (m) {
        var cleanString = m.replace(":", "");
        cleanString = m.replace(/[^a-z\s]/ig, '');
        return cleanString;
    }

    // Enables debugging in the filter function, improves readabili ty.
    var mentionedIn = function (msg) {
        var fixedMsg = cleanString(msg);
        userDisplayNickname = socket.User.nickName;
        if (fixedMsg === userDisplayNickname) {
            return true;
        }
        else {
            return false;
        }

    }    
});