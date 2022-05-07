"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const builders_1 = require("@discordjs/builders");
// const wait = require('node:timers/promises').setTimeout;
exports.command = {
    data: new builders_1.SlashCommandBuilder()
        .setName("play")
        .setDescription("Plays a song."),
    aliases: ["p"],
    run: async (interaction, message, args) => {
        if (interaction) {
            //interaction!.reply(`${interaction.client.ws.ping}ms ping. 🏓`);
        }
        if (message) {
            //message!.channel.send(`${message!.client.ws.ping}ms ping. 🏓`);
        }
    },
};
//# sourceMappingURL=play.js.map