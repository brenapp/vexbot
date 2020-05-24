import Command, { Permissions } from "../../lib/command";
import { Message } from "discord.js";
import { updateElo } from ".";
import { Seasons } from "vexdb/out/constants/RequestObjects";

Command({
  names: ["eloupdate"],
  check: Permissions.owner,

  documentation: {
    description:
      "Updates ELO Rankings for a given season (only call if something is wrong)",
    usage: "eloupdate Tower Takeover",
    group: "VEX",
  },

  async exec(message: Message, args: string[]) {
    const season = args.join(" ") as Seasons;

    await message.channel.send(`Updating ELO rankings for ${season}...`);
    await updateElo(season);
  },
});
