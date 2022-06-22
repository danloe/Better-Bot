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
import { GameLobby, GameState } from './GameLobby';
import BotterinoClient from '../client';

/*
🔳⭕🔳
❌⭕🔳
🔳❌🔳
*/

const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

export class TTTGame extends GameLobby {
    public readonly charField;
    public readonly charX;
    public readonly charO;
    gameField: string[] = [];
    playerOturn: boolean = false;

    public constructor(client: BotterinoClient, host: User, channel: TextBasedChannel) {
        super(client, GameType.TicTacToe, host, channel, 2, 2);
        this.name = 'Tic Tac Toe';
        this.thumbnail = client.config.games.ticTacToe_thumbnail;
        this.charField = client.config.games.ticTacToe_charField;
        this.charX = client.config.games.ticTacToe_charX;
        this.charO = client.config.games.ticTacToe_charO;

        this.createGameField();
        this.state = GameState.Waiting;
        this.playerOturn = Math.random() >= 0.5 ? true : false;
    }

    getTurnPlayer(): User {
        if (this.playerOturn) return this.players[1];
        return this.players[0];
    }

    createGameField() {
        this.gameField = [
            this.charField,
            this.charField,
            this.charField,
            this.charField,
            this.charField,
            this.charField,
            this.charField,
            this.charField,
            this.charField
        ];
    }

    placeMark(index: number) {
        if (this.gameField[index] !== this.charField) {
            this.emit('tick', this);
            return;
        }

        this.gameField[index] = this.playerOturn ? this.charO : this.charX;
        if (this.checkWin()) {
            this.endGame(false);
        } else if (this.isDraw()) {
            this.endGame(true);
        } else {
            this.swapTurns();
        }
    }

    checkWin(): boolean {
        return winningCombinations.some((combination) => {
            return combination.every((index) => {
                return this.gameField[index] === (this.playerOturn ? this.charO : this.charX);
            });
        });
    }

    isDraw(): boolean {
        for (let i = 0; i < this.gameField.length; i++) {
            if (this.gameField[i] === this.charField) return false;
        }
        return true;
    }

    endGame(draw: boolean) {
        this.state = GameState.Finished;
        if (draw) {
            this.emit('end', this);
        } else {
            this.winners.push(this.players[this.playerOturn ? 1 : 0]);
            this.emit('end', this);
        }
    }

    swapTurns() {
        this.playerOturn = !this.playerOturn;
        this.emit('tick', this);
    }

    getLobbyMessageEmbed(message: string) {
        let players = '';
        this.players.forEach((player) => {
            players = players + '<@' + player.id + '> ';
        });
        return new MessageEmbed()
            .setColor('#403075')
            .setTitle('Tic Tac Toe')
            .setDescription(message)
            .setThumbnail(this.thumbnail)
            .addField(`Players: ${this.players.length} of ${this.maxPlayers} [min ${this.minPlayers}]`, players);
    }

    getGameFieldMessage(): string | MessagePayload | WebhookEditMessageOptions {
        let embedmsg = new MessageEmbed()
            .setColor('#403075')
            .setTitle('Tic Tac Toe')
            .setDescription(
                '<@' + this.players[0].id + '>`' + this.charX + ' vs ' + this.charO + '`<@' + this.players[1].id + '>'
            )
            .addField(
                `Player Turn`,
                `<@${this.playerOturn ? this.players[1].id : this.players[0].id}> ${
                    this.playerOturn ? this.charO : this.charX
                }`
            );
        const row1 = new MessageActionRow().addComponents([
            new MessageButton().setCustomId('ttt_0').setLabel(this.gameField[0]).setStyle('SECONDARY'),
            new MessageButton().setCustomId('ttt_1').setLabel(this.gameField[1]).setStyle('SECONDARY'),
            new MessageButton().setCustomId('ttt_2').setLabel(this.gameField[2]).setStyle('SECONDARY')
        ]);
        const row2 = new MessageActionRow().addComponents([
            new MessageButton().setCustomId('ttt_3').setLabel(this.gameField[3]).setStyle('SECONDARY'),
            new MessageButton().setCustomId('ttt_4').setLabel(this.gameField[4]).setStyle('SECONDARY'),
            new MessageButton().setCustomId('ttt_5').setLabel(this.gameField[5]).setStyle('SECONDARY')
        ]);
        const row3 = new MessageActionRow().addComponents([
            new MessageButton().setCustomId('ttt_6').setLabel(this.gameField[6]).setStyle('SECONDARY'),
            new MessageButton().setCustomId('ttt_7').setLabel(this.gameField[7]).setStyle('SECONDARY'),
            new MessageButton().setCustomId('ttt_8').setLabel(this.gameField[8]).setStyle('SECONDARY')
        ]);
        return {
            embeds: [embedmsg],
            components: [row1, row2, row3]
        };
    }
}
