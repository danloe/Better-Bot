import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { createEmbed, createErrorEmbed } from '../../helpers';
import BetterClient from '../../client';

export const command: Command = {
    data: new SlashCommandBuilder().setName('about').setDescription('Information about this bot.'),
    run: async (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) => {
        new Promise<void>(async (done, error) => {
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
                await interaction!
                    .reply(
                        createEmbed(
                            'About',
                            ' ',
                            false,
                            '#E63326',
                            [
                                {
                                    name: 'Uptime',
                                    value:
                                        '`' +
                                        `Running since ${days} days, ${hours} hours, ${mins} mins and ${seconds} secs!` +
                                        '`'
                                },
                                {
                                    name: 'Version',
                                    value: '`v2.x:?=!unknown`',
                                    inline: true
                                },
                                {
                                    name: 'Commands',
                                    value: '`' + client.commands.size.toString() + '`',
                                    inline: true
                                },
                                {
                                    name: 'Latency',
                                    value: '`' + client.ws.ping.toString() + 'ms`',
                                    inline: true
                                }
                            ],
                            'https://unsplash.com/photos/N2zxMUDwT4I/download?ixid=MnwxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNjUyMjYzNzA3&force=true&w=640',
                            'https://github.com/danloe/Botterino/',
                            {
                                text: client.user!.username + ` ❤️ ${interaction.user.username}`,
                                iconURL: client.user!.avatarURL() || undefined
                            }
                        )
                    )
                    .then(done)
                    .catch(async (err) => {
                        await interaction.editReply(createErrorEmbed('🚩 Error clearing queue: `' + err + '`'));
                        error(err);
                    });
            }

            if (message) {
                await message.channel.send(
                    `${message.author} I am running away from you since ${days} days, ${hours} hours, ${mins} mins and ${seconds} secs!`
                );
            }
        });
    }
};
