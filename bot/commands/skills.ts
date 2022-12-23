/**
 * Skills Leaderboard
 **/

import Command, { Permissions } from "~lib/command";
import * as robotevents from "robotevents";
import { EmbedBuilder } from "@discordjs/builders";

const SkillsLeaderboard = Command({
  names: ["skills"],
  documentation: {
    description: "Get the skills leaderboard for South Carolina",
    options: (builder) =>
      builder.addStringOption((option) =>
        option
          .setName("grade")
          .setDescription("Grade Level Leaderboard")
          .setRequired(true)
          .addChoices(
            { name: "High School", value: "High School" },
            { name: "Middle School", value: "Middle School" }
          )
      ),
  },
  check: Permissions.always,
  exec: async (message) => {
    const grade = message.options.getString("grade", true) as
      | "High School"
      | "Middle School";

    const season = await robotevents.seasons.current("VRC")!;
    const leaderboard = await robotevents.v1.getSkillsLeaderboard(season, {
      region: "South Carolina",
      grade_level: grade,
    });

    const body = leaderboard
      .slice(0, 25)
      .map((spot, index) => {
        return `${index + 1}. ${spot.team.team} - ${spot.scores.score} (D: ${
          spot.scores.driver
        }, P: ${spot.scores.programming})`;
      })
      .join("\n");

    const builder = new EmbedBuilder()
      .setTitle(`${grade} Skills Leaderboard`)
      .setDescription("```" + body + "```");

    return message.reply({ embeds: [builder.data] });
  },
});

export default SkillsLeaderboard;
