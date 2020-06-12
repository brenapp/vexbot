import { Client } from "discord.js";
import { authorization, config } from "./lib/access";

const token = process.env.token || (authorization("discord.token") as string);
const client = new Client();

client.login(token);

setInterval(() => {
  const cleaned = client.sweepMessages();
  console.log(`Cleared ${cleaned} messages from cache`);
}, config("memory.cleanInterval") as number);

export { client };
