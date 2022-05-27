import {
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    MessagePayload,
    TextBasedChannel,
    User,
    WebhookEditMessageOptions
} from 'discord.js';
import { GameType } from './GameManager';
import { GameDifficulty, GameLobby, GameState } from './GameLobby';
import emoji from 'node-emoji';
import BetterClient from '../client';

/*

😔😦😤😡🥴
🥺🤫🫣😖😜
🤤🫤😔😲😖
🤑😵🤒🥸🤡
😓😝😐🙄😚

*/

export class FindTheEmojiGame extends GameLobby {
    rounds: number = 10;
    difficulty: GameDifficulty = GameDifficulty.Easy;
    tries: number = 1;
    emojiSearchTime = 20;
    answerDisplayTime = 7_000;

    round: number = 0;
    emojiWanted: emoji.Emoji = emoji.random();
    emojiField: string[] = [];
    score: Map<User, number> = new Map<User, number>();
    answerTries: Map<User, number> = new Map<User, number>();
    answerGiven: User[] = [];
    answeredCorrectly: User | null = null;

    public constructor(client: BetterClient, host: User, channel: TextBasedChannel, maxPlayers: number) {
        super(client, GameType.FindTheEmoji, host, channel, 1, maxPlayers);
        this.name = 'Find The Emoji';
        this.thumbnail = client.config.findTheEmoji_thumbnail;
    }

    selectEmoji(player: User, index: number) {
        if (this.answeredCorrectly) {
            return;
        }
        let tries = this.answerTries.get(player);
        if (tries && tries > 0) {
            if (this.emojiField[index] === this.emojiWanted.emoji) {
                this.answeredCorrectly = player;
                let playerScore = this.score.get(player);
                if (playerScore) {
                    playerScore++;
                } else {
                    playerScore = 1;
                }
                this.score.set(player, playerScore);
                this.displayAnswer();
                return;
            } else {
                tries!--;
                if (tries <= 0) {
                    this.answerTries.delete(player);
                    this.answerGiven.push(player);
                } else {
                    this.answerTries.set(player, tries!);
                }

                if (this.answerTries.size == 0) {
                    this.displayAnswer();
                } else {
                    this.displaySearch();
                }
            }
        }
    }

    displayAnswer() {
        this.emit('answer', this);
    }

    displaySearch() {
        this.emit('search', this);
    }

    displayGameOver() {
        this.emit('end', this);
    }

    nextRound() {
        if (this.round < this.rounds) {
            this.round++;

            this.emojiWanted = emoji.random();

            this.emojiField = [];
            for (let i = 0; i < 25; i++) {
                this.emojiField.push(emoji.random().emoji);
            }
            this.emojiField[Math.floor(Math.random() * 25)] = this.emojiWanted.emoji;

            this.players.forEach((player) => {
                this.answerTries.set(player, this.tries);
            });
            this.answerGiven = [];
            this.answeredCorrectly = null;
            this.displaySearch();
        } else {
            this.state = GameState.Finished;
            this.displayGameOver();
        }
    }

    restartRound() {
        if (this.round < this.rounds) {
            this.emojiWanted = emoji.random();

            this.emojiField = [];
            for (let i = 0; i < 25; i++) {
                this.emojiField.push(emoji.random().emoji);
            }
            this.emojiField[Math.floor(Math.random() * 25)] = this.emojiWanted.emoji;

            this.players.forEach((player) => {
                this.answerTries.set(player, this.tries);
            });
            this.answerGiven = [];
            this.answeredCorrectly = null;
            this.displaySearch();
        } else {
            this.state = GameState.Finished;
            this.displayGameOver();
        }
    }

    getLobbyMessageEmbed(message: string) {
        let players = '';
        this.players.forEach((player) => {
            players = players + '<@' + player.id + '> ';
        });
        let embedmsg = new MessageEmbed()
            .setColor('#403075')
            .setTitle(this.name)
            .setDescription(message)
            .setThumbnail(this.thumbnail);

        embedmsg.addField('Rounds:', String(this.rounds), true);
        if (this.difficulty) embedmsg.addField('Difficulty:', this.difficulty, true);
        if (this.tries) embedmsg.addField('Tries:', String(this.tries), true);
        if (this.emojiSearchTime) embedmsg.addField('Time:', String(this.emojiSearchTime / 1000) + ' seconds', true);
        embedmsg.addField(
            `Players: ${this.players.length} of ${this.maxPlayers} [min ${this.minPlayers}]`,
            players,
            false
        );
        return embedmsg;
    }

