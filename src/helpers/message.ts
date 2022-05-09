import { ColorResolvable, MessageEmbed } from 'discord.js';
import { TrackType } from '../classes/Track';

export function createEmbed(
    title: string,
    message: string,
    ephemeral: boolean = false,
    color: ColorResolvable = '#1e81b0'
) {
    return {
        embeds: [new MessageEmbed().setColor(color).setTitle(title).setDescription(message)],
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
            return '#999';
        case TrackType.YouTube:
            return '#FF0000';
        case TrackType.SoundCloud:
            return '#f50';
        case TrackType.Newgrounds:
            return '#fda238';
    }
}
