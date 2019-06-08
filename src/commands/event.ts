import { Message } from "discord.js";
import Command, { Permissions, makeEmbed } from "../lib/command";
import * as vexdb from "vexdb";

export class EventCommand extends Command("events") {
  check = () => true;

  async exec(message: Message, args: string[]) {
    const [region = "South Carolina", season = "Turning Point"] = args;
    const events = await vexdb.get("events", { region, season });

    let body = [
      `**${season} Events in ${region}**`,
      ...events.map(
        event =>
          `[${
            event.name
          }](https://www.robotevents.com/robot-competitions/vex-robotics-competition/${
            event.sku
          }.html)`
      )
    ].join("\n");

    message.channel.send(body);
  }
}

export default new EventCommand();
