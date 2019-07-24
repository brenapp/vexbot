import { client } from "../../client";
import {
  Guild,
  TextChannel,
  Collection,
  Role,
  GuildMember,
  User,
  Message,
  MessageReaction,
  Collector
} from "discord.js";
import { makeEmbed } from "../../lib/command";
import listen from "../../lib/reactions";

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

async function undoMemberChange(old: GuildMember, current: GuildMember) {
  const { added, removed } = changedRoles(old.roles, current.roles);

  // Remove changed roles
  await current.addRoles(removed);
  await current.removeRoles(added);

  // Set old nickname
  current.setNickname(old.nickname);
}

// Administrative
client.on("guildBanAdd", async (guild: Guild, user: User) => {
  if (process.env["DEV"]) return;
  const log = serverlog(guild);

  const embed = makeEmbed();

  embed.setAuthor(user.username, user.avatarURL).setTitle("Member Banned");

  const message = (await log.send({ embed })) as Message;
  await message.react("👎");

  listen(message, ["👎"], reaction => {
    guild.unban(
      user,
      `Vetoed by ${reaction.users.map(user => user.username).join(", ")}`
    );
    embed.addField(
      "Veto",
      reaction.users.map(user => user.username).join(", ")
    );
    message.edit({ embed });
  });
});

client.on("guildBanRemove", async (guild: Guild, user: User) => {
  if (process.env["DEV"]) return;
  const log = serverlog(guild);

  const embed = makeEmbed();

  embed.setAuthor(user.username, user.avatarURL).setTitle("Member Unbanned");

  const message = (await log.send({ embed })) as Message;
  await message.react("👎");

  listen(message, ["👎"], reaction => {
    guild.ban(
      user,
      `Vetoed by ${reaction.users.map(user => user.username).join(", ")}`
    );
    embed.addField(
      "Veto",
      reaction.users.map(user => user.username).join(", ")
    );
    message.edit({ embed });
  });
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
client.on("guildMemberUpdate", async (old, current) => {
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

  const message = (await log.send({ embed })) as Message;
  await message.react("👎");

  listen(message, ["👎"], async reaction => {
    if (old.nickname !== current.nickname) {
      await current.setNickname(old.nickname);
    }

    if (added.size > 0) {
      await current.removeRoles(added);
    }

    if (removed.size > 0) {
      await current.removeRoles(removed);
    }

    embed.addField(
      "Veto",
      reaction.users
        .filter(user => !user.bot)
        .map(user => user.username)
        .join(", ")
    );
    message.edit({ embed });
  });
});
