"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorEmbed = exports.createEmbed = void 0;
const discord_js_1 = require("discord.js");
function createEmbed(title, message) {
    return { embeds: [new discord_js_1.MessageEmbed().setColor('#1e81b0').setTitle(title).setDescription(message)] };
}
exports.createEmbed = createEmbed;
function createErrorEmbed(message) {
    return { embeds: [new discord_js_1.MessageEmbed().setColor('#951020').setTitle('Error').setDescription(message)] };
}
exports.createErrorEmbed = createErrorEmbed;
//# sourceMappingURL=message.js.map