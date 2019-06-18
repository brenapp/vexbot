import { Message } from "discord.js";
import Command, { Permissions, makeEmbed } from "../lib/command";
import * as vexdb from "vexdb";

export class EventCommand extends Command("events") {
  check = Permissions.all;

  documentation() {
    return {
      description: "Lists events in a given region",
      usage: "events South Carolina",
      group: "VEX"
    };
  }

  async exec(message: Message, args: string[]) {
    const [region = "South Carolina"] = args;
    const events = await vexdb.get("events", { region });

    let body = [
      `**Events in ${region}**`,
      ...events.map(
        event =>
          `[${
            event.name
          }](https://www.robotevents.com/robot-competitions/vex-robotics-competition/${
            event.sku
          }.html)`
      )
    ].join("\n");

    return message.channel.send(body);
  }
}

export default new EventCommand();
