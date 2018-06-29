import { Client, DiscordAPIError } from "discord.js";

export default function report(client: Client) {
  return async (error: DiscordAPIError) => {
    let me = await client.fetchUser("274004148276690944");
    me.send(`Error: ${error.code}: ${error.message}`);
  };
}
