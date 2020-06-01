/**
 * Tools to help managing Q&A's easier
 *
 * Subcommands:
 *  ask [program] => Links to the form to ASK a Q&A
 *  sub [program] [number] => Sends you DMs when a Q&A gets answered/updated.
 *  search [program] [term] => Searches Q&As
 */

import Command, { Permissions, Subcommand, Group } from "../lib/command";
import { makeEmbed } from "../lib/util";

import cheerio from "cheerio";
import * as keya from "keya";

import "node-fetch";
import { User } from "discord.js";
import { client } from "../client";

const programs = ["VIQC", "VRC", "VEXU", "JUDGING"];
const year = "2020-2021";

export const AskQNACommand = Subcommand({
  names: ["ask"],

  documentation: {
    usage: "ask VEXU",
    description: "Links to the form to ask a Q&A",
    group: "QNA",
  },

  check: Permissions.all,
  async exec(message, [program = "vrc"]) {
    program = program.toUpperCase();

    if (!programs.includes(program)) {
      return message.channel.send(
        `Unknown program \`${program}\`. Valid forums are ${programs.join(
          ", "
        )}`
      );
    }

    return message.channel.send(
      `https://www.robotevents.com/${program}/${year}/QA/ask`
    );
  },
});

interface QNAQuestion {
  link: string;
  title: string;
  answered: boolean;

  author: string;
  timestamp: string;
  tags: string[];

  body: string;
  answer: string | null;
}

async function parseQNA(link: string) {
  let question = { link } as QNAQuestion;

  const response = await fetch(link);

  if (response.status !== 200) {
    return null;
  }

  const page = await response.text();
  const $ = cheerio.load(page);

  const element = $(".question");

  question.title = element
    .find("h4")
    .text()
    .replace(/\n/g, "")
    .trim();
  question.answered = element.find(".answer.approved").html() !== null;

  question.author = element
    .find(".author")
    .text()
    .trim();

  question.timestamp = element
    .find(".timestamp")
    .text()
    .trim();

  const tags: CheerioElement[] = element.find(".tags a.label").get();
  question.tags = tags.map((tag) =>
    $(tag)
      .text()
      .trim()
  );

  question.body =
    element
      .find(".content-body")
      .text()
      .replace("\n", "")
      .trim() ?? "";
  question.answer = element.find(".answer.approved").text() ?? "";

  return question;
}

export const SearchQNACommand = Subcommand({
  names: ["search"],

  documentation: {
    usage: "search VEXU alumium tubing",
    description: "Searches the Q&A for the specified search term",
    group: "QNA",
  },

  check: Permissions.all,
  async exec(message, [program, ...term]) {
    if (!program || !term) {
      return message.channel.send(
        "Need to specify a program and a search term. See help for more information"
      );
    }

    if (!programs.includes(program.toUpperCase())) {
      return message.channel.send(
        `Unknown program \`${program}\`. Valid forums are ${programs.join(
          ", "
        )}`
      );
    }

    const q = term.join(" ");

    const url = `https://www.robotevents.com/${program}/${year}/QA?query=${encodeURIComponent(
      q
    )}`;

    const page = await fetch(url).then((resp) => resp.text());
    const $ = cheerio.load(page);

    const container = $("#front-app .panel .panel-body").children();

    const questions: QNAQuestion[] = [];
    for (let i = 0; i < container.length; i += 4) {
      const element = $(container.slice(i, i + 4));
      const link = element.find("h4 a").attr("href") ?? "";

      const question = (await parseQNA(link)) as QNAQuestion;
      questions.push(question);
    }

    const embed = makeEmbed(message).setURL(url);
    let body = "";

    for (const question of questions.slice(0, 5)) {
      body += [
        `${question.answered ? "✅ " : " "}[**${question.title}**](${
          question.link
        })`,
        `by ${question.author} ${question.timestamp}`,
        question.tags.map((tag) => "`" + tag + "`").join(", "),
      ].join("\n");

      body +=
        "\n*" +
        question.body
          .split(". ")
          .slice(0, 2)
          .join(". ") +
        "*...\n\n";
    }

    if (questions.length < 1) {
      body = "**No Results Found**";
    }

    embed.setDescription(body);

    return message.channel.send({ embed });
  },
});

async function getStore() {
  const store = await keya.store<Set<User>>("qnalistener");

  // Conversion utilities
  store.stringify = (prepared) =>
    JSON.stringify([...prepared].map((user) => user.id));

  store.hydrate = async (string) =>
    new Set(
      await Promise.all(
        (JSON.parse(string) as string[]).map((id) => client.users.fetch(id))
      )
    );

  return store;
}

export const MoniterQNACommand = Subcommand({
  names: ["moniter", "sub"],

  documentation: {
    description: "Notifies you whenever a Q&A gets answered",
    usage: "moniter vexu 613",
    group: "QNA",
  },

  check: Permissions.all,
  async exec(message, [program, question]) {
    if (!programs.includes(program.toUpperCase())) {
      return message.channel.send(
        `Unknown program \`${program}\`. Valid forums are ${programs.join(
          ", "
        )}`
      );
    }
    const link = `https://www.robotevents.com/${program}/${year}/QA/${question}`;
    const qna = await parseQNA(link);

    if (!qna) {
      return message.channel.send(
        `That Q&A is not valid. Make sure you have the right number`
      );
    }

    if (qna.answered) {
      return message.channel.send(
        "That Q&A has been answered already. No changes are to be expected"
      );
    }

    const store = await getStore();

    const listeners = (await store.get(link)) ?? new Set<User>();
    listeners.add(message.author);

    await store.set(link, listeners);

    return message.channel.send(
      `You've subscribed to updates for \`${qna.title}\`! When the question gets answered, you should recieve a DM.`
    );
  },
});

setInterval(async () => {
  console.log("Checking for Q&A answers");

  const store = await getStore();
  const records = await store.all();

  for (const { key, value } of records) {
    const question = await parseQNA(key);

    // If the question got deleted, then just silently fail
    if (!question) {
      await store.delete(key);
      continue;
    }
    // If the question's been answered, notify everyone
    if (question.answered) {
      for (const user of value) {
        const dm = await user.createDM();

        dm.send(
          `The Q&A \`${question.title}\` has been answered! Read the clarification [here](${question.link})`
        );
      }

      await store.delete(key);
    }
  }
}, 10 * 60 * 1000);

const subcommands = [AskQNACommand, SearchQNACommand, MoniterQNACommand];

export const QNACommand = Command({
  names: ["qna"],
  subcommands,

  documentation: {
    usage: "qna",
    description: "Utilites to manage official Q&A questions",
    group: "VEX",
  },

  check: Permissions.all,
  exec: Group(subcommands),
});
