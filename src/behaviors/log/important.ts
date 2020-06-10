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
  Collector,
  MessageEmbed,
  PartialUser,
  PartialGuildMember,
} from "discord.js";
import { makeEmbed } from "../../lib/util";
import listen from "../../lib/reactions";
import { behavior } from "../../lib/access";

// Notify #event-log about important events
function serverlog(guild: Guild): TextChannel {
  return guild.channels.resolve("event-log") as TextChannel;
}

async function enabled(guild: string) {
  const server = await behavior(guild);

  return server && server["event-log"];
}

function changedRoles(
  old: Collection<string, Role>,
  current: Collection<string, Role>
): { added: Collection<string, Role>; removed: Collection<string, Role> } {
  const added = current.filter((role) => !old.has(role.id));
  const removed = old.filter((role) => !current.has(role.id));

  return { added, removed };
}

async function handleVeto(
  message: Message,
  embed: MessageEmbed,
  callback: (
    vote: MessageReaction,
    collector: Collector<string, MessageReaction>
  ) => void
) {
  await message.react("👎");
  listen(message, ["👎"], async (reaction, collector) => {
    if (!embed.fields) return;

    if (embed.fields.some(({ name }) => name === "Veto")) {
      // Update veto field
      embed.fields = embed.fields.slice(0, -1);
      return;
    }

    await callback(reaction, collector);
    embed.addField(
      "Veto",
      reaction.users.cache
        .filter((user) => !user.bot)
        .map((user) => user)
        .join(", ")
    );
    message.edit({ embed });
  });
}

// Administrative
client.on("guildBanAdd", async (guild: Guild, user: User | PartialUser) => {
  if (process.env["DEV"]) return;
  if (!(await enabled(guild.id))) return;

  if (user.partial) {
    user = await user.fetch();
  }

  user = user as User;

  const log = serverlog(guild);

  const embed = makeEmbed();

  embed
    .setAuthor(user.username, user.avatarURL() ?? undefined)
    .setTitle("Member Banned");

  // Establish original actor
  const entry = await guild
    .fetchAuditLogs({ type: "MEMBER_BAN_ADD" })
    .then((audit) => audit.entries.first());

  // Ignore vetos
  if (!entry || entry.executor.bot) {
    return;
  }

  embed.addField("Executor", entry.executor);

  const message = (await log.send({ embed })) as Message;

  handleVeto(message, embed, (reaction) => {
    guild.members.unban(user as User, `Vetoed by ${reaction.users}`);
  });
});

client.on("guildBanRemove", async (guild: Guild, user: User | PartialUser) => {
  if (process.env["DEV"]) return;
  if (!(await enabled(guild.id))) return;

  if (user.partial) {
    user = await user.fetch();
  }

  const log = serverlog(guild);

  const embed = makeEmbed();

  embed
    .setAuthor(user.username, user.avatarURL() ?? undefined)
    .setTitle("Member Unbanned");

  // Establish original actor
  const entry = await guild
    .fetchAuditLogs({ type: "MEMBER_BAN_REMOVE" })
    .then((audit) => audit.entries.first());

  // Ignore vetos
  if (!entry || entry.executor.bot) {
    return;
  }

  embed.addField("Executor", entry.executor);

  const message = (await log.send({ embed })) as Message;
  await message.react("👎");

  handleVeto(message, embed, () => guild.members.ban(user as User));
});

client.on(
  "guildMemberRemove",
  async (member: GuildMember | PartialGuildMember) => {
    if (process.env["DEV"]) return;

    if (member.partial) {
      member = await member.fetch();
    }

    if (!(await enabled(member.guild.id))) return;

    const log = serverlog(member.guild);

    const embed = makeEmbed();

    embed
      .setAuthor(member.user.username, member.user.avatarURL() ?? undefined)
      .setTitle("Member Removed")
      .setDescription("This user was kicked, or left the server voluntarily");

    log.send({ embed });
  }
);

// User changes/actions
client.on("guildMemberUpdate", async (old, current) => {
  if (process.env["DEV"]) return;
  const log = serverlog(old.guild);

  if (old.partial) {
    old = await old.fetch();
  }

  if (current.partial) {
    current = await current.fetch();
  }

  if (!(await enabled(current.guild.id))) return;

  const embed = makeEmbed();

  // Establish original actor
  let entry;

  embed
    .setAuthor(old.user.username, old.user.avatarURL() ?? undefined)
    .setTitle("Member Updated");

  if (old.nickname !== current.nickname) {
    entry = await current.guild
      .fetchAuditLogs({ type: "MEMBER_UPDATE" })
      .then((audit) => audit.entries.first());

    embed.addField(
      "Changed Nicknames",
      `\`${old.nickname}\` → \`${current.nickname}\``
    );
  }

  const { added, removed } = changedRoles(old.roles.cache, current.roles.cache);

  if (added.size > 0 || removed.size > 0) {
    entry = await current.guild
      .fetchAuditLogs({ type: "MEMBER_ROLE_UPDATE" })
      .then((audit) => audit.entries.first());
  }

  if (added.size > 0) {
    embed.addField(
      "Added Roles",
      `${added.map((role) => role.toString()).join(" ")}`
    );
  }

  if (removed.size > 0) {
    embed.addField(
      "Removed Roles",
      `${removed.map((role) => role.toString()).join(" ")}`
    );
  }

  // Ignore vetos
  if (!entry || entry.executor.bot) {
    return;
  }

  embed.addField("Executor", entry.executor);

  const message = (await log.send({ embed })) as Message;
  handleVeto(message, embed, () => {
    if (old.nickname !== current.nickname) {
      return current.setNickname(old.nickname ?? "");
    }

    if (added.size > 0) {
      return current.roles.remove(added);
    }

    if (removed.size > 0) {
      return current.roles.add(removed);
    }
  });
});
