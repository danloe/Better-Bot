import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message, MessageActionRow, MessageButton } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createErrorEmbed, safeDeferReply, safeReply } from '../../helpers';
import { GameType, GameState, GameDifficulty, FindTheEmojiGame } from '../../classes';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('findtheemoji')
        .setDescription('Start a game of Find The Emoji.')
        .addIntegerOption((option) =>
            option.setName('rounds').setDescription('How many rounds?').setMinValue(1).setMaxValue(50).setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('difficulty')
                .setDescription('Which difficulty?')
                .addChoices(
                    { name: 'Easy', value: 'Easy' },
                    { name: 'Medium', value: 'Medium' },
                    { name: 'Hard', value: 'Hard' }
                )
                .setRequired(false)
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
                .setDescription('How many seconds to search?')
                .setMinValue(2)
                .setMaxValue(60)
                .setRequired(false)
        )
        .addIntegerOption((option) =>
            option
                .setName('players')
                .setDescription('How many players can join?')
                .setMinValue(1)
                .setMaxValue(5)
                .setRequired(false)
        ),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction instanceof CommandInteraction) {
                try {
                    await safeDeferReply(interaction);

                    let rounds = interaction.options.getInteger('rounds');
                    let difficultyOption = <GameDifficulty>interaction.options.getString('difficulty');
                    if (!difficultyOption) difficultyOption = GameDifficulty.Easy;
                    let triesOption = interaction.options.getInteger('tries');
                    if (!triesOption) triesOption = 1;
                    let timeOption = interaction.options.getInteger('time');
                    if (!timeOption) timeOption = 20;
                    let maxPlayersOption = interaction.options.getInteger('players');
                    if (!maxPlayersOption) maxPlayersOption = 5;

                    const lobby = (await client.gameManager.createLobby(
                        GameType.FindTheEmoji,
                        interaction,
                        interaction.user,
                        1,
                        maxPlayersOption
                    )) as FindTheEmojiGame;
                    lobby.rounds = rounds!;
                    lobby.difficulty = difficultyOption!;
                    lobby.tries = triesOption!;
                    lobby.emojiSearchTime = timeOption! * 1000;

                    // A PLAYER JOINED
                    lobby.on('join', async (game: FindTheEmojiGame) => {
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
                                        client.gameManager.destroyLobby(interaction.user);
                                        await safeReply(interaction, { embeds: [embedmsg], components: [] });
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
                                            button,
                                            createErrorEmbed('`⛔ Only the host can cancel the game.`', true)
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
                                    let embedmsg = game.getLobbyMessageEmbed('`The game lobby timed out.`');
                                    client.gameManager.destroyLobby(interaction.user);
                                    await safeReply(interaction, { embeds: [embedmsg], components: [] });
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        await safeReply(interaction, { embeds: [embedmsg], components: [row] });
                    });

                    // GAME READY TO START
                    lobby.on('ready', async (game: FindTheEmojiGame) => {
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
                                        client.gameManager.destroyLobby(interaction.user);
                                        await safeReply(interaction, { embeds: [embedmsg], components: [] });
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
                                                button,
                                                createErrorEmbed(
                                                    '`⛔ Only the host can cancel or start the game.`',
                                                    true
                                                )
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
                                    let embedmsg = game.getLobbyMessageEmbed('`The game lobby timed out.`');
                                    client.gameManager.destroyLobby(interaction.user);
                                    await safeReply(interaction, { embeds: [embedmsg], components: [] });
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });
                        await safeReply(interaction, { embeds: [embedmsg], components: [row] });
                    });

                    // GAME START
                    lobby.on('start', async (game: FindTheEmojiGame) => {
                        game.nextRound();
                    });

                    // GAME SEARCH
                    lobby.on('search', async (game: FindTheEmojiGame) => {
                        const gameMessage = game.getSearchMessage();
                        await safeReply(interaction, gameMessage);

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.emojiSearchTime
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (game.answerTries.has(button.user)) {
                                    await button.deferUpdate();
                                    game.selectEmoji(button.user, parseInt(button.customId.replace('emoji_', '')));
                                    collector.stop();
                                } else {
                                    try {
                                        if (game.answerGiven.includes(button.user)) {
                                            await safeReply(
                                                button,
                                                createErrorEmbed(
                                                    "`💤 You're out of tries. Wait for your opponents.`",
                                                    true
                                                )
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
                                if (reason === 'time') {
                                    game.displayAnswer();
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });
                    });

                    // GAME ANSWER
                    lobby.on('answer', async (game: FindTheEmojiGame) => {
                        const gameMessage = game.getAnswerMessage();
                        await safeReply(interaction, gameMessage);

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.answerDisplayTime
                        });

                        // collector.on('collect', async (button) => {
                        //     try {
                        //         if (button.user.id === interaction.user.id) {
                        //             await button.deferUpdate();
                        //             let embedmsg = game.getLobbyMessageEmbed('`The game was canceled.`');
                        //             client.gameManager.destroyLobby(interaction.user);
                        //             await safeReply(interaction, { embeds: [embedmsg], components: [] });

                        //             collector.stop();
                        //         } else {
                        //             try {
                        //                 await safeReply(
                        //                     button,
                        //                     createErrorEmbed('`⛔ Only the host can cancel the game.`', true)
                        //                 );
                        //             } catch (err) {
                        //                 console.log(err);
                        //             }
                        //         }
                        //     } catch (err) {
                        //         console.log(err);
                        //     }
                        // });

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (reason === 'time') {
                                    game.nextRound();
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });
                    });

                    // GAME OVER
                    lobby.on('end', async (game: FindTheEmojiGame) => {
                        const gameMessage = game.getGameOverMessage();
                        client.gameManager.destroyLobby(interaction.user);
                        await safeReply(interaction, gameMessage);
                    });

                    // open game lobby
                    lobby.open();
                    done();
                } catch (err) {
                    try {
                        await safeReply(
                            interaction,
                            createErrorEmbed('🚩 Error creating a Find The Emoji game: `' + err + '`')
                        );
                    } catch (err2) {
                        console.log(err2);
                    }
                    console.log(err);
                    error(err);
                }
            }
        })
};
