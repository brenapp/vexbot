import { Client } from "discord.js";

const token = process.env.token || require("../config").token;
const client = new Client();

client.login(token);

export { client };
