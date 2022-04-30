import { CommandInteraction, Message } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

interface Run {
  (interaction?: CommandInteraction, message?: Message, args?: string[]): void;
}

export interface Command {
  data: any;
  aliases?: string[];
  run: Run;
}
