import Command, { Permissions } from "../../lib/command";
import { Message } from "discord.js";
import { updateElo } from ".";

export class UpdateEloCommand extends Command("eloupdate") {
  check = Permissions.owner;

  documentation() {
    return {
      description:
        "Updates ELO Rankings for a given season (only call if something is wrong)",
      usage: "eloupdate Tower Takeover",
      group: "VEX",
    };
  }

  async exec(message: Message, args: string[]) {
    const season = args.join(" ");

    await message.channel.send(`Updating ELO rankings for ${season}...`);
    await updateElo(season);
  }
}

new UpdateEloCommand();
