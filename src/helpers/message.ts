import { ColorResolvable, MessageEmbed } from 'discord.js';

export function createEmbed(title: string, message: string, color: ColorResolvable = '#1e81b0') {
    return {
        embeds: [new MessageEmbed().setColor(color).setTitle(title).setDescription(message)]
    };
}

export function createErrorEmbed(message: string) {
    return {
        embeds: [new MessageEmbed().setColor('#951020').setTitle('Error').setDescription(message)]
    };
}
