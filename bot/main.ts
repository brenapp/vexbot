import { Client, Intents } from "discord.js";
import { COMMANDS, deployGuildCommands, handleCommand } from "./lib/command";
import { token, developmentGuild } from "~secret/discord.json";
import log from "./lib/log";

// Register all of the commands
import "./command";

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
});

client.on("ready", () => {
  log(
    "info",
    `${client.user?.username}#${client.user?.discriminator} is ready!`
  );

  if (process.env.NODE_ENV === "development") {
    log("info", `deploying ${COMMANDS.size} commands to development guild...`);
    deployGuildCommands(developmentGuild);
  }
});

client.on("interactionCreate", handleCommand);

client.login(token);
