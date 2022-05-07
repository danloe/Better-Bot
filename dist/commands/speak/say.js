"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const builders_1 = require("@discordjs/builders");
exports.command = {
    data: new builders_1.SlashCommandBuilder()
        .setName("say")
        .setDescription("Says what you want."),
    run: async (interaction, message, args) => {
        if (interaction) {
            interaction.reply(`${interaction.client.ws.ping}ms ping. 🏓`);
        }
        if (message) {
            message.channel.send(`${message.client.ws.ping}ms ping. 🏓`);
        }
    },
};
//# sourceMappingURL=say.js.map