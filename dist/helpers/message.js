"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInfoEmbed = exports.createErrorEmbed = exports.createEmbed = void 0;
const discord_js_1 = require("discord.js");
function createEmbed() {
    return new discord_js_1.MessageEmbed().setColor('#a600ff');
}
exports.createEmbed = createEmbed;
function createErrorEmbed(message) {
    return new discord_js_1.MessageEmbed().setColor('#ff3300').setTitle('Error').setDescription(message);
}
exports.createErrorEmbed = createErrorEmbed;
function createInfoEmbed(title, message = '') {
    return new discord_js_1.MessageEmbed().setColor('#0099ff').setTitle(title).setDescription(message);
}
exports.createInfoEmbed = createInfoEmbed;
//# sourceMappingURL=message.js.map