const discord = require("discord.js");
const { ask } = require("./lib/prompt");
const { handleMessage } = require("./lib/message");
const verify = require("./lib/verify");

require("./lib/handlers"); // Add common sense message handlers

const config = require("./config");

const client = new discord.Client();

client.on("ready", () => console.log("vexbot#0599 is online!"));
client.on("message", handleMessage);
client.on("guildMemberAdd", verify)


client.login(config.token);