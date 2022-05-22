import { ButtonInteraction, CommandInteraction, MessagePayload, WebhookEditMessageOptions } from 'discord.js';

export async function safeReply(
    interaction: CommandInteraction | ButtonInteraction,
    options: string | MessagePayload | WebhookEditMessageOptions,
    followup = false
) {
    try {
        if (followup) {
            await interaction.followUp(options);
            return;
        }
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply(options);
        } else {
            await interaction.reply(options);
        }
    } catch (err) {
        console.log(err);
    }
}

export async function safeDeferReply(interaction: CommandInteraction | ButtonInteraction, ephemeral: boolean = false) {
    try {
        if (!interaction.deferred) {
            await interaction.deferReply({ ephemeral: ephemeral });
        }
    } catch (err) {
        console.log(err);
    }
}
