import discord from "discord.js";
import { handleMessage } from "./lib/message";
import report, { information } from "./lib/report";
import { client } from "./client";

// Commands and message handlers
import "./lib/handlers";
import "./commands";

// Behaviors
import "./behaviors/log";
import "./behaviors/random";
import "./behaviors/eliza";
import "./behaviors/restart";
import * as probation from "./behaviors/probation";

client.on("ready", () => {
  console.log("vexbot#0599 is online!");

  if (process.env["DEV"]) {
    client.user.setActivity("with VSCode", { type: "PLAYING" });
  } else {
    client.user.setActivity("over the server", { type: "WATCHING" });
  }

  probation.initalize();

  if (!process.env["DEV"]) {
    information(client)("vexbot#0599 is online!");
  }
});

const reporter = report(client);
process.on("uncaughtException", reporter);
process.on("unhandledRejection", reporter);

client.on("message", handleMessage);
client.on("error", report);
