import { token } from "@secret/discord.json";
import { Client, Intents } from "discord.js";

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
});

client.on("ready", () => {
  console.log("ready!");
});

client.login(token);
