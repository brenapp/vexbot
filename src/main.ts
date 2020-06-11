import { handleMessage } from "./lib/message";
import report, { information } from "./lib/report";
import { client } from "./client";

import { DEBUG } from "./commands/debug";

import "./lib/handlers";

// Behaviors
import "./behaviors/log";
import "./behaviors/random";
import "./behaviors/eliza";
import "./behaviors/restart";
import "./behaviors/elo";
import "./behaviors/nickname";
import * as probation from "./behaviors/probation";

// Commands and message handlers

import "./commands";

client.on("ready", () => {
  console.log("vexbot#0599 is online!");

  if (!client.user) {
    console.error("Could not access client user");
    process.exit(1);
  }

  if (process.env["DEV"]) {
    console.log("DEV MODE ENABLED");
    client.user.setActivity("for changes", { type: "WATCHING" });
  } else {
    client.user.setActivity("for /help", { type: "WATCHING" });
  }

  probation.initalize();

  if (DEBUG || !process.env["DEV"]) {
    information(client)(
      `${process.env["DEV"] ? "DEV MODE" : "PRODUCTION"} online!`
    );
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
