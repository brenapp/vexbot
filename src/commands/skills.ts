/**
 * Gets skills data
 *
 * Options:
 *  /skills BCUZ (shows skills data for a single team)
 *  /skills South Carolina (shows skills info for a given region)
 */

import Command, { Permissions, PREFIX } from "../lib/command";
import { Message, MessageEmbed } from "discord.js";
import * as vexdb from "vexdb";
import { makeEmbed } from "../lib/util";
import {
  TeamsResponseObject,
  SkillsResponseObject,
} from "vexdb/out/constants/ResponseObjects";

function findBest(type: number, skills: SkillsResponseObject[]) {
  let best: SkillsResponseObject | null = null;

  for (const run of skills) {
    if (run.type !== type) continue;

    if (!best) {
      best = run;
    } else if (best.score === run.score && run.attempts < best.attempts) {
      best = run;
    } else if (run.score > best.score) {
      best = run;
    }
  }

  return best;
}

function href(sku: string) {
  return `https://www.robotevents.com/robot-competitions/vex-robotics-competition/${sku}.html`;
}

async function teamRecord(
  team: TeamsResponseObject,
  message: Message
): Promise<MessageEmbed> {
  const embed = makeEmbed(message);

  embed.setAuthor(
    `${team.number} - ${decodeURIComponent(team.team_name)} (${team.region})`
  );

  let body = `**Records** (May not include VEXU skills runs at VRC events)\n`;

  const skills = await vexdb.get("skills", {
    season: "Tower Takeover",
    team: team.number,
  });

  // Find the best in each category
  const best = [0, 1, 2].map((type) => findBest(type, skills));

  for (let type = 0; type <= 2; type++) {
    const challenge = ["Driver Skills", "Programming Skills", "Robot Skills"][
      type
    ];
    const run = best[type];
    if (!run) continue;

    const event = await vexdb
      .get("events", { sku: run.sku })
      .then((ev) => ev[0]);

    body += `🥇 ${challenge} — ${run.score} @ [${event.name}](${href(
      event.sku
    )})\n`;
  }

  body += "\n**Recent Events:**\n";

  // Now, include summaries for the most recent few runs
  const runs = skills.filter((run) => run.type === 2).slice(0, 5);

  for (const run of runs) {
    const event = await vexdb
      .get("events", { sku: run.sku })
      .then((ev) => ev[0]);

    const date = new Date(Date.parse(event.start));

    body += `${run.score} on ${date.toLocaleDateString()} @ [${
      event.name
    }](${href(event.sku)}) (Ranked ${run.rank})\n\n`;
  }

  embed.setDescription(body);

  return embed;
}

export const SkillsCommand = Command({
  names: ["skills"],

  documentation: {
    description: "Gets skills rankings for teams or regions",
    usage: `skills BCUZ or ${PREFIX[0]}skills South Carolina`,
    group: "VEX",
  },

  check: Permissions.all,

  async exec(message: Message, [teamOrRegion]: string[]) {
    // First see if there is a team
    const team = await vexdb.get("teams", { team: teamOrRegion });

    if (team.length > 0) {
      const embed = await teamRecord(team[0], message);

      return message.channel.send({ embed });
    }
  },
});
