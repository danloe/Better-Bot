"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const builders_1 = require("@discordjs/builders");
exports.command = {
    data: new builders_1.SlashCommandBuilder()
        .setName("button")
        .setDescription("Responds with a button."),
    run: async (interaction, message, args) => {
        const row = new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton()
            .setCustomId("ping_button")
            .setLabel("Ping! 🏓")
            .setStyle("PRIMARY"));
        if (interaction) {
            await interaction.reply({ content: " ", components: [row] });
            const collector = interaction.channel.createMessageComponentCollector();
            collector.on("collect", async (ButtonInteraction) => {
                ButtonInteraction.reply(`${interaction.client.ws.ping}ms 🏓`);
            });
        }
        if (message) {
            await message.reply({ content: " ", components: [row] });
            const collector = message.channel.createMessageComponentCollector();
            collector.on("collect", async (ButtonInteraction) => {
                ButtonInteraction.reply(`${message.client.ws.ping}ms 🏓`);
            });
        }
    },
};
//# sourceMappingURL=button.js.map