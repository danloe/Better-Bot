import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message, MessageActionRow, MessageButton } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import { createErrorEmbed, safeDeferReply, safeReply } from '../../helpers';
import { GameType, GameState, FastTyperGame, Logger } from '../../classes';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('fasttyper')
        .setDescription('Start a game of Fast Typer.')
        .addIntegerOption((option) =>
            option.setName('rounds').setDescription('How many rounds?').setMinValue(1).setMaxValue(50).setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName('tries')
                .setDescription('How many tries per player?')
                .setMinValue(1)
                .setMaxValue(5)
                .setRequired(false)
        )
        .addIntegerOption((option) =>
            option
                .setName('time')
                .setDescription('How many seconds to answer?')
                .setMinValue(2)
                .setMaxValue(60)
                .setRequired(false)
        )
        .addIntegerOption((option) =>
            option
                .setName('players')
                .setDescription('How many players can join?')
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)
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
                    await safeDeferReply(client, interaction);

                    let rounds = interaction.options.getInteger('rounds');
                    let triesOption = interaction.options.getInteger('tries');
                    if (!triesOption) triesOption = 1;
                    let timeOption = interaction.options.getInteger('time');
                    if (!timeOption) timeOption = 10;
                    let maxPlayersOption = interaction.options.getInteger('players');
                    if (!maxPlayersOption) maxPlayersOption = 5;

                    const lobby = (await client.gameManager.createLobby(
                        GameType.FastTyper,
                        interaction,
                        interaction.user,
                        1,
                        maxPlayersOption
                    )) as FastTyperGame;
                    lobby.rounds = rounds!;
                    lobby.tries = triesOption!;
                    lobby.typingTime = timeOption! * 1000;

                    // A PLAYER JOINED
                    lobby.on('join', async (game: FastTyperGame) => {
                        let embedmsg = game.getLobbyMessageEmbed('`Waiting for more players...`');
                        const row = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('join_join').setLabel('Join').setStyle('PRIMARY'),
                            new MessageButton().setCustomId('join_cancel').setLabel('Cancel Game').setStyle('DANGER')
                        ]);
                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.interactionTimeout
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === interaction.user.id) {
                                    await button.deferUpdate();
                                    if (button.customId === 'join_cancel') {
                                        let embedmsg = game.getLobbyMessageEmbed('`The game was canceled.`');
                                        client.gameManager.destroyLobby(interaction.user, game);
                                        await safeReply(client, interaction, { embeds: [embedmsg], components: [] });
                                    } else {
                                        game.join(button.user);
                                    }
                                    collector.stop();
                                } else {
                                    if (button.customId === 'join_join') {
                                        await button.deferUpdate();
                                        game.join(button.user);
                                        collector.stop();
                                    } else if (button.customId === 'join_cancel') {
                                        await safeReply(
                                            client,
                                            button,
                                            createErrorEmbed('`⛔ Only the host can cancel the game.`', true)
                                        );
                                    }
                                }
                            } catch (err: any) {
                                Logger.debug(err);
                            }
                        });

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (
                                    reason === 'time' &&
                                    (game.state === GameState.Waiting || game.state === GameState.Ready)
                                ) {
                                    let embedmsg = game.getLobbyMessageEmbed('`The game lobby timed out.`');
                                    client.gameManager.destroyLobby(interaction.user, game);
                                    await safeReply(client, interaction, { embeds: [embedmsg], components: [] });
                                }
                            } catch (err: any) {
                                Logger.error(err);
                            }
                        });

                        game.lastGameMessage = <Message<boolean>>(
                            await safeReply(client, interaction, { embeds: [embedmsg], components: [row] })
                        );
                    });

                    // GAME READY TO START
                    lobby.on('ready', async (game: FastTyperGame) => {
                        let embedmsg = game.getLobbyMessageEmbed('`Minimum player count reached. The game is ready.`');
                        const row = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('ready_join').setLabel('Join').setStyle('PRIMARY'),
                            new MessageButton().setCustomId('ready_cancel').setLabel('Cancel Game').setStyle('DANGER'),
                            new MessageButton().setCustomId('ready_start').setLabel('Start Game').setStyle('SUCCESS')
                        ]);
                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.interactionTimeout
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === interaction.user.id) {
                                    await button.deferUpdate();
                                    if (button.customId === 'ready_start') {
                                        game.start();
                                    } else if (button.customId === 'ready_cancel') {
                                        let embedmsg = game.getLobbyMessageEmbed('`The game was canceled.`');
                                        client.gameManager.destroyLobby(interaction.user, game);
                                        await safeReply(client, interaction, { embeds: [embedmsg], components: [] });
                                    } else {
                                        game.join(button.user);
                                    }
                                    collector.stop();
                                } else {
                                    try {
                                        if (button.customId === 'ready_join') {
                                            await button.deferUpdate();
                                            game.join(button.user);
                                            collector.stop();
                                        } else {
                                            await safeReply(
                                                client,
                                                button,
                                                createErrorEmbed(
                                                    '`⛔ Only the host can cancel or start the game.`',
                                                    true
                                                )
                                            );
                                        }
                                    } catch (err: any) {
                                        Logger.error(err);
                                    }
                                }
                            } catch (err: any) {
                                Logger.error(err);
                            }
                        });

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (
                                    reason === 'time' &&
                                    (game.state === GameState.Waiting || game.state === GameState.Ready)
                                ) {
                                    let embedmsg = game.getLobbyMessageEmbed('`The game lobby timed out.`');
                                    client.gameManager.destroyLobby(interaction.user, game);
                                    await safeReply(client, interaction, { embeds: [embedmsg], components: [] });
                                }
                            } catch (err: any) {
                                Logger.error(err);
                            }
                        });
                        game.lastGameMessage = <Message<boolean>>(
                            await safeReply(client, interaction, { embeds: [embedmsg], components: [row] })
                        );
                    });

                    // GAME START
                    lobby.on('start', async (game: FastTyperGame) => {
                        game.nextRound();
                    });

                    // GAME TYPE
                    lobby.on('type', async (game: FastTyperGame) => {
                        const gameMessage = game.getTypeMessage();
                        game.lastGameMessage = await game.lastGameMessage.edit(gameMessage).catch();

                        const filter = (m: Message<boolean>) => game.players.some((p) => p.id === m.author.id);
                        const collector = interaction.channel!.createMessageCollector({
                            filter,
                            time: game.typingTime
                        });

                        collector.on('collect', async (message) => {
                            try {
                                if (game.answerTries.has(message.member!.user)) {
                                    game.answer(message.member!.user, message.content);
                                    collector.stop();
                                }
                            } catch (err: any) {
                                Logger.error(err);
                            }
                        });

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (reason === 'time') {
                                    game.displayAnswer();
                                }
                            } catch (err: any) {
                                Logger.error(err);
                            }
                        });
                    });

                    // GAME ANSWER
                    lobby.on('answer', async (game: FastTyperGame) => {
                        await game.lastGameMessage.delete().catch();
                        const gameMessage = game.getAnswerMessage();
                        game.lastGameMessage = await game.lastGameMessage.channel.send(gameMessage);

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.answerDisplayTime
                        });

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (reason === 'time') {
                                    game.nextRound();
                                }
                            } catch (err: any) {
                                Logger.error(err);
                            }
                        });
                    });

                    // GAME OVER
                    lobby.on('end', async (game: FastTyperGame) => {
                        await game.lastGameMessage.delete().catch();
                        const gameMessage = game.getGameOverMessage();
                        game.lastGameMessage = await game.lastGameMessage.channel.send(gameMessage);
                        client.gameManager.destroyLobby(interaction.user, game);
                    });

                    // open game lobby
                    lobby.open();
                    done();
                } catch (err: any) {
                    await safeReply(
                        client,
                        interaction,
                        createErrorEmbed('🚩 Error creating a Fast Typer game: `' + err + '`', true)
                    );
                    error(err);
                }
            }
        })
};
