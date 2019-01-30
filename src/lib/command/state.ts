import { addCommand } from "../message";
import * as vexdb from "vexdb";
import {
  EventsResponseObject,
  AwardsResponseObject
} from "vexdb/out/constants/ResponseObjects";

function qualStatement(awards: AwardsResponseObject[]) {
  let excellence = awards.filter(award => award.name.includes("Excellence"));
  let champs = awards.filter(award =>
    award.name.includes("Tournament Champions")
  );
  let design = awards.filter(award => award.name.includes("Design"));

  return `${excellence.length > 0 ? `Excellence ${excellence.length}x; ` : ""}${
    champs.length > 0 ? `Champs ${champs.length}x; ` : ""
  }${design.length > 0 ? `Design ${design.length}x` : ""}`;
}

addCommand("statequals", async (args, message) => {
  const region = args.join(" ") || "South Carolina";

  const events = (await vexdb.get("events", {
    region,
    season: "current"
  })).map((evt: EventsResponseObject) => evt.sku);

  const awards = (await vexdb.get("awards", { sku: events })).filter(
    award =>
      award.name.includes("Excellence") ||
      award.name.includes("Tournament Champion") ||
      award.name.includes("Design")
  );

  const totals = {};
  awards.forEach(award => {
    if (totals[award.team]) {
      totals[award.team].push(award);
    } else {
      totals[award.team] = [award];
    }
  });

  const ranked = Object.keys(totals).sort(
    (a, b) => totals[b].length - totals[a].length
  );

  message.channel.send({
    embed: {
      color: 3447003,
      title: `STATE QUALIFICATIONS LEADERBOARD (${region})`,
      description: ranked
        .slice(0, 10)
        .map(
          (team, i) =>
            `${i + 1}. ${team} — ${
              totals[team].length
            } qualifications (${qualStatement(totals[team])})`
        )
        .join("\n")
    }
  });
  return true;
});

addCommand("invites", async (args, message) => {
  return true;
});
