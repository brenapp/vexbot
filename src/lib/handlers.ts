import { addMessageHandler } from "./message";

import "./command";

// Dismiss messages from a bot, we don't take their kind around here!
addMessageHandler(message => message.author.bot);
