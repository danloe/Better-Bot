import { TextBasedChannel, User } from 'discord.js';
import { GameType } from './GameManager';
import { GameLobby, GameState } from './GameLobby';

/*
⚪⚪⚪⚪⚪⚪⚪
⚪⚪⚪⚪⚪⚪⚪
⚪⚪⚪⚪⚪⚪⚪
⚪⚪⚪⚪⚪⚪⚪
⚪⚪⚪🔴⚪⚪⚪
⚪⚪🔴🟡⚪⚪⚪
1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣
*/

export class FourWinsGame extends GameLobby {
    public readonly charField = '⚪';
    public readonly charRed = '🔴';
    public readonly charYellow = '🟡';
    gameField: string[][] = [];
    playerOturn: boolean = false;
    winner: User | null = null;

    public constructor(host: User, channel: TextBasedChannel) {
        super(GameType.FourWins, host, channel, 2, 2);

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
        [this.charField, this.charField, this.charField, this.charField, this.charField, this.charField, this.charField],
        [this.charField, this.charField, this.charField, this.charField, this.charField, this.charField, this.charField],
        [this.charField, this.charField, this.charField, this.charField, this.charField, this.charField, this.charField],
        [this.charField, this.charField, this.charField, this.charField, this.charField, this.charField, this.charField],
        [this.charField, this.charField, this.charField, this.charField, this.charField, this.charField, this.charField],
        [this.charField, this.charField, this.charField, this.charField, this.charField, this.charField, this.charField]
        ];
    }

/*
    placeMark(column: number) {
        this.gameField[][] = this.playerOturn ? this.charYellow : this.charRed;
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
                return this.gameField[index] === (this.playerOturn ? this.charYellow : this.charRed);
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
            this.winner = this.players[this.playerOturn ? 1 : 0];
            this.emit('end', this);
        }
    }

    swapTurns() {
        this.playerOturn = !this.playerOturn;
        this.emit('tick', this);
    }
*/
}