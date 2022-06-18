import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import { createEmbed, createErrorEmbed, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('close').setDescription('Close a game lobby you created.'),
    run: (
        client: BotterinoClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    const game = client.gameManager.games.get(interaction.user.id);
                    if (game) {
                        client.gameManager.destroyLobby(interaction.user, game);
                        await safeReply(
                            client,
                            interaction,
                            createEmbed('Closed', '`🔺 The game lobby is now closed.`', true)
                        );
                    } else {
                        await safeReply(client, interaction, createEmbed('Close', '`🔺 You are not in a game lobby.`'));
                    }

                    done();
                } catch (err) {
                    await safeReply(
                        client,
                        interaction,
                        createErrorEmbed('🚩 Error closing the lobby: `' + err + '`', true)
                    );
                    error(err);
                }
            }
        })
};
