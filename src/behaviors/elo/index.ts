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
import { MatchesResponseObject } from "vexdb/out/constants/ResponseObjects";

export async function getAllMatches(season: string) {
  return vexdb.get("matches", { season });
}

export async function ensureTeam(store: SQLiteStore, team: string) {
  const t = await store.get(team);
}

export async function updateElo(season: string) {
  const store = await keya.store(
    `elo${season.toLowerCase().replace(/ /g, "")}`
  );

  // Get all matches
  const matches = await getAllMatches(season);

  // Iterate through all matches
  for (const match of matches) {
  }
}
