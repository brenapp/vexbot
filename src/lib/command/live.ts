import { addCommand } from "../message";
import { client } from "../../client";
import * as vexdb from "vexdb";

addCommand("live", async (args, message) => {
  const sku = args[0];
  const guild = message.guild;

  // Get the event
  const event = (await vexdb.get("events", { sku }))[0];

  if (!event) {
    message.reply("There doesn't appear to be an event with that SKU");
  }

  if (guild.channels.find("name", sku)) {
    // Create the channel if it doesn't exist
  }
  return true;
});
