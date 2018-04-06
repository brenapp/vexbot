const discord = require("discord.js");
const { ask } = require("./lib/prompt");
const { handleMessage } = require("./lib/message");
const verify = require("./lib/verify");

// Independent Modules
require("./lib/handlers"); // Add common sense message handlers
require("./lib/web"); // Web Server


const client = new discord.Client();

client.on("ready", () => console.log("vexbot#0599 is online!"));
client.on("message", handleMessage);
client.on("guildMemberAdd", verify)


const token = (process.env.token || require("./config").token);
client.login(token);