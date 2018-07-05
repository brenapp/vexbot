"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var message_1 = require("./message");
message_1.addMessageHandler(function (message) { return message.author.bot; });
message_1.addMessageHandler(function (message) {
    var channel = message.channel;
    console.log(message.author.username + "#" + message.author.discriminator + " in " + (channel.type === "dm" ? "DM" : "#" + channel.name) + ": " + message.content);
    return false;
});
message_1.addMessageHandler(function (message) {
    if (message.content.toLowerCase() == "!ping") {
        message.reply("Pong!");
        return true;
    }
    else {
        return false;
    }
});
