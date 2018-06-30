import { TextChannel, Channel } from "discord.js";
import { live, cache } from "vexdb";
/**
 * A match log for South Carolina
 * This requires two .live() queries: one which keeps track of active events
 * and one which gets matches from those events
 */

let team = cache.resolve("teams", { team: "3796B" });
console.log(team);

export default function matchLog(channel: Channel) {
  let events = live("events", {
    region: "South Carolina",
    status: "current",
    prefetch: true
  });
  // Don't get matches at first
  let matches = live("matches", { sku: "-1" });

  events.on("fetch", () => {
    matches.params({
      sku: events.current().map(evt => evt.sku)
    });
  });
}
