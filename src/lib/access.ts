/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-var-requires */
import delve from "dlv";

export function authorization(access: string | string[]) {
  const file = require("../../authorization.json");
  return delve(file, access) as unknown;
}

export function config(access: string | string[]) {
  const file = require("../../config.json");
  return delve(file, access) as unknown;
}

// Only use verifications on servers that enable it
const behaviors = config("behaviors") as {
  "server-log"?: boolean;
  probation?: boolean;
  "event-log"?: boolean;
  verify?: boolean;
  server: string;
}[];

// Get custom behavior for the specified guild
export async function behavior(guild: string) {
  return behaviors.find((b) => b.server === guild);
}
