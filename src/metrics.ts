/**
 * Custom Metrics for PM2
 */

import * as io from "@pm2/io";

export const CommandSuccess = io.metric({
  name: "Command Success",
});

export const CommandFailure = io.metric({
  name: "Command Failure",
});

export const MessageProcessed = io.metric({
  name: "Messages Processed",
});
