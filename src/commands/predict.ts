import * as vexdb from "vexdb";
import {
  MatchesResponseObject,
  EventsResponseObject
} from "vexdb/out/constants/ResponseObjects";
import Command, { makeEmbed, Permissions } from "../lib/command";
import { Message } from "discord.js";


async function predict(
  teams: string[],
  season: string = "current",
  sku?: string
) {
  // Get rankings
  const rankings = await Promise.all(
    teams.map(team =>
      vexdb
        .get("rankings", { team, season, [sku ? "sku" : "--"]: sku })
        .then(ranks => ranks[0])
    )
  );

  if (rankings.some(rank => !rank)) {
    return { invalid: true };
  }

  // OPR and DPR sums
  const red = {
    opr: Math.round(rankings[0].opr + rankings[1].opr),
    dpr: Math.round(rankings[0].dpr + rankings[1].dpr),
    score: 0
  };

  const blue = {
    opr: Math.round(rankings[2].opr + rankings[3].opr),
    dpr: Math.round(rankings[2].dpr + rankings[3].dpr),
    score: 0
  };

  red.score = Math.max(0, Math.round(red.opr + blue.dpr));
  blue.score = Math.max(0, Math.round(blue.opr + red.dpr));

  return { red, blue, rankings };
}

function activeTeams(match: MatchesResponseObject, alliance: "red" | "blue") {
  return [
    match[alliance + "1"],
    match[alliance + "2"],
    match[alliance + "3"]
  ].filter(team => team !== match[alliance + "sit"]);
}

function matchWinner(red, blue) {
  return red > blue ? "red" : red === blue ? "tie" : "blue";
}

export class PredictCommand extends Command("predict") {
  check = Permissions.all;

  documentation() {
    return {
      usage: "predict 3796B 7432E BCUZ 4478X",
      description:
        "Makes a match prediction (first two teams are red, second two are blue)",
      group: "VEX"
    };
  }

  async exec(message: Message, args: string[]) {
    const teams = args.slice(0, 4);

    const season = args.slice(4).join(" ") || "current";
    const { red, blue, rankings, invalid } = await predict(teams, season);

    if (invalid) {
      message.reply("Cannot get rankings for every team");
      return;
    }

    const events = (await Promise.all(
      rankings.map(rank =>
        vexdb
          .get("events", { sku: rank.sku, season })
          .then(event => event[0].name)
      )
    )).filter((s, i, a) => a.indexOf(s) === i);

    const embed = makeEmbed(message)
      .setColor(
        red.score > blue.score
          ? 0xff7675
          : red.score === blue.score
            ? 0xffffff
            : 0x0984e3
      )
      .setTitle(
        `${teams.slice(0, 2).join(" & ")} vs. ${teams.slice(2, 4).join(" & ")}`
      )
      .setDescription(`Event Sources (fewer is better): \n${events.join("\n")}`)
      .addField(
        "Red — " + red.score,
        [`OPR: ${red.opr}`, `DPR: ${red.dpr}`, `Score: ${red.score}`].join("\n")
      )
      .addField(
        "Blue — " + blue.score,
        [`OPR: ${blue.opr}`, `DPR: ${blue.dpr}`, `Score: ${blue.score}`].join(
          "\n"
        )
      );

    return message.channel.send(embed);
  }
}

export default new PredictCommand();