    getSearchMessage(): string | MessagePayload | WebhookEditMessageOptions {
        let requiredPlayers = '🔎 ';
        let answeredPlayers = '🧑🏻‍🦯 ';
        this.answerTries.forEach((_tries, player, _map) => {
            requiredPlayers = requiredPlayers + '<@' + player.id + '> ';
        });
        this.answerGiven.forEach((player) => {
            answeredPlayers = answeredPlayers + '<@' + player.id + '> ';
        });

        let emojiString = '';
        switch (this.difficulty) {
            case GameDifficulty.Easy:
                emojiString = this.emojiWanted.emoji;
                break;
            case GameDifficulty.Medium:
                emojiString = Math.random() >= 0.5 ? this.emojiWanted.emoji : this.emojiWanted.key;
                break;
            case GameDifficulty.Hard:
                emojiString = '`' + this.emojiWanted.key + '`';
                break;
        }

        let embedmsg = new MessageEmbed()
            .setColor('#DDD620')
            .setTitle(this.name)
            .setDescription('Search: ' + emojiString)
            .addField('Round:', String(this.round) + ' of ' + String(this.rounds), true)
            .addField('Difficulty:', this.difficulty, true)
            .addField('Time:', String(this.emojiSearchTime / 1000) + ' seconds', true)
            .addField('Answer awaited:', requiredPlayers, false)
            .addField('No more tries:', answeredPlayers, false);

        let row = new MessageActionRow();
        let rows: MessageActionRow[] = [];
        let components: MessageButton[] = [];

        for (let r = 0; r <= 20; r = r + 5) {
            for (let c = 0; c < 5; c++) {
                components.push(
                    new MessageButton()
                        .setCustomId('emoji_' + String(r + c))
                        .setLabel(' ')
                        .setEmoji(this.emojiField[r + c])
                        .setStyle('SECONDARY')
                );
            }
            row.addComponents([...components]);
            rows.push(row);
            row = new MessageActionRow();
            components = [];
        }

        return {
            content: ' ',
            embeds: [embedmsg],
            components: [...rows]
        };
    }

    getAnswerMessage(): string | MessagePayload | WebhookEditMessageOptions {
        let correctUserString = '';
        if (this.answeredCorrectly) {
            correctUserString = '<@' + this.answeredCorrectly.id + '> 1️⃣🆙';
        } else {
            correctUserString = '`No one has found the emoji!`';
        }

        let embedmsg = new MessageEmbed()
            .setColor('#403075')
            .setTitle(this.name)
            .setDescription('Emoji: ' + this.emojiWanted.emoji + ' `(' + this.emojiWanted.key + ')`')
            .addField('Round:', String(this.round) + ' of ' + String(this.rounds), true)
            .addField('Fastest User', correctUserString, false);

        let row = new MessageActionRow();
        let rows: MessageActionRow[] = [];
        let components: MessageButton[] = [];

        for (let r = 0; r <= 20; r = r + 5) {
            for (let c = 0; c < 5; c++) {
                components.push(
                    new MessageButton()
                        .setCustomId('emoji_' + String(r + c))
                        .setLabel(' ')
                        .setEmoji(this.emojiField[r + c])
                        .setStyle(this.emojiField[r + c] === this.emojiWanted.emoji ? 'PRIMARY' : 'SECONDARY')
                        .setDisabled(true)
                );
            }
            row.addComponents([...components]);
            rows.push(row);
            row = new MessageActionRow();
            components = [];
        }

        return {
            content: ' ',
            embeds: [embedmsg],
            components: [...rows]
        };
    }

    getGameOverMessage(): string | MessagePayload | WebhookEditMessageOptions {
        let winners = '';
        let sortedScores: Map<User, number>;

        if (this.score.size > 0) {
            sortedScores = new Map([...this.score.entries()].sort((a, b) => b[1] - a[1]));

            winners = '🎉 <@' + String([...sortedScores][0][0].id) + '> ';
            let one = true;
            for (let [key, value] of sortedScores) {
                if (key.id !== [...sortedScores][0][0].id) {
                    if (value == [...sortedScores][0][1]) {
                        one = false;
                        winners = winners + '& <@' + String(key.id) + '> ';
                    }
                }
            }
            if (one) {
                winners = winners + 'has won the game!';
            } else {
                winners = winners + 'have won the game!';
            }
        } else {
            winners = 'Nobody scored. Everyone is a loser!';
        }

        let embedmsg = new MessageEmbed()
            .setColor('#403075')
            .setTitle(this.name)
            .setDescription(winners)
            .setThumbnail(this.thumbnail);

        if (this.score.size > 0) {
            let i = 1;
            for (let [key, value] of sortedScores!) {
                embedmsg.addField(
                    String(i) + '.',
                    '<@' + key.id + '>: ' + String(value) + (value == 1 ? ' Point' : ' Points')
                );
                i++;
            }
        }

        return {
            content: ' ',
            embeds: [embedmsg],
            components: []
        };
    }
}
