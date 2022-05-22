import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { createErrorEmbed, safeReply } from '../../helpers';
import BetterClient from '../../client';
import { promisify } from 'node:util';

export const command: Command = {
    data: new SlashCommandBuilder().setName('coin').setDescription('Throws a coin. Heads or Tails?'),
    run: async (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) => {
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    const wait = promisify(setTimeout);

                    const headsImages = [
                        'https://images.unsplash.com/photo-1622190994281-8b48849440e9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1744&q=80',
                        'https://images.unsplash.com/photo-1579468118288-682e600b8565?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80',
                        'https://images.unsplash.com/photo-1641197408799-262f1f343cc6?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1744&q=80',
                        'https://images.unsplash.com/photo-1560294662-ecab97f90f92?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2671&q=80'
                    ];
                    const tailsImages = [
                        'https://images.unsplash.com/photo-1501102057089-b3e50a55eff6?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2673&q=80',
                        'https://images.unsplash.com/photo-1565372521778-8d8235695f8a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2670&q=80',
                        'https://images.unsplash.com/photo-1614623071923-a7d1d22dacfb?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1578&q=80',
                        'https://images.unsplash.com/photo-1589556763333-ad818080f39e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80'
                    ];
                    const throwImages = [
                        'https://images.unsplash.com/photo-1475650522725-015d35677789?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80',
                        'https://images.unsplash.com/photo-1533988902751-0fad628013cb?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2671&q=80',
                        'https://images.unsplash.com/photo-1532634896-26909d0d4b89?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80',
                        'https://images.unsplash.com/photo-1579900543017-97d32f6851ff?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2670&q=80'
                    ];

                    let throwImage = throwImages[Math.floor(Math.random() * throwImages.length)];
                    let coinImageIndex = Math.floor(Math.random() * headsImages.length);
                    let coinImage;
                    Math.random() < 0.5
                        ? (coinImage = tailsImages[coinImageIndex])
                        : (coinImage = headsImages[coinImageIndex]);

                    await interaction.reply({ content: ' ', embeds: [new MessageEmbed().setImage(throwImage)] });
                    await wait(4_000);
                    await interaction.editReply({ content: ' ', embeds: [new MessageEmbed().setImage(coinImage)] });

                    done();
                } catch (err) {
                    try {
                        await safeReply(interaction, createErrorEmbed('🚩 Error flipping coin: `' + err + '`'));
                    } catch (err2) {
                        console.log(err2);
                    }
                    console.log(err);
                    error(err);
                }
            }
        });
    }
};
