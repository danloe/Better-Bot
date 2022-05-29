import { Command } from '../../interfaces';
import {
    ButtonInteraction,
    CommandInteraction,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed
} from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import { createErrorEmbed, safeDeferReply, safeReply } from '../../helpers';
import { TTTGame, GameType, GameState } from '../../classes';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('tictactoe')
        .setDescription('Start a game of Tic Tac Toe.')
        .addUserOption((option) =>
            option.setName('opponent').setDescription('Do you want to challenge a specific user?').setRequired(false)
        ),
    run: (
        client: BotterinoClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction instanceof CommandInteraction) {
                try {
                    await safeDeferReply(interaction);

                    let opponent = interaction.options.getUser('opponent');

                    const lobby = (await client.gameManager.createLobby(
                        GameType.TicTacToe,
                        interaction,
                        interaction.user
                    )) as TTTGame;

                    // A PLAYER JOINED
                    lobby.on('join', async (game: TTTGame) => {
                        let embedmsg = game.getLobbyMessageEmbed('`Waiting for more players...`');
                        const row = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('ttt_join_join').setLabel('Join').setStyle('PRIMARY'),
                            new MessageButton()
                                .setCustomId('ttt_join_cancel')
                                .setLabel('Cancel Game')
                                .setStyle('DANGER')
                        ]);
                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.interactionTimeout
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === interaction.user.id) {
                                    await button.deferUpdate();
                                    if (button.customId === 'ttt_join_cancel') {
                                        client.gameManager.destroyLobby(interaction.user);
                                        let embedmsg = game.getLobbyMessageEmbed('`The game was canceled.`');
                                        await safeReply(interaction, { embeds: [embedmsg], components: [] });
                                    } else {
                                        game.join(button.user);
                                    }
                                    collector.stop();
                                } else {
                                    if (button.customId === 'ttt_join_join') {
                                        await button.deferUpdate();
                                        game.join(button.user);
                                        collector.stop();
                                    } else if (button.customId === 'ttt_join_cancel') {
                                        await safeReply(
                                            button,
                                            createErrorEmbed("`⛔ This button isn't for you.`", true)
                                        );
                                    }
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (
                                    reason === 'time' &&
                                    (game.state === GameState.Waiting || game.state === GameState.Ready)
                                ) {
                                    client.gameManager.destroyLobby(interaction.user);
                                    let embedmsg = game.getLobbyMessageEmbed('`The game lobby timed out.`');
                                    await safeReply(interaction, { embeds: [embedmsg], components: [] });
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        await safeReply(interaction, { embeds: [embedmsg], components: [row] });
                    });

                    // GAME READY TO START
                    lobby.on('ready', async (game: TTTGame) => {
                        let embedmsg = game.getLobbyMessageEmbed('`Minimum player count reached. The game is ready.`');
                        const row = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('ttt_ready_join').setLabel('Join').setStyle('PRIMARY'),
                            new MessageButton()
                                .setCustomId('ttt_ready_cancel')
                                .setLabel('Cancel Game')
                                .setStyle('DANGER'),
                            new MessageButton()
                                .setCustomId('ttt_ready_start')
                                .setLabel('Start Game')
                                .setStyle('SUCCESS')
                        ]);
                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.interactionTimeout
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === interaction.user.id) {
                                    await button.deferUpdate();
                                    if (button.customId === 'ttt_ready_start') {
                                        game.start();
                                    } else if (button.customId === 'ttt_ready_cancel') {
                                        client.gameManager.destroyLobby(interaction.user);
                                        let embedmsg = game.getLobbyMessageEmbed('`The game was canceled.`');
                                        await safeReply(interaction, { embeds: [embedmsg], components: [] });
                                    } else {
                                        game.join(button.user);
                                    }
                                    collector.stop();
                                } else {
                                    try {
                                        if (button.customId === 'ttt_ready_join') {
                                            await button.deferUpdate();
                                            game.join(button.user);
                                            collector.stop();
                                        } else {
                                            await safeReply(
                                                button,
                                                createErrorEmbed("`⛔ This button isn't for you.`", true)
                                            );
                                        }
                                    } catch (err) {
                                        console.log(err);
                                    }
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (
                                    reason === 'time' &&
                                    (game.state === GameState.Waiting || game.state === GameState.Ready)
                                ) {
                                    client.gameManager.destroyLobby(interaction.user);
                                    let embedmsg = game.getLobbyMessageEmbed('`The game lobby timed out.`');
                                    await safeReply(interaction, { embeds: [embedmsg], components: [] });
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        await safeReply(interaction, { embeds: [embedmsg], components: [row] });
                    });

                    // GAME STARTED
                    lobby.on('start', async (game: TTTGame) => {
                        const gameFieldMessage = game.getGameFieldMessage();
                        await safeReply(interaction, gameFieldMessage);

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.interactionTimeout
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === game.getTurnPlayer().id) {
                                    await button.deferUpdate();
                                    game.placeMark(parseInt(button.customId.replace('ttt_', '')));
                                    collector.stop();
                                } else {
                                    try {
                                        if (game.players.includes(button.user)) {
                                            await safeReply(
                                                button,
                                                createErrorEmbed("`💤 It is the other player's turn.`", true)
                                            );
                                        } else {
                                            await safeReply(
                                                button,
                                                createErrorEmbed("`⛔ These buttons aren't for you.`", true)
                                            );
                                        }
                                    } catch (err) {
                                        console.log(err);
                                    }
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (reason === 'time' && game.state === GameState.Started) {
                                    client.gameManager.destroyLobby(interaction.user);
                                    let embedmsg = game.getLobbyMessageEmbed(
                                        '<@' +
                                            game.getTurnPlayer().id +
                                            '>` has not executed his move. The game is closed.`'
                                    );
                                    await safeReply(interaction, { embeds: [embedmsg], components: [] });
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });
                    });

                    // GAME TICK
                    lobby.on('tick', async (game: TTTGame) => {
                        const gameFieldMessage = game.getGameFieldMessage();
                        await safeReply(interaction, gameFieldMessage);

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.interactionTimeout
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === game.getTurnPlayer().id) {
                                    await button.deferUpdate();
                                    game.placeMark(parseInt(button.customId.replace('ttt_', '')));
                                    collector.stop();
                                } else {
                                    try {
                                        if (game.players.includes(button.user)) {
                                            await safeReply(
                                                button,
                                                createErrorEmbed("`💤 It is the other player's turn.`", true)
                                            );
                                        } else {
                                            await safeReply(
                                                button,
                                                createErrorEmbed("`⛔ These buttons aren't for you.`", true)
                                            );
                                        }
                                    } catch (err) {
                                        console.log(err);
                                    }
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (reason === 'time' && game.state === GameState.Started) {
                                    client.gameManager.destroyLobby(interaction.user);
                                    let embedmsg = game.getLobbyMessageEmbed(
                                        '<@' +
                                            game.getTurnPlayer().id +
                                            '>` has not executed his move. The game is closed.`'
                                    );
                                    await safeReply(interaction, { embeds: [embedmsg], components: [] });
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });
                    });

                    // GAME OVER
                    lobby.on('end', async (game: TTTGame) => {
                        const gameFieldMessage = game.getGameFieldMessage();
                        await safeReply(interaction, gameFieldMessage);

                        if (game.winners.length > 0) {
                            let embedmsg = new MessageEmbed()
                                .setColor('#403075')
                                .setTitle('Tic Tac Toe - Game Over')
                                .setDescription('🎉 <@' + game.winners[0].id + '> `has won the game!`')
                                .setThumbnail(game.thumbnail);
                            await interaction.followUp({ embeds: [embedmsg] });
                        } else {
                            client.gameManager.destroyLobby(interaction.user);
                            let embedmsg = new MessageEmbed()
                                .setColor('#403075')
                                .setTitle('Tic Tac Toe - Game Over')
                                .setDescription('`🫱🏼‍🫲🏼 Draw`')
                                .setThumbnail(game.thumbnail);
                            await interaction.followUp({ embeds: [embedmsg] });
                        }
                    });

                    if (opponent) {
                        // Send a challenge message
                        await safeReply(
                            interaction,
                            lobby.getChallengeMessage(
                                opponent,
                                '⚔️ <@' + interaction.user.id + '> `challenged you to a game of TicTacToe!`'
                            )
                        );

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: lobby.interactionTimeout
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === opponent!.id) {
                                    if (button.customId === 'challenge_accept') {
                                        await button.deferUpdate();

                                        lobby.join(button.user);
                                        collector.stop();
                                    } else if (button.customId === 'challenge_decline') {
                                        await button.deferUpdate();
                                        client.gameManager.destroyLobby(interaction.user);
                                        let embedmsg = lobby.getLobbyMessageEmbed('`The game challenge was declined.`');
                                        await safeReply(interaction, {
                                            content: ' ',
                                            embeds: [embedmsg],
                                            components: []
                                        });
                                        collector.stop();
                                    }
                                } else {
                                    try {
                                        await safeReply(
                                            button,
                                            createErrorEmbed("`⛔ These buttons aren't for you.`", true)
                                        );
                                    } catch (err) {
                                        console.log(err);
                                    }
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (reason === 'time' && lobby.state === GameState.Waiting) {
                                    client.gameManager.destroyLobby(interaction.user);
                                    let embedmsg = lobby.getLobbyMessageEmbed(
                                        '<@' + opponent!.id + '> `has not accepted the challenge. The game is closed.`'
                                    );
                                    await safeReply(interaction, { content: ' ', embeds: [embedmsg], components: [] });
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });
                    } else {
                        // open game lobby
                        lobby.open();
                    }
                    done();
                } catch (err) {
                    await safeReply(
                        interaction,
                        createErrorEmbed('🚩 Error creating a Tic Tac Toe game: `' + err + '`', true)
                    );
                    error(err);
                }
            }
        })
};
