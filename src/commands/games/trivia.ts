import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message, MessageActionRow, MessageButton } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createErrorEmbed, replyDefer, replyInteraction } from '../../helpers';
import { GameType } from '../../classes/GameManager';
import { GameState } from '../../classes/GameLobby';
import { Category, CategoryNamesPretty, CategoryResolvable, QuestionDifficulty, QuestionType } from 'open-trivia-db';
import { answerDisplayTime, TriviaGame } from '../../classes/TriviaGame';
import { APIApplicationCommandOptionChoice } from 'discord-api-types/v10';

/*
TODO
- TTSVoice read questions option
*/

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Start a game of trivia.')
        .addIntegerOption((option) =>
            option
                .setName('amount')
                .setDescription('How many questions?')
                .setMinValue(1)
                .setMaxValue(50)
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('difficulty')
                .setDescription('Which question difficulty?')
                .addChoices(
                    { name: 'easy', value: 'easy' },
                    { name: 'medium', value: 'medium' },
                    { name: 'hard', value: 'hard' }
                )
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName('type')
                .setDescription('What question answers type?')
                .addChoices({ name: 'yes / no', value: 'boolean' }, { name: 'multiple choice', value: 'multiple' })
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName('category')
                .setDescription('Which question category?')
                .addChoices(...getCategoryOptions())
                .setRequired(false)
        )
        .addIntegerOption((option) =>
            option
                .setName('players')
                .setDescription('How many players can join?')
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)
        )
        .addIntegerOption((option) =>
            option
                .setName('time')
                .setDescription('How many seconds for each question?')
                .setMinValue(5)
                .setMaxValue(60)
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
                    await replyDefer(interaction);

                    let amount = interaction.options.getInteger('amount');
                    let difficultyOption = interaction.options.getString('difficulty');
                    if (!difficultyOption) difficultyOption = null;
                    let typeOption = interaction.options.getString('type');
                    if (!typeOption) typeOption = null;
                    let categoryOption = interaction.options.getString('category');
                    if (!categoryOption) categoryOption = null;
                    let maxPlayersOption = interaction.options.getInteger('players');
                    if (!maxPlayersOption) maxPlayersOption = 10;
                    let timeOption = interaction.options.getInteger('time');
                    if (!timeOption) maxPlayersOption = 20;

                    const lobby = (await client.gameManager.createLobby(
                        GameType.Trivia,
                        interaction,
                        interaction.user,
                        1,
                        maxPlayersOption
                    )) as TriviaGame;
                    lobby.amount = amount!;
                    lobby.difficulty = <QuestionDifficulty>difficultyOption!;
                    lobby.type = <QuestionType>typeOption!;
                    lobby.questionAnswerTime = timeOption!;
                    if (categoryOption) {
                        lobby.category = new Category(<CategoryResolvable>categoryOption);
                        await lobby.getCategoryInfo();
                    }

                    // A PLAYER JOINED
                    lobby.on('join', async (game: TriviaGame) => {
                        console.log(`[Trivia] ${game.players[game.players.length - 1].username} joined`);
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
                                        await interaction.editReply({ embeds: [embedmsg], components: [] });
                                        collector.stop();
                                    }
                                } else {
                                    if (button.customId === 'join_join') {
                                        await button.deferUpdate();
                                        game.join(button.user);
                                        collector.stop();
                                    } else if (button.customId === 'join_cancel') {
                                        await button.reply(
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
                                    await interaction.editReply({ embeds: [embedmsg], components: [] });
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        await interaction.editReply({ embeds: [embedmsg], components: [row] });
                    });

                    // GAME READY TO START
                    lobby.on('ready', async (game: TriviaGame) => {
                        console.log('[Trivia] Ready');
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
                                        await interaction.editReply({ embeds: [embedmsg], components: [] });
                                    }
                                    collector.stop();
                                } else {
                                    try {
                                        if (button.customId === 'ready_join') {
                                            await button.deferUpdate();
                                            game.join(button.user);
                                            collector.stop();
                                        } else {
                                            await button.reply(
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
                                    await interaction.editReply({ embeds: [embedmsg], components: [] });
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        await interaction.editReply({ embeds: [embedmsg], components: [row] });
                    });

                    // GAME START
                    lobby.on('start', async (game: TriviaGame) => {
                        console.log('[Trivia] Game Start');
                        await lobby.getQuestions();
                        lobby.nextRound();
                    });

                    // GAME QUESTION
                    lobby.on('question', async (game: TriviaGame) => {
                        console.log('[Trivia] Game Question');
                        const gameMessage = game.getQuestionMessage();
                        await interaction.editReply(gameMessage);

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.questionAnswerTime
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (game.answerRequired.includes(button.user)) {
                                    await button.deferUpdate();
                                    game.answerQuestion(button.user, parseInt(button.customId.replace('trivia_', '')));
                                    collector.stop();
                                } else {
                                    try {
                                        if (game.answerGiven.includes(button.user)) {
                                            await button.reply(
                                                createErrorEmbed(
                                                    "`💤 You've already answered. Wait for your opponents.`",
                                                    true
                                                )
                                            );
                                        } else {
                                            await button.reply(
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
                    lobby.on('answer', async (game: TriviaGame) => {
                        console.log('[Trivia] Game Answer');
                        const gameMessage = game.getAnswerMessage();
                        await interaction.editReply(gameMessage);

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: answerDisplayTime
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === interaction.user.id) {
                                    await button.deferUpdate();
                                    let embedmsg = game.getLobbyMessageEmbed('`The game was canceled.`');
                                    client.gameManager.destroyLobby(interaction.user);
                                    await interaction.editReply({ embeds: [embedmsg], components: [] });

                                    collector.stop();
                                } else {
                                    try {
                                        await button.reply(
                                            createErrorEmbed('`⛔ Only the host can cancel the game.`', true)
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
                                if (reason === 'time') {
                                    game.nextRound();
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });
                    });

                    // GAME OVER
                    lobby.on('end', async (game: TriviaGame) => {
                        console.log('[Trivia] Game Over');
                        const gameMessage = game.getGameOverMessage();
                        client.gameManager.destroyLobby(interaction.user);
                        await interaction.editReply(gameMessage);
                    });

                    // open game lobby
                    lobby.open();
                    done();
                } catch (err) {
                    try {
                        await replyInteraction(
                            interaction,
                            createErrorEmbed('🚩 Error creating a trivia game: `' + err + '`')
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

function getCategoryOptions(): APIApplicationCommandOptionChoice<string>[] {
    let options = [];
    for (let item in CategoryNamesPretty) {
        if (isNaN(Number(item))) {
            options.push({ name: item, value: item });
        }
    }
    return options;
}
