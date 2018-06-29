import { addMessageHandler } from "./message";

// Dismiss messages from a bot, we don't take their kind around here!
addMessageHandler(message => message.author.bot);

// Message Logging
addMessageHandler(message => {
  console.log(
    `Message from ${message.author.username}#${message.author.discriminator} (${
      message.author.id
    }): ${message.content}`
  );
  return false;
});

// Ping!
addMessageHandler(message => {
  if (message.content.toLowerCase() == "ping") {
    message.reply("Pong!");
    return true;
  } else {
    return false;
  }
});
