import { EmbedBuilder, EmbedFooterData } from '@discordjs/builders';
import {
    ButtonInteraction,
    ColorResolvable,
    CommandInteraction,
    EmbedFieldData,
    MessageEmbed,
    MessagePayload
} from 'discord.js';
import { kStringMaxLength } from 'node:buffer';
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
        embeds: [
            new MessageEmbed()
                .setColor(color)
                .setTitle(title)
                .setDescription(message)
                .addFields(fieldData)
                .setThumbnail(thumbnail)
                .setURL(url)
                .setFooter(footer)
        ],
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

export function timeStringToDurationString(seconds: string): number {
    var split = seconds.split(':');
    var secs = 0;
    if (split.length === 1) return parseInt(split[0]);
    if (split.length === 2) {
        secs = parseInt(split[0]) * 60;
        secs = secs + parseInt(split[1]);
        return secs;
    }
    if (split.length === 3) {
        secs = parseInt(split[0]) * 60;
        secs = secs + parseInt(split[1]) * 60;
        secs = secs + parseInt(split[2]);
        return secs;
    }
}

export function secondsToDurationString(seconds: number): string {
    var hrs = Math.floor(seconds / 3600);
    var mins = Math.floor((seconds - hrs * 3600) / 60);
    var secs = seconds - hrs * 3600 - mins * 60;
    var hs, ms, ss: string;
    if (hrs < 10) {
        hs = '0' + String(hrs);
    } else {
        hs = String(hrs);
    }
    if (mins < 10) {
        ms = '0' + String(mins);
    } else {
        ms = String(mins);
    }
    if (secs < 10) {
        ss = '0' + String(secs);
    } else {
        ss = String(secs);
    }
    if (hrs > 0) return hs + 'hrs ' + ms + 'min ' + ss + 'sec';
    if (mins > 0) return ms + 'min ' + ss + 'sec';
    if (secs > 0) return ss + 'sec';
    return 'live or unknown';
}

export function checkEmbedString(string: string): string {
    try {
        if (string === null || string === undefined || string === '') return 'Unknown';
        if (string.length > 200) return string.substring(0, 199) + '[...]';
        return string;
    } catch (error) {
        return 'Unknown';
    }
}
