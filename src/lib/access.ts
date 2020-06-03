/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-var-requires */
import delve from "dlv";

export function authorization(access: string | string[]) {
  const file = require("../../authorization.json");
  return delve(file, access);
}

export function config(access: string | string[]) {
  const file = require("../../config.json");
  return delve(file, access);
}
