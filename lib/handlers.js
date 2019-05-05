const { addMessageHandler, addOneTimeMessageHandler } = require("./message");
const { ask, choose } = require("./prompt");

// Dismiss the message from a bot, we don't take their kind around here!
addMessageHandler(message => message.author.bot);

// Message Logging
addMessageHandler(message => console.log(`Message from ${message.author.username}#${message.author.discriminator}`));

// Ping!
addMessageHandler(
    message => message.content.toLowerCase() == "ping" ? message.reply("Pong!") : false
)
