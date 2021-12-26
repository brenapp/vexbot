import report, { information } from "./lib/report";
import { client } from "./client";
import { debug, DEBUG } from "./lib/debug";
import { handle, register } from "./lib/command";
import { authentication } from "robotevents";
import { authorization } from "./lib/access";
import "./commands";

client.once("ready", () => {
  debug("Client Ready");

  if (!client.user) {
    console.error("Could not access client user");
    process.exit(1);
  }

  if (process.env["DEV"]) {
    client.user.setActivity("for changes", { type: "WATCHING" });
  } else {
    client.user.setActivity("", { url: "https://vexbot.bren.app" });
  }

  debug("Online!");

  if (DEBUG || !process.env["DEV"]) {
    information(client)("PRODUCTION Online!");
  }

  const token = authorization("robotevents.token") as string;
  authentication.setBearer(token);

});

const reporter = report(client);
process.on("uncaughtException", (e) => (DEBUG ? reporter(e) : null));

register();
client.on("interactionCreate", handle);