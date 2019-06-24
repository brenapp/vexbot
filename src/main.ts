import discord from "discord.js";
import { handleMessage } from "./lib/message";
import report from "./lib/report";
import { client } from "./client";

// Commands and message handlers
import "./lib/handlers";
import "./commands";

// Behaviors
import "./behaviors/log";
import "./behaviors/random";
import "./behaviors/eliza";
import * as probation from "./behaviors/probation";
import "./behaviors/volunteers";

client.on("ready", () => {
  console.log("vexbot#0599 is online!");

  if (process.env["DEV"]) {
    client.user.setActivity("with VSCode", { type: "PLAYING" });
  } else {
    client.user.setActivity("over the server", { type: "WATCHING" });
  }

  probation.initalize();
});

const reporter = report(client);
process.on("uncaughtException", reporter);
process.on("unhandledRejection", reporter);

client.on("message", handleMessage);
client.on("error", report);
