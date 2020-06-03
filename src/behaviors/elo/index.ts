/**
 * VEX ELO
 * Inspired by the Python script
 * https://github.com/bgrose/VexELOSourceCode
 *
 */

import * as vexdb from "vexdb";
import * as keya from "keya";

import "./commands";
import SQLiteStore from "keya/out/node/sqlite";
import { Seasons } from "vexdb/out/constants/RequestObjects";
import { MatchesResponseObject } from "vexdb/out/constants/ResponseObjects";

// DEFAULTS
const DEFAULT = 1000;
const KFACTOR = 64;

export interface StoredEloRanking {
  // Meta information
  team: string;
  country: string;
  region: string;

  // Actual ELO
  elo: number;

  // Record
  wins: number;
  losses: number;
  ties: number;
}

export async function getAllMatches(
  season: Seasons
): Promise<MatchesResponseObject[]> {
  return vexdb.get("matches", { season, scored: 1 });
}

export async function ensureTeam(
  store: SQLiteStore<StoredEloRanking>,
  number: string
): Promise<StoredEloRanking> {
  let team: StoredEloRanking | null = await store.get(number);

  if (!team) {
    const info = (await vexdb.get("teams", { number }))[0];

    // Get the average elo value (for their region)

    // Get all teams in their region (or country)
    // If teams are in the US or Canada, they have a state/provincials instead of a nationals
    // so they should be considered differently
    const all = (
      await store.all()
    ).filter((record: { key: string; value: StoredEloRanking }) =>
      ["United States", "Canada"].includes(record.value.country)
        ? record.value.region == info.region
        : record.value.country == info.country
    );

    // Get the average elo for the teams above
    let elo =
      all
        .map(({ value }: { value: StoredEloRanking }) => value)
        .reduce((a, b) => a + b.elo, 0) / all.length;

    // Set the default average
    if (!elo) {
      elo = DEFAULT;
    }

    team = {
      team: number,
      country: info.country,
      region: info.region,

      // Leave computational values initalized to defaults
      wins: 0,
      losses: 0,
      ties: 0,

      elo,
    };

    // Set it
    await store.set(number, team);
  }

  return team;
}

export async function updateElo(season: Seasons): Promise<void> {
  const store = await keya.store(
    `elo${season.toLowerCase().replace(/ /g, "")}`
  );

  // Clear the store
  await store.clear();

  // Get all matches
  const matches = await getAllMatches(season);
  console.log(matches.length);

  // Iterate through all matches
  for (const match of matches) {
    const [blue1, blue2] = [
      await ensureTeam(store, match.blue1),
      await ensureTeam(store, match.blue2),
    ];

    const [red1, red2] = [
      await ensureTeam(store, match.red1),
      await ensureTeam(store, match.red2),
    ];

    console.log(red1.team, red2.team, blue1.team, blue2.team);

    // Get predicted ratings (teams averaged together)
    const blueElo = (blue1.elo + blue2.elo) / 2;
    const redElo = (red1.elo + red2.elo) / 2;

    // Match win predictions
    const predictedBlue =
      1 / (1.0 + Math.pow(10.0, (redElo - blueElo) / 400.0));

    const predictedRed = 1 - predictedBlue;

    // Compare to the result
    let actualBlue: number;

    if (match.bluescore > match.redscore) {
      actualBlue = 1;

      blue1.wins++;
      blue2.wins++;

      red1.losses++;
      red2.losses++;
    } else if (match.redscore > match.bluescore) {
      actualBlue = 0;

      red1.wins++;
      red2.wins++;

      blue1.losses++;
      blue2.losses++;
    } else {
      actualBlue = 0.5;

      red1.ties++;
      red2.ties++;

      blue1.ties++;
      blue2.ties++;
    }

    const actualRed = 1 - actualBlue;

    // Changes from output
    const deltaBlue = KFACTOR * (actualBlue - predictedBlue);
    const deltaRed = KFACTOR * (actualRed - predictedRed);

    red1.elo += deltaRed;
    red2.elo += deltaRed;

    blue1.elo += deltaBlue;
    blue2.elo += deltaBlue;

    await Promise.all([
      store.set(red1.team, red1),
      store.set(red2.team, red2),
      store.set(blue1.team, blue1),
      store.set(blue2.team, blue2),
    ]);
  }

  const all = await store.all();

  const rankings = all.sort((a, b) => b.value.elo - a.value.elo);

  console.log(rankings.slice(0, 30));
}
