"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const builders_1 = require("@discordjs/builders");
// const wait = require('node:timers/promises').setTimeout;
exports.command = {
    data: new builders_1.SlashCommandBuilder()
        .setName("ping")
        .setDescription("Returns the ping. pong."),
    aliases: ["pong"],
    run: async (interaction, message, args) => {
        if (interaction) {
            interaction.reply(`${interaction.client.ws.ping}ms ping. 🏓`);
        }
        if (message) {
            message.reply(`${message.client.ws.ping}ms ping. 🏓`);
        }
    },
};
//# sourceMappingURL=ping.js.map