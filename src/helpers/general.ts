import { ButtonInteraction, CommandInteraction, MessagePayload, WebhookEditMessageOptions } from 'discord.js';

export async function safeReply(
    interaction: CommandInteraction | ButtonInteraction,
    options: string | MessagePayload | WebhookEditMessageOptions,
    followup = false
) {
    try {
        if (interaction instanceof ButtonInteraction) {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(options);
                return;
            } else {
                await interaction.reply(options);
                return;
            }
        }

        if (followup) {
            if (interaction.replied) {
                await interaction.followUp(options);
                return;
            } else {
                await interaction.reply(options);
                return;
            }
        } else {
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply(options);
                return;
            } else {
                await interaction.reply(options);
                return;
            }
        }
    } catch (err) {
        console.log(err);
    }
}

export async function safeDeferReply(interaction: CommandInteraction | ButtonInteraction, ephemeral: boolean = false) {
    try {
        if (interaction instanceof ButtonInteraction) {
            if (!interaction.deferred) {
                await interaction.deferUpdate();
            }
        } else {
            if (!interaction.deferred) {
                await interaction.deferReply({ ephemeral: ephemeral });
            }
        }
    } catch (err) {
        console.log(err);
    }
}
