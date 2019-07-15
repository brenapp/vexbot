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
  if (process.env["DEV"]) return;
  const log = serverlog(guild);

  const embed = makeEmbed();

  embed.setAuthor(user.username, user.avatarURL).setTitle("Member Banned");

  log.send({ embed });
});

client.on("guildBanRemove", (guild: Guild, user: User) => {
  if (process.env["DEV"]) return;
  const log = serverlog(guild);

  const embed = makeEmbed();

  embed.setAuthor(user.username, user.avatarURL).setTitle("Member Unbanned");

  log.send({ embed });
});

client.on("guildMemberRemove", (member: GuildMember) => {
  if (process.env["DEV"]) return;
  const log = serverlog(member.guild);

  const embed = makeEmbed();

  embed
    .setAuthor(member.user.username, member.user.avatarURL)
    .setTitle("Member Removed")
    .setDescription("This user was kicked, or left the server voluntarily");

  log.send({ embed });
});

// User changes/actions
client.on("guildMemberUpdate", (old, current) => {
  if (process.env["DEV"]) return;
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
