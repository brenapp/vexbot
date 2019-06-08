import { Client, DiscordAPIError } from "discord.js";

export default function report(client: Client) {
  return async (error: Error) => {
    let me = await client.fetchUser("274004148276690944");
    me.send(error.stack);
  };
}
