import { Command } from '../../interfaces';
import { CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { createEmbed } from '../../helpers';
import BetterClient from '../../client';

export const command: Command = {
    data: new SlashCommandBuilder().setName('ping').setDescription('Returns the ping. pong.'),
    run: async (client: BetterClient, interaction?: CommandInteraction, message?: Message, args?: string[]) => {
        if (interaction) {
            await interaction.reply(createEmbed('🏓', `${client.ws.ping}ms`));
        }

        if (message) {
            await message.reply(createEmbed('🏓', `${client.ws.ping}ms`));
        }
    }
};
