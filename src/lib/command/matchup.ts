// Predicts the outcome of a match
import { addCommand } from "../message";
import * as vexdb from "vexdb";

addCommand("matchup", async (args, message) => {
  const teams = args;

  const rankings = await Promise.all(
    teams.map(team => vexdb.get("rankings", { team, season: "current" }))
  );

  console.log(rankings);

  return true;
});
