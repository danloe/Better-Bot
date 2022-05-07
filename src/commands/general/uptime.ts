import { Command } from '../../interfaces';
import { CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { createEmbed } from '../../helpers';
import BetterClient from '../../client';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Tells you how much time is on the bots clock'),
    run: async (client: BetterClient, interaction?: CommandInteraction, message?: Message, args?: string[]) => {
        let diff = new Date().getTime() - client.readyAt!.getTime();
        let days = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff -= days * (1000 * 60 * 60 * 24);

        let hours = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * (1000 * 60 * 60);

        let mins = Math.floor(diff / (1000 * 60));
        diff -= mins * (1000 * 60);

        let seconds = Math.floor(diff / 1000);
        diff -= seconds * 1000;

        if (interaction) {
            await interaction!.reply(
                createEmbed(
                    'Uptime',
                    `I am running away from you since ${days} days, ${hours} hours, ${mins} mins and ${seconds} secs!`
                )
            );
        }

        if (message) {
            await message.channel.send(
                `${message.author} I am running away from you since ${days} days, ${hours} hours, ${mins} mins and ${seconds} secs!`
            );
        }
    }
};
