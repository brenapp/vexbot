import { addCommand } from "../message";
import * as vexdb from "vexdb";
import {
  MatchesResponseObject,
  EventsResponseObject
} from "vexdb/out/constants/ResponseObjects";

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

addCommand("predict", async (args, message) => {
  const teams = args.slice(0, 4);
  const season = args[4] || "current";
  const { red, blue, rankings, invalid } = await predict(teams);

  if (invalid) {
    message.reply("Cannot get rankings for every team");
  }

  // Get event titles for sources
  const events = (await Promise.all(
    rankings.map(rank =>
      vexdb
        .get("events", { sku: rank.sku, season })
        .then(event => event[0].name)
    )
  )).filter((s, i, a) => a.indexOf(s) === i);

  message.channel.send({
    embed: {
      color:
        red.score > blue.score
          ? 0xff7675
          : red.score === blue.score
          ? 0xffffff
          : 0x0984e3,
      title: `${teams.slice(0, 2).join(" & ")} vs. ${teams
        .slice(2, 4)
        .join(" & ")}`,
      description: `Event Sources (fewer is better): \n${events.join("\n")}`,
      fields: [
        {
          name: "Red — " + red.score,
          value: [
            `OPR: ${red.opr}`,
            `DPR: ${red.dpr}`,
            `Score: ${red.score}`
          ].join("\n")
        },
        {
          name: "Blue — " + blue.score,
          value: [
            `OPR: ${blue.opr}`,
            `DPR: ${blue.dpr}`,
            `Score: ${blue.score}`
          ].join("\n")
        }
      ]
    }
  });

  return true;
});

async function getUpsets(
  matches: MatchesResponseObject[],
  event: EventsResponseObject
) {
  const predictions = await Promise.all(
    matches.map(async match => ({
      prediction: await predict(
        [...activeTeams(match, "red"), ...activeTeams(match, "blue")],
        event.season,
        event.sku
      ),
      match
    }))
  );

  return predictions.filter(
    ({ prediction, match }) =>
      matchWinner(prediction.red.score, prediction.blue.score) !=
      matchWinner(match.redscore, match.bluescore)
  );
}

addCommand("upset", async (args, message) => {
  const [sku] = args;

  const event = (await vexdb.get("events", { sku }))[0];
  if (!event) {
    message.reply("Unknown event SKU!");
  }

  const upsets = {
    R16: [],
    QF: [],
    SF: [],
    F: []
  };

  // Rounds of 16
  const R16 = (await vexdb.get("matches", {
    type: 16,
    sku
  })) as MatchesResponseObject[];
  upsets.R16 = await getUpsets(R16, event);

  const QF = (await vexdb.get("matches", {
    type: 3,
    sku
  })) as MatchesResponseObject[];
  upsets.QF = await getUpsets(QF, event);

  const SF = (await vexdb.get("matches", {
    type: 4,
    sku
  })) as MatchesResponseObject[];
  upsets.SF = await getUpsets(SF, event);

  const F = (await vexdb.get("matches", {
    type: 5,
    sku
  })) as MatchesResponseObject[];
  upsets.F = await getUpsets(F, event);

  return true;
});
