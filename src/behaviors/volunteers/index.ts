import getResponses from "./responses";
import volunteerEmbed from "./embed";
import { client } from "../../client";
import { TextChannel } from "discord.js";
import { information } from "../../lib/report";

const CHANNEL = "592454646476308490";

getResponses().then(res => {
  const report = information(client);

  res.forEach(resp => {
    let embed = volunteerEmbed(resp);
    report({ embed });
  });
});
