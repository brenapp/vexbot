import discord from "discord.js";
import { handleMessage } from "./lib/message";
import verify from "./lib/verify";
import report from "./lib/report";

import "./lib/handlers";
import "./lib/web";

const token = process.env.token || require("../config").token;
const client = new discord.Client();

client.on("ready", () => console.log("vexbot#0599 is online!"));
client.on("message", handleMessage);
client.on("guildMemberAdd", verify);

client.on("error", report);

client.login(token);
