import { MessageEmbed, TextBasedChannel, User } from 'discord.js';
import { GameType } from './GameManager';
import { GameLobby, GameState } from './GameLobby';
import BetterClient from '../client';

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
    public readonly charField;
    public readonly charRed;
    public readonly charYellow;
    gameField: string[][] = [];
    playerYellowTurn: boolean = false;

    public constructor(client: BetterClient, host: User, channel: TextBasedChannel) {
        super(client, GameType.FourWins, host, channel, 2, 2);
        this.name = 'Four Wins';
        this.thumbnail = client.config.fourWins_thumbnail;
        this.charField = client.config.ticTacToe_charField;
        this.charRed = client.config.fourWins_charRed;
        this.charYellow = client.config.fourWins_charYellow;

        this.createGameField();
        this.state = GameState.Waiting;
        this.playerYellowTurn = Math.random() < 0.5 ? true : false;
    }

    getTurnPlayer(): User {
        if (this.playerYellowTurn) return this.players[1];
        return this.players[0];
    }

    createGameField() {
        this.gameField = [
            [
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField
            ],
            [
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField
            ],
            [
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField
            ],
            [
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField
            ],
            [
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField
            ],
            [
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField,
                this.charField
            ]
        ];
    }

    placeMark(columnIndex: number) {
        for (let y = this.gameField.length - 1; y >= 0; y--) {
            if (this.gameField[y][columnIndex] === this.charField) {
                this.gameField[y][columnIndex] = this.playerYellowTurn ? this.charYellow : this.charRed;
                if (this.checkWin(y, columnIndex)) {
                    this.endGame(false);
                } else if (this.isDraw()) {
                    this.endGame(true);
                } else {
                    this.swapTurns();
                }
                break;
            }
        }
    }

    /* https://codepen.io/osbulbul/pen/ngJdYy */
    checkWin(row: number, col: number) {
        if (this.getAdj(row, col, 0, 1) + this.getAdj(row, col, 0, -1) > 2) {
            return true;
        } else {
            if (this.getAdj(row, col, 1, 0) > 2) {
                return true;
            } else {
                if (this.getAdj(row, col, -1, 1) + this.getAdj(row, col, 1, -1) > 2) {
                    return true;
                } else {
                    if (this.getAdj(row, col, 1, 1) + this.getAdj(row, col, -1, -1) > 2) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        }
    }

    getAdj(row: number, col: number, row_inc: number, col_inc: number): number {
        if (this.cellVal(row, col) == this.cellVal(row + row_inc, col + col_inc)) {
            return 1 + this.getAdj(row + row_inc, col + col_inc, row_inc, col_inc);
        } else {
            return 0;
        }
    }

    cellVal(row: number, col: number) {
        if (this.gameField[row] == undefined || this.gameField[row][col] == undefined) {
            return -1;
        } else {
            return this.gameField[row][col];
        }
    }

    isDraw(): boolean {
        for (let i = 0; i < this.gameField[0].length; i++) {
            if (this.gameField[0][i] === this.charField) return false;
        }
        return true;
    }

    endGame(draw: boolean) {
        this.state = GameState.Finished;
        if (draw) {
            this.emit('end', this);
        } else {
            this.winners.push(this.players[this.playerYellowTurn ? 1 : 0]);
            this.emit('end', this);
        }
    }

    swapTurns() {
        this.playerYellowTurn = !this.playerYellowTurn;
        this.emit('tick', this);
    }

    getLobbyMessageEmbed(message: string) {
        let players = '';
        this.players.forEach((player) => {
            players = players + '<@' + player.id + '> ';
        });
        return new MessageEmbed()
            .setColor('#403075')
            .setTitle('Four Wins')
            .setDescription(message)
            .setThumbnail(this.thumbnail)
            .addField(`Players: ${this.players.length} of ${this.maxPlayers} [min ${this.minPlayers}]`, players);
    }
}
