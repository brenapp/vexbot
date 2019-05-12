import discord from "discord.js";
import { handleMessage } from "./lib/message";
import "./lib/verify";
import report from "./lib/report";
import { client } from "./client";

import "./lib/handlers";
import "./lib/command";

// import "./lib/actions/eventlog";

client.on("ready", () => {
  console.log("vexbot#0599 is online!");

  if (process.env["DEV"]) {
    client.user.setActivity("with VSCode", { type: "PLAYING" });
  } else {
    client.user.setActivity("over the server", { type: "WATCHING" });
  }
});
client.on("message", handleMessage);

client.on("error", report);
