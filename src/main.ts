import discord from "discord.js";
import { handleMessage } from "./lib/message";
import report, { information } from "./lib/report";
import { client } from "./client";

import { DEBUG } from "./commands/debug";

// Commands and message handlers
import "./lib/handlers";
import "./commands";

// Behaviors
import "./behaviors/log";
import "./behaviors/random";
import "./behaviors/eliza";
import "./behaviors/restart";
import "./behaviors/elo";
import * as probation from "./behaviors/probation";

client.on("ready", () => {
  console.log("vexbot#0599 is online!");

  if (process.env["DEV"]) {
    console.log("DEV MODE ENABLED");
    client.user.setActivity("with VSCode", { type: "PLAYING" });
  } else {
    client.user.setActivity("over the server", { type: "WATCHING" });
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
