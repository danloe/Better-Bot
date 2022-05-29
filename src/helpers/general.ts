import { APIMessage } from 'discord-api-types/v10';
import {
    ButtonInteraction,
    CommandInteraction,
    InteractionReplyOptions,
    Message,
    MessagePayload,
    WebhookEditMessageOptions
} from 'discord.js';

export async function safeReply(
    interaction: CommandInteraction | ButtonInteraction,
    options: string | MessagePayload | InteractionReplyOptions,
    followup = false
): Promise<APIMessage | Message<boolean> | undefined> {
    try {
        if (interaction instanceof ButtonInteraction) {
            if (interaction.replied || interaction.deferred) {
                return <APIMessage | Message<boolean>>(<unknown>await interaction.followUp(options));
            } else {
                options;
                return <APIMessage | Message<boolean>>(
                    (<unknown>await interaction.reply(Object.assign(options, { fetchReply: true })))
                );
            }
        }

        if (followup) {
            if (interaction.replied) {
                return <APIMessage | Message<boolean>>(<unknown>await interaction.followUp(options));
            } else {
                return <APIMessage | Message<boolean>>(
                    (<unknown>await interaction.reply(Object.assign(options, { fetchReply: true })))
                );
            }
        } else {
            if (interaction.replied || interaction.deferred) {
                return <APIMessage | Message<boolean>>(<unknown>await interaction.editReply(options));
            } else {
                return <APIMessage | Message<boolean>>(
                    (<unknown>await interaction.reply(Object.assign(options, { fetchReply: true })))
                );
            }
        }
        return undefined;
    } catch (err) {
        console.log(err);
    }
}

export async function safeDeferReply(interaction: CommandInteraction | ButtonInteraction, ephemeral: boolean = false) {
    try {
        if (interaction instanceof ButtonInteraction) {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferUpdate();
            }
        } else {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply({ ephemeral: ephemeral });
            }
        }
    } catch (err) {
        console.log(err);
    }
}

export function shuffleArray(arr: any[]): any[] {
    let currentIndex = arr.length;
    let randomIndex = 0;

    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
    }
    return arr;
}
