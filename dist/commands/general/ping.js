"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const builders_1 = require("@discordjs/builders");
const helpers_1 = require("../../helpers");
exports.command = {
    data: new builders_1.SlashCommandBuilder()
        .setName("ping")
        .setDescription("Returns the ping. pong."),
    run: async (interaction, message, args) => {
        if (interaction) {
            interaction.reply((0, helpers_1.createEmbed)("🏓", `${interaction.client.ws.ping}ms`));
        }
        if (message) {
            message.reply((0, helpers_1.createEmbed)("🏓", `${message.client.ws.ping}ms`));
        }
    },
};
//# sourceMappingURL=ping.js.map