import { client } from "../../client";
import {
  Guild,
  TextChannel,
  Collection,
  Role,
  GuildMember,
  User
} from "discord.js";
import { makeEmbed } from "../../lib/command";

// Notify #event-log about important events
function serverlog(guild: Guild): TextChannel {
  return guild.channels.find(
    channel => channel.name === "event-log" && channel.type === "text"
  ) as TextChannel;
}

function changedRoles(
  old: Collection<string, Role>,
  current: Collection<string, Role>
): { added: Collection<string, Role>; removed: Collection<string, Role> } {
  const added = current.filter(role => !old.has(role.id));
  const removed = old.filter(role => !current.has(role.id));

  return { added, removed };
}

// Administrative
client.on("guildBanAdd", (guild: Guild, user: User) => {
  const log = serverlog(guild);

  log.send(`:banhammer: ${user} was banned!`);
});

client.on("guildBanRemove", (guild: Guild, user: User) => {
  const log = serverlog(guild);

  log.send(`:banhammer: ${user} was unbanned!`);
});

client.on("guildMemberRemove", (member: GuildMember) => {
  const log = serverlog(member.guild);

  log.send(`:banhammer: ${member} left or was kicked`);
});

// User changes/actions
client.on("guildMemberUpdate", (old, current) => {
  const log = serverlog(old.guild);

  const embed = makeEmbed();

  embed
    .setAuthor(old.user.username, old.user.avatarURL)
    .setTitle("Member Updated");

  if (old.nickname !== current.nickname) {
    embed.addField(
      "Changed Nicknames",
      `\`${old.nickname}\` => \`${current.nickname}\``
    );
  }

  const { added, removed } = changedRoles(old.roles, current.roles);

  if (added.size > 0) {
    embed.addField(
      "Added Roles",
      `${added.map(role => role.toString()).join(" ")}`
    );
  }

  if (removed.size > 0) {
    embed.addField(
      "Removed Roles",
      `${removed.map(role => role.toString()).join(" ")}`
    );
  }

  log.send({ embed });
});
