import { ColorResolvable, MessageEmbed } from 'discord.js';

export function createEmbed(title: string, message: string, ephemeral: boolean = false, color: ColorResolvable = '#1e81b0') {
    return {
        embeds: [new MessageEmbed().setColor(color).setTitle(title).setDescription(message)],
        ephemeral: ephemeral
    };
}

export function createErrorEmbed(message: string, ephemeral: boolean = true,) {
    return {
        embeds: [new MessageEmbed().setColor('#951020').setTitle('Error').setDescription(message)],
        ephemeral: ephemeral
    };
}
