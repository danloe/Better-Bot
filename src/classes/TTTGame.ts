import { TextBasedChannel, User } from 'discord.js';
import { GameType } from './GameManager';
import { GameLobby, GameState } from './GameLobby';

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
    public readonly charField = '🔳';
    public readonly charX = '❌';
    public readonly charO = '⭕';
    gameField: string[] = [];
    playerOturn: boolean = false;

    public constructor(host: User, channel: TextBasedChannel) {
        super(GameType.TicTacToe, host, channel, 2, 2);

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
}
