import { addMessageHandler } from "./message";
import { TextChannel } from "discord.js";

// Dismiss messages from a bot, we don't take their kind around here!
addMessageHandler(message => message.author.bot);

// Message Logging
addMessageHandler(message => {
  let channel = message.channel as TextChannel;
  console.log(
    `${message.author.username}#${message.author.discriminator} in ${
      channel.type === "dm" ? "DM" : `#${channel.name}`
    }: ${message.content}`
  );
  return false;
});

// Ping!
addMessageHandler(message => {
  if (message.content.toLowerCase() == "!ping") {
    message.reply("Pong!");
    return true;
  } else {
    return false;
  }
});
