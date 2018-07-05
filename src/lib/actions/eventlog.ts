/**
 * Logs about event data in South Carolina
 */

import vexdb from "vexdb";

/**
 * Shims todays date
 * Starts at the beginning of the day March 8, 2018
 * Each time called, jumps 20 minutes
 */
function now() {}

// A log of active events in SC (shimmed for now)
const events: string[] = ["RE-VRC-17-3161"];
