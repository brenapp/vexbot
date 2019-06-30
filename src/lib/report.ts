import { Client, DiscordAPIError, Message } from "discord.js";

export default function report(client: Client) {
  return async (error: Error) => {
    let me = await client.fetchUser("274004148276690944");
    return me.send(
      `${process.env["DEV"] ? "DEV MODE" : "PRODUCTION"} ${error.stack}`
    );
  };
}

export function information(client: Client) {
  return async (content: any) => {
    let me = await client.fetchUser("274004148276690944");
    return me.send(content);
  };
}
