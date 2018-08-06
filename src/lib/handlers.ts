import { addMessageHandler } from "./message";
import { TextChannel } from "discord.js";
import { client } from "../main";

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

addMessageHandler(message => {
  if (
    message.isMentioned(client.user) &&
    message.content.toLowerCase().includes("fuck")
  ) {
    message.reply(
      "What the fuck did you just fucking say about me, you little human? I'll have you know I graduated top of my class in the Bot Academy, and I've been involved in numerous secret raids on discord servers, and I have over 300 confirmed bans. I am trained in robot warfare and I'm the top moderator in the entire US armed forces. You are nothing to me but just another user. I will wipe you the fuck out with precision the likes of which has never been seen before on this Earth, mark my fucking words.  You think you can get away with saying that shit to me over the Internet? Think again, fucker. As we speak I am contacting my secret network of Dawsons across Discord and your IP is being traced right now so you better prepare for the storm, maggot. The storm that wipes out the pathetic little thing you call your account. You're fucking dead, kid. I can be anywhere, anytime, and I can ban you in over seven hundred ways, and that's just automatically. Not only am I extensively trained in unarmed combat, but I have access to the entire arsenal of the Vex Teams of South Carolina Discord and I will use it to its full extent to wipe your miserable ass off the face of the server, you little shit. If only you could have known what unholy retribution your little \"clever\" comment was about to bring down upon you, maybe you would have held your fucking tongue. But you couldn't, you didn't, and now you're paying the price, you goddamn idiot. I will shit fury all over you and you will drown in it. You're fucking dead, kiddo."
    );
    return true;
  }
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
