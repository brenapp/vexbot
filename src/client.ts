import { Client } from "discord.js";

const token = process.env.token || require("../config").discord.token;
const client = new Client();

client.login(token);

export { client };
