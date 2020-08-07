import { handleMessage } from "./lib/message";
import { config } from "./lib/access";
import report, { information } from "./lib/report";
import { client } from "./client";

import { DEBUG, debug } from "./commands/debug";

import "./lib/handlers";
import "./metrics";

// Behaviors
import "./behaviors/log";
import "./behaviors/random";
import "./behaviors/eliza";
import * as probation from "./behaviors/probation";

// Commands and message handlers

import "./commands";

client.on("ready", () => {
  debug("Client Ready");

  if (!client.user) {
    console.error("Could not access client user");
    process.exit(1);
  }

  if (process.env["DEV"]) {
    client.user.setActivity("for changes", { type: "WATCHING" });
  } else {
    client.user.setPresence({
      activity: { name: "https://vexbot.bren.app" },
      status: "online",
    });
  }

  probation.initalize();

  debug("Online!");

  if (DEBUG || !process.env["DEV"]) {
    information(client)("PRODUCTION Online!");
  }
});

const reporter = report(client);
process.on("uncaughtException", (e) => (DEBUG ? reporter(e) : null));
process.on("unhandledRejection", (e) => (DEBUG ? reporter(e) : null));

client.on("message", handleMessage);

// When the bot is added, message the owner with a link on how to set me up
client.on("guildCreate", async (guild) => {
  if (!guild.available) return;

  const owner = guild.owner;
  if (!owner) return;

  const dm = await owner.createDM();

  information(client)(`Added to ${guild.name}`);

  dm.send(
    `Hi! I just got added onto ${guild.name}! You can use the \`/config\` command to set me up, and \`/help\` to see what I can do. For more information, refer to https://vexbot.bren.app/docs/ `
  );
});

// Don't store messages for longer than the cleanInterval
const cleanInterval = config("memory.cleanInterval") as number;
setInterval(() => {
  const cleaned = client.sweepMessages(cleanInterval);
  debug(`Cleaned ${cleaned} Messages From Cache`);
}, cleanInterval);

debug(`Set Cache Clear Interval: ${cleanInterval}ms`);
