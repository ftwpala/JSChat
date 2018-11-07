function Message(user, messageData) {
    this.user = user;
    this.messageData = messageData;
    this.displayNickname = user.nickName + ": ";
    this.ObjectFlag = 'MessageObjectFlag';
}
