import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { readdir, readFile, readFileSync } from 'fs';
import BetterClient from '../../client';

export const command: Command = {
    data: new SlashCommandBuilder().setName('help').setDescription('You need a hand?'),
    run: async (client: BetterClient, interaction?: CommandInteraction | ButtonInteraction, message?: Message, args?: string[]) => {
        readdir('.', (err, files) => {
            files.forEach((file) => {
                console.log(file);
            });
        });
        const helptext = readFileSync('../helptext.txt');

        if (interaction) {
            interaction!.reply({
                content: `${interaction.user.username}\n ${helptext}`,
                ephemeral: true
            });
        }

        if (message) {
            message!.reply(`${message.author}\n ${helptext}`);
        }
    }
};
