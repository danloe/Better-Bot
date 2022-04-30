"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const builders_1 = require("@discordjs/builders");
exports.command = {
    data: new builders_1.SlashCommandBuilder()
        .setName("uptime")
        .setDescription("Tells you how much time is on the bots clock"),
    run: async (interaction, message, args) => {
        let client;
        if (interaction)
            client = interaction.client;
        if (message)
            client = message.client;
        let diff = new Date().getTime() - client.readyAt.getTime();
        let days = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff -= days * (1000 * 60 * 60 * 24);
        let hours = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * (1000 * 60 * 60);
        let mins = Math.floor(diff / (1000 * 60));
        diff -= mins * (1000 * 60);
        let seconds = Math.floor(diff / 1000);
        diff -= seconds * 1000;
        if (interaction) {
            interaction.reply(`${interaction.user.username} I am running for you since ${days} days, ${hours} hours, ${mins} mins and ${seconds} secs!`);
        }
        if (message) {
            await message.channel.send(`${message.author} I am running for you since ${days} days, ${hours} hours, ${mins} mins and ${seconds} secs!`);
        }
    },
};
//# sourceMappingURL=uptime.js.map