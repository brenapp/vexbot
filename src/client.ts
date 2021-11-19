//
// UNTESTED - DO NOT DEPLOY
//

import { authorization } from "./lib/access";

const { Client, Intents } = require('discord.js');

const intents = [
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MEMBERS,
	Intents.FLAGS.GUILD_BANS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.DIRECT_MESSAGES
];

const client = new Client( { intents: intents } );

client.login(authorization("discord.token") as string);

export { client };