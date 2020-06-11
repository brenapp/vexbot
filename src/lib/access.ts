/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-var-requires */
import delve from "dlv";
import * as keya from "keya";

export function authorization(access: string | string[]) {
  const file = require("../../authorization.json");
  return delve(file, access) as unknown;
}

export function config(access: string | string[]) {
  const file = require("../../config.json");
  return delve(file, access) as unknown;
}

export interface ServerConfiguration {
  "server-log": boolean;
  probation: boolean;
  "event-log": boolean;
  verify: boolean;
  prefixes: string[];
}

// Get custom behavior for the specified guild
export async function behavior(guild: string) {
  const store = await keya.store<ServerConfiguration>("serverconfig");
  const defaultConfig: ServerConfiguration = {
    "event-log": false,
    prefixes: ["!", "/"],
    verify: false,
    "server-log": false,
    probation: false,
  };

  // Make sure the configuration exists and has all of the requisite settings
  const current = await store.get(guild);
  const updated: ServerConfiguration = { ...defaultConfig, ...current };

  if (JSON.stringify(current) !== JSON.stringify(updated)) {
    await store.set(guild, updated);
  }

  return updated;
}

export async function setBehavior(
  guild: string,
  config: Partial<ServerConfiguration>
) {
  const store = await keya.store<ServerConfiguration>("serverconfig");

  const old = (await store.get(guild)) ?? {
    "server-log": false,
    probation: false,
    "event-log": false,
    verify: false,
    prefixes: ["!", "/"],
  };
  const updated = { ...old, ...config };

  return store.set(guild, updated);
}
