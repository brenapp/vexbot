const discord = require("discord.js");
const { ask } = require("./lib/prompt");
const { handleMessage } = require("./lib/message");
const verify = require("./lib/verify");

require("./lib/handlers"); // Add common sense message handlers

const token = (process.env.token || require("./config").token);

const client = new discord.Client();

client.on("ready", () => console.log("vexbot#0599 is online!"));
client.on("message", handleMessage);
client.on("guildMemberAdd", verify)


client.login(token);


require("http")
    .createServer((req, res) => res.end(`<iframe src="https://discordapp.com/widget?id=310820885240217600&theme=dark" width="350" height="500" allowtransparency="true" frameborder="0"></iframe>`))
    .listen(process.env.PORT | 5000)