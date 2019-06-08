import { addMessageHandler } from "./message";
import { TextChannel } from "discord.js";
import { client } from "../client";
import { addListener } from "cluster";

import "./command";
import { PREFIX } from "./command";

// Dismiss messages from a bot, we don't take their kind around here!
addMessageHandler(message => message.author.bot);

// Rename #regret to something random
addMessageHandler(async message => {
  if (!PREFIX.includes(message.content[0])) return false;

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
    "dog-leeks",
    "admin-chat",
    "zach-for-gdc",
    "important-studying-chat"
  ];

  const channel = await message.guild.channels.find(
    channel => channel.id === ID
  );

  const name = names[Math.round(Math.random() * (names.length - 1))];
  channel.setName(name);

  return false;
});
