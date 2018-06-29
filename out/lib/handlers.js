"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var message_1 = require("./message");
message_1.addMessageHandler(function (message) { return message.author.bot; });
message_1.addMessageHandler(function (message) {
    console.log("Message from " + message.author.username + "#" + message.author.discriminator + " (" + message.author.id + "): " + message.content);
    return false;
});
message_1.addMessageHandler(function (message) {
    if (message.content.toLowerCase() == "ping") {
        message.reply("Pong!");
        return true;
    }
    else {
        return false;
    }
});
