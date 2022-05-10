import { ButtonInteraction, CommandInteraction, MessagePayload, WebhookEditMessageOptions } from "discord.js";

export async function replyInteraction(
    interaction: CommandInteraction | ButtonInteraction,
    options: string | MessagePayload | WebhookEditMessageOptions
) {
    if (interaction instanceof ButtonInteraction || interaction.replied) {
        await interaction.followUp(options);
    } else {
        if (interaction.deferred) {
            await interaction.editReply(options);
        } else {
            await interaction.reply(options);
        }
    }
}

export async function replyDefer(interaction: CommandInteraction | ButtonInteraction) {
    if (!interaction.deferred) {
        await interaction.deferReply();
    }
}