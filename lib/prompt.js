/**
 * Toolkit to assist in specific interactions with users. Used for beginning prompt
 * TODO: Migrate Library to Object System
 */

const { addOneTimeMessageHandler } = require("./message");

/**
 * Ask the user a question in a TextChannel
 * @param {string} question
 * @param {TextChannel} channel
 * @param {User} [user]
 * @return {Promise<Message>}
 */
function ask(question, channel, user) {
    channel.send(question);
    return new Promise((resolve, reject) => {
        addOneTimeMessageHandler(message => {
            if (channel.id !== message.channel.id) return;
            if (user && user.id !== message.author.id) return;
            resolve(message)
        });
    });
}

/**
 * Same as ask(), but returns the message instead of the object
 * @param {string} question
 * @param {TextChannel} channel
 * @param {User} [user]
 * @return {Promise<string>}
 */
function askString(question, channel, user) {
    return ask(question, channel, user).then(message => message.content);
}

/**
 * Allows the user the choose from a number of options
 * @param {string} question The question to ask
 * @param {array<string>[][]} options 2D Array of options (and alternate names for them). Responses are uppercased, and options should be in all uppercase
 * @param {TextChannel} channel 
 * @param {User} user 
 * @return {Promise<string>}
 */
function choose(question, options, channel, user) {
    return questionValidate(
        question,
        response => options.find(opts => opts.includes(response.toUpperCase()))[0],
        "I'm not sure I understand what you mean.",
        channel,
        user
    )
}

function questionValidate(question, validate, failureMessage, channel, user) {
    return askString(question, channel, user)
        .then(response => {
            let res = validate(response);
            return res ? res : (channel.send(failureMessage) && questionValidate(question, validate, failureMessage, channel, user))
        });
}


module.exports = {
    ask,
    question: askString,
    choose,
    questionValidate
}