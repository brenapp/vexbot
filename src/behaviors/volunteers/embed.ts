import { Response } from "./responses";
import { RichEmbed, Emoji } from "discord.js";

export default function volunteerEmbed(
  response: Response,
  emoji: Emoji
): RichEmbed {
  const embed = new RichEmbed();

  embed
    .setTitle(response.event.name)
    .setDescription(
      `${response.event.date.toLocaleDateString()} @ ${response.event.location}`
    )
    .setColor(response.event.sku.split("-")[1] === "VIQC" ? 0x0984e3 : 0xff7675)
    .setFooter(`Last updated ${new Date().toLocaleString()}`);

  embed.addField(
    "Volunteers Needed",
    [
      `Judges: ${response.volunteers.judges}`,
      `Referees: ${response.volunteers.judges}`,
      `Field Reset, Queuing, etc.: ${response.volunteers.management}`
    ].join("\n")
  );

  embed.addField(
    "EP Contact",
    [response.ep.name, response.ep.email, response.ep.phone].join("\n")
  );

  embed.addField(
    "Get Involved",
    `React with ${emoji} to be credited for volunteering at this event`
  );

  return embed;
}
