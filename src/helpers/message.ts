import { EmbedBuilder, EmbedFooterData } from '@discordjs/builders';
import {
    ButtonInteraction,
    ColorResolvable,
    CommandInteraction,
    EmbedFieldData,
    MessageEmbed,
    MessagePayload
} from 'discord.js';
import { TrackType } from '../classes/Track';

export function createEmbed(
    title: string,
    message: string,
    ephemeral: boolean = false,
    color: ColorResolvable = '#403075',
    fieldData: EmbedFieldData[] = [],
    thumbnail: string = '',
    url: string = '',
    footer: EmbedFooterData | null = null
) {
    return {
        embeds: [new MessageEmbed().setColor(color).setTitle(title).setDescription(message).addFields(fieldData).setThumbnail(thumbnail).setURL(url).setFooter(footer)],
        ephemeral: ephemeral
    };
}

export function createErrorEmbed(message: string, ephemeral: boolean = true) {
    return {
        embeds: [new MessageEmbed().setColor('#951020').setTitle('Error').setDescription(message)],
        ephemeral: ephemeral
    };
}

export function getTrackTypeColor(trackType: TrackType): ColorResolvable {
    switch (trackType) {
        case TrackType.DirectFile:
            return '#999999';
        case TrackType.YouTube:
            return '#ff0000';
        case TrackType.SoundCloud:
            return '#ff5500';
        case TrackType.Newgrounds:
            return '#fda238';
    }
}

export function getTrackTypeString(trackType: TrackType): string {
    switch (trackType) {
        case TrackType.DirectFile:
            return 'Direct Link To File';
        case TrackType.YouTube:
            return 'YouTube';
        case TrackType.SoundCloud:
            return 'SoundCloud';
        case TrackType.Newgrounds:
            return 'Newgrounds';
    }
}

export async function replyInteraction(interaction: CommandInteraction, message: string | MessagePayload) {
    if (interaction.replied) {
        await interaction.editReply(message);
    } else {
        await interaction.reply(message);
    }
}

export async function replyDefer(interaction: CommandInteraction | ButtonInteraction) {
    if (!interaction.deferred) {
        await interaction.deferReply();
    }
}

export function secondsToDurationString(seconds: number): string {
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds - hours * 3600) / 60);
    var seconds = seconds - hours * 3600 - minutes * 60;
    var hs, ms, ss: string;
    if (hours < 10) {
        hs = '0' + hours;
    }
    if (minutes < 10) {
        ms = '0' + minutes;
    }
    if (seconds < 10) {
        ss = '0' + seconds;
    }
    if (hours > 0) return hours + 'h : ' + minutes + 'm : ' + seconds + 's';
    if (minutes > 0) return minutes + 'm : ' + seconds + 's';
    if (seconds > 0) return seconds + 's';
    return 'live or unknown';
}
