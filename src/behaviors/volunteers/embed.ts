import { Response } from "./responses";
import { RichEmbed } from "discord.js";

export default function volunteerEmbed(response: Response): RichEmbed {
  const embed = new RichEmbed();

  embed
    .setTitle(response.event.name)
    .setDescription(
      `${response.event.date.toLocaleDateString()} @ ${response.event.location}`
    )
    .setColor(
      response.event.sku.split("-")[1] === "VIQC" ? 0x0984e3 : 0xff7675
    );

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
    [
      response.ep.name,
      `[${response.ep.email}](mailto:${response.ep.email})`,
      `[${response.ep.phone}](tel:${response.ep.phone})`
    ].join("\n")
  );

  return embed;
}
