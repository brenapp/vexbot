import Command, { Permissions } from "../lib/command";
import * as robotevents from "robotevents";
import { Team } from "robotevents/out/endpoints/teams";
import { EmbedBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { APIEmbedField } from "discord-api-types/v9";
import { Match } from "robotevents/out/endpoints/matches";
import { ProgramAbbr } from "robotevents/out/endpoints/programs";
import log from "~lib/log";

export function getOutcomes(id: number, matches: Match[]) {
  let wins = 0;
  let losses = 0;
  let ties = 0;

  function matchOutcome(match: Match) {
    const alliance = match.alliances.find(
      (alliance) =>
        alliance.teams.find((team) => team.team.id === id) !== undefined
    )!;
    const opponent = match.alliances.find(
      (alliance) =>
        alliance.teams.find((team) => team.team.id === id) === undefined
    )!;

    if (alliance.score > opponent.score) {
      return "win";
    } else if (alliance.score < opponent.score) {
      return "loss";
    } else {
      return "tie";
    }
  }

  for (const match of matches) {
    const outcome = matchOutcome(match);
    if (outcome === "win") {
      wins++;
    } else if (outcome === "loss") {
      losses++;
    } else {
      ties++;
    }
  }

  return { wins, losses, ties };
}

function getAwardEmoji(title: string) {
  const awards = {
    Excellence: "⭐️",
    "Tournament Champions": "🏆",
    "Design Award": "📒",
    "Robot Skills Champion": "👩‍💻",
    "Robot Skills 2nd Place": "🥈",
    "Robot Skills 3rd Place": "🥉",
    "Tournament Finalists": "🏅",
    "Tournament Semifinalists": "🥈",
    "Tournament Quarterfinalists": "🥉",
    "Division Champions": "🏆",
    "Division Finalists": "🏅",
    "Judges Award": "👩‍⚖️",
    "Amaze Award": "😍",
    "Innovate Award": "💡",
    "Think Award": "🤔",
    "Build Award": "🔨",
    "Create Award": "🅱️",
    "Sportsmanship Award": "🏀",
    "Inspire Award": "⚡️",
  };

  const award = Object.entries(awards).find(([shortName]) =>
    title.includes(shortName)
  );

  return award ?? [title, ""];
}

async function getEmbed(team: Team, interaction: CommandInteraction) {
  const events = await team.events({
    season: [robotevents.seasons.get(team.program.code, "2022-2023")!],
  });

  const eventIds = events.array().map((event) => event.id);

  const matches = await team.matches({ event: eventIds });
  const awards = await team.awards({ event: eventIds });

  const matchesBySku = matches.group((match) => match.event.code);
  const awardsBySku = awards.group((award) => award.event.code);

  // Get team overall information
  const record = getOutcomes(team.id, matches.array());
  let winRate =
    (record.wins / (record.wins + record.losses + record.ties)) * 100;

  if (isNaN(winRate)) {
    winRate = 0;
  }

  let description = `${team.location.city}, ${team.location.region}\n`;
  description += `Record: ${record.wins}-${record.losses}-${
    record.ties
  } (${winRate.toFixed(2)}% WR)`;

  // General event records
  const fields: APIEmbedField[] = events
    .array()
    .map((event) => {
      let value = "";
      const start = new Date(event.start);

      value += `*${start.toLocaleDateString()}*\n`;
      const matches = matchesBySku[event.sku] ?? [];
      const awards = awardsBySku[event.sku] ?? [];
      const { wins, losses, ties } = getOutcomes(team.id, matches);

      if (matches.length > 0 && new Date(event.start).getTime() < Date.now()) {
        value += `Event Record: ${wins}-${losses}-${ties}\n`;
      }

      if (awards.length > 0) {
        for (const award of awards) {
          const [name, emoji] = getAwardEmoji(award.title);
          value += `${emoji} ${name}\n`;
        }
      }

      const field = { name: event.name, value };

      return field;
    })
    .slice(0, 25);

  const builder = new EmbedBuilder()
    .setTitle(`${team.program.code} ${team.number} ${team.team_name}`)
    .setDescription(description)
    .addFields(...fields);

  return builder.data;
}

const TeamCommand = Command({
  names: ["team"],
  documentation: {
    description: "Pong!",
    options: (builder) =>
      builder
        .addStringOption((option) =>
          option
            .setName("number")
            .setRequired(true)
            .setDescription("The team number to look up (ex. 8926W)")
        )
        .addStringOption((option) =>
          option
            .setName("program")
            .setRequired(false)
            .setDescription("The program this team competes in (ex. VRC)")
            .setChoices(
              { name: "VRC", value: "VRC" },
              { name: "VEXU", value: "VEXU" },
              { name: "VAIC", value: "VAIC" }
            )
        ),
  },
  check: Permissions.always,

  async exec(interaction) {
    const number = interaction.options.get("number", true).value as string;
    let program = [
      (interaction.options.get("program", false)?.value ??
        null) as ProgramAbbr | null,
    ];

    if (!program[0]) {
      program = ["VRC", "VEXU", "VAIC"];
    }

    let programIds = program.map(
      (program) => robotevents.programs.get(program as ProgramAbbr)!
    );
    const teams = await robotevents.teams.search({
      number: [number],
      program: programIds,
    });

    if (teams.length < 1) {
      return interaction.reply(`Team \`${number}\` cannot be found.`);
    }

    const team = teams[0];
    log(
      "info",
      `team: lookup ${team.number} initiated by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id}) in ${interaction.guild?.name} (${interaction.guild?.id}) `
    );

    const embed = await getEmbed(team, interaction);

    try {
      interaction.reply({ embeds: [embed] });
    } catch (e) {
      interaction.reply("Could not create embed.");
    }
  },
});

export default TeamCommand;
