/**
 * Logs about event data in South Carolina
 */

import vexdb from "vexdb";

/**
 * Shims todays date
 * Starts at the beginning of the day March 8, 2018
 * Each time called, jumps 20 minutes
 */
let callcount = 0;
function now() {
  let start = 1520674200000;
  return new Date(start + callcount++ * 20 * 60 * 1000);
}

// A log of active events in SC (shimmed for now)
const events = ["RE-VRC-17-3161"];

let MatchLog = vexdb.live("matches", {
  sku: "RE-VRC-17-3161",
  scored: 1
});
MatchLog.on("item", match => console.log(match));
MatchLog.on("fetch", () => console.log("fetch", MatchLog.current()));
