import { MessageEmbed } from "discord.js";

export function createEmbed(title: string, message: string) {
  return {
    embeds: [
      new MessageEmbed()
        .setColor("#1e81b0")
        .setTitle(title)
        .setDescription(message),
    ],
  };
}

export function createErrorEmbed(message: string) {
  return {
    embeds: [
      new MessageEmbed()
        .setColor("#951020")
        .setTitle("Error")
        .setDescription(message),
    ],
  };
}
