/**
 * Super simple event loop for message handling
 */

var handlers = []; 

/**
 * Add a message handler to the stack. Message handling is first-come, first-serve. In order to prevent accidents, handler functions must return true if they act upon a message.
 * This can easily be done by having conditional returns at the top of the function, and returning true at the end
 * @param {(message: Message) => bool} handler The function to handle the message. See description for requirements
 */
function addMessageHandler(handler) {
    if (typeof handler != "function") throw new TypeError("addMessageHandler: first argument handler must be a function")
    return handlers.push(handler) - 1;
}

/**
 * Remove a message handler
 * @param {(message: Message) => bool} handler
 */
function removeMessageHandler(index) {
    console.log(index, handlers[index], handlers);
    // Overwrite with empty function, so as to preserve handler numbers
    handlers[index] = () => false;
}
/**
 * Add a one time message handler to the stack. Message handling is first-come, first-serve. In order to prevent accidents, handler functions must return true if they act upon a message.
 * This can easily be done by having conditional returns at the top of the function, and returning true at the end
 * @param {(message: Message) => bool} handler The function to handle the message. See description for requirements
 */
function addOneTimeMessageHandler(handler) {
    let index = addMessageHandler(function () {
        let res = handler(...arguments);
        if (res) removeMessageHandler(index);
        return res;    
    })
}

/**
 * Handles a message
 * @param {Message} message The message to process
 * @return {Function} The function that handled this message
 */
function handleMessage(message) {
    let i = 0;
    while (!handlers[i++](message) && i < handlers.length);
    return handlers[i];
}

module.exports = {
    addMessageHandler,
    addOneTimeMessageHandler,
    handleMessage
}