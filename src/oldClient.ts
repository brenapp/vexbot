import { Client } from "discord.js";
import { authorization } from "./lib/access";

const token = process.env.token || (authorization("discord.token") as string);
const client = new Client();

client.login(token);

export { client };
