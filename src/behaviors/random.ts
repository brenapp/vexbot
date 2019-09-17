import { addMessageHandler } from "../lib/message";
import { client } from "../client";

import { PREFIX, isCommand } from "../lib/command";
import { DEBUG } from "../commands/debug";
import { code } from "../lib/util";
import { TextChannel } from "discord.js";
import probate from "./probation";

/**
 * Random behaviors
 */

addMessageHandler(message => {
  if (!message.mentions.users.has(client.user.id)) return false;

  const ping = client.emojis.find(emoji => emoji.name === "ping");
  message.react(ping);
});

// Navy Seal Copypasta
addMessageHandler(message => {
  if (
    !message.content.toLowerCase().includes("fuck you")
  ) {
    return false;
  }

  if (!message.mentions.members.some(member => member.user.id === client.user.id)) {
    return false;
  }



  if (process.env["DEV"]) return false;

  message.reply(
    "What the fuck did you just fucking say about me, you little human? I'll have you know I graduated top of my class in the Bot Academy, and I've been involved in numerous secret raids on discord servers, and I have over 300 confirmed bans. I am trained in robot warfare and I'm the top moderator in the entire US armed forces. You are nothing to me but just another user. I will wipe you the fuck out with precision the likes of which has never been seen before on this Earth, mark my fucking words.  You think you can get away with saying that shit to me over the Internet? Think again, fucker. As we speak I am contacting my secret network of Bradleys across Discord and your IP is being traced right now so you better prepare for the storm, maggot. The storm that wipes out the pathetic little thing you call your account. You're fucking dead, kid. I can be anywhere, anytime, and I can ban you in over seven hundred ways, and that's just automatically. Not only am I extensively trained in unarmed combat, but I have access to the entire arsenal of the Vex Teams of South Carolina Discord and I will use it to its full extent to wipe your miserable ass off the face of the server, you little shit. If only you could have known what unholy retribution your little \"clever\" comment was about to bring down upon you, maybe you would have held your fucking tongue. But you couldn't, you didn't, and now you're paying the price, you goddamn idiot. I will shit fury all over you and you will drown in it. You're fucking dead, kiddo."
  );
});

// Rename #regret to something random
addMessageHandler(async message => {
  if (!isCommand(message)) return false;

  if (!message.guild) return false;
  if (message.guild.id != "310820885240217600") return false;

  const ID = "546890655398625286";
  const names = [
    "jennas-boyfriend",
    "regret",
    "bradleys-gay",
    "tylerbad",
    "thanos-cube",
    "gaytanoman",
    "zach-for-head-ref",
    "create-some-ass",
    "bradley-for-head-ref",
    "leeanna-for-emcee",
    "leeanna-for-head-ref",
    "serious-chat",
    "drow-for-gdc",
    "sadie",
    "bradleys-snoring",
    "admin-chat",
    "zach-for-gdc",
    "important-studying-chat",
    "drink-water",
    "yamatos-kitchen",
    "omar-needs-to-hydrate",
    "joels-autons",
    "bradleys-hoes",
    "library",
    "vtotw-3",
    "vtotw-2",
    "a-professional-frat",
    "a-social-frat"
  ];

  const channel = await message.guild.channels.find(
    channel => channel.id === ID
  );

  const name = names[Math.round(Math.random() * (names.length - 1))];
  channel.setName(name);

  return false;
});

addMessageHandler(async message => {

  if (!message.guild) return false;
  if (message.guild.id != "310820885240217600") return false;

  // If we're not in the library, it doesn't apply
  const channel = message.channel as TextChannel;
  if (channel.name !== "library") return false;

  const valid = message.content.startsWith("(") && message.content.endsWith(")");
  if (!valid) {
    message.reply("Shhh!");
    probate(message.member, message.guild.me, "10s", "Shhh!");

  }

});