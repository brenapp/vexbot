import { Client, Message } from "discord.js";
import { authorization } from "../lib/access";

const owner = authorization("discord.owner") as string;

export default function report(client: Client) {
  return async (error: Error): Promise<Message> => {
    const me = await client.users.fetch(owner);
    return me.send(
      `${process.env["DEV"] ? "DEV MODE" : "PRODUCTION"} ${error.stack}`
    );
  };
}

export function information(client: Client) {
  return async (content: string): Promise<Message> => {
    const me = await client.users.fetch(owner);
    return me.send(content);
  };
}
