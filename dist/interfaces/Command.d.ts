import { CommandInteraction, Message } from "discord.js";
interface Run {
    (interaction?: CommandInteraction, message?: Message, args?: string[]): void;
}
export interface Command {
    data: any;
    aliases?: string[];
    run: Run;
}
export {};
