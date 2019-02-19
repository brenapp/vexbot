import { addCommand } from "../message";
import * as vexdb from "vexdb";

async function predict(teams: string[]) {
  // Get rankings
  const rankings = await Promise.all(
    teams.map(team =>
      vexdb.get("rankings", { team, season: "current" }).then(ranks => ranks[0])
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

addCommand("predict", async (args, message) => {
  const teams = args.slice(0, 4);
  const { red, blue, rankings, invalid } = await predict(teams);

  if (invalid) {
    message.reply("Cannot get rankings for every team");
  }

  // Get event titles for sources
  const events = (await Promise.all(
    rankings.map(rank =>
      vexdb.get("events", { sku: rank.sku }).then(event => event[0].name)
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
            `OPR: ${rankings[0].opr} + ${rankings[1].opr} = ${red.opr}`,
            `DPR: ${rankings[0].dpr} + ${rankings[1].dpr} = ${red.dpr}`,
            `Score: ${red.score}`
          ].join("\n")
        },
        {
          name: "Blue — " + blue.score,
          value: [
            `OPR: ${rankings[2].opr} + ${rankings[3].opr} = ${blue.opr}`,
            `DPR: ${rankings[2].dpr} + ${rankings[3].dpr} = ${blue.dpr}`,
            `Score: ${blue.score}`
          ].join("\n")
        }
      ]
    }
  });

  return true;
});
