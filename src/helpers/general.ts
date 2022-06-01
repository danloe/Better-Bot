import { APIMessage } from 'discord-api-types/v10';
import {
    ButtonInteraction,
    CommandInteraction,
    InteractionReplyOptions,
    Message,
    MessagePayload,
    WebhookEditMessageOptions
} from 'discord.js';
import BotterinoClient from '../client';

export async function safeReply(
    client: BotterinoClient,
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
    } catch (err: any) {
        client.logger.error(err);
    }
}

export async function safeDeferReply(
    client: BotterinoClient,
    interaction: CommandInteraction | ButtonInteraction,
    ephemeral: boolean = false
) {
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
    } catch (err: any) {
        client.logger.error(err);
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
