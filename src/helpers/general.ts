import { ButtonInteraction, CommandInteraction, MessagePayload, WebhookEditMessageOptions } from 'discord.js';

export async function replyInteraction(
    interaction: CommandInteraction | ButtonInteraction,
    options: string | MessagePayload | WebhookEditMessageOptions
) {
    try {
        if (interaction instanceof ButtonInteraction || interaction.replied) {
            await interaction.followUp(options);
        } else {
            if (interaction.deferred) {
                await interaction.editReply(options);
            } else {
                await interaction.reply(options);
            }
        }
    } catch (err) {
        console.log(err);
    }
}

export async function replyDefer(interaction: CommandInteraction | ButtonInteraction) {
    try {
        if (!interaction.deferred) {
            await interaction.deferReply();
        }
    } catch (err) {
        console.log(err);
    }
}
