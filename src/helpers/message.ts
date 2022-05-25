import { EmbedFooterData } from '@discordjs/builders';
import { ColorResolvable, EmbedFieldData, MessageEmbed } from 'discord.js';
import { Track, InputType } from '../classes';
import google from 'googlethis';

export function createEmbed(
    title: string,
    message: string,
    ephemeral: boolean = false,
    color: ColorResolvable = '#E63326',
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

export function getTrackTypeColor(trackType: InputType): ColorResolvable {
    switch (trackType) {
        case InputType.DirectFile:
            return '#999999';
        case InputType.YouTube:
            return '#ff0000';
        case InputType.YouTubePlaylist:
            return '#ff0000';
        case InputType.SoundCloud:
            return '#ff5500';
        case InputType.Newgrounds:
            return '#fda238';
        case InputType.SpotifyTrack:
            return '#1DB954';
        case InputType.SpotifyPlaylist:
            return '#1DB954';
        default:
            return '#ffffff';
    }
}

export function getTrackSourceString(track: Track): string {
    switch (track.inputType) {
        case InputType.DirectFile:
            return track.url.match(/\w+(?=\.\w+\/)\.\w+/gi)![0];
        case InputType.YouTube:
            return 'YouTube';
        case InputType.YouTubePlaylist:
            return 'YouTube';
        case InputType.SoundCloud:
            return 'SoundCloud';
        case InputType.Newgrounds:
            return 'Newgrounds';
        case InputType.SpotifyTrack:
            return 'YouTube';
        case InputType.SpotifyPlaylist:
            return 'YouTube';
        default:
            return 'Unknown';
    }
}

export function getTrackTypeString(track: Track): string {
    switch (track.inputType) {
        case InputType.DirectFile:
            return track.url.match(/\w+(?=\.\w+\/)\.\w+/gi)![0];
        case InputType.YouTube:
            return 'YouTube';
        case InputType.YouTubePlaylist:
            return 'YouTube';
        case InputType.SoundCloud:
            return 'SoundCloud';
        case InputType.Newgrounds:
            return 'Newgrounds';
        case InputType.SpotifyTrack:
            return 'Spotify';
        case InputType.SpotifyPlaylist:
            return 'Spotify';
        default:
            return 'Unknown';
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
    return 0;
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

export function checkEmbedString(string: string, limit: number = 300): string {
    try {
        if (string == null || string == undefined || string == '') return 'Unknown';
        if (string == 'null') return 'No description.';
        if (string.length > limit) {
            let substr = string.substring(0, limit - 1);
            return substr.substring(0, substr.lastIndexOf(' ')) + ' [...]';
        }
        return string;
    } catch (error) {
        return 'Unknown';
    }
}

const announcements = [
    'Next track is ',
    'Next up, ',
    'Now playing, ',
    'Coming up next is ',
    'Listen closely to ',
    'Now coming, ',
    'Shut up, here is ',
    'Stop talking, this is ',
    'Hey Listen',
    "Rythm's not up, let me give you a hug. ",
    "Rythm's gone, my time has come. ",
    'Alright, Rythms lazy, listen to me baby. ',
    "Rythm's not doing shit, let me play this hit. ",
    'Hey Listen',
    "Rhytm who? Nothing that I can't do! ",
    "I don't wanna anounce this, I do it anyways. "
];

const postAnnouncements = [
    ', listen closely.',
    ", don't laugh.",
    ', I love that.',
    ', oh god not again.',
    ', groovy!',
    ', why do you do this?',
    ", that's my jam!"
];

export function getAnnouncementString(trackName: string): string {
    let i = 0;
    if (Math.random() > 0.4) {
        i = Math.floor(Math.random() * announcements.length);
        return announcements[i] + trackName;
    } else {
        i = Math.floor(Math.random() * postAnnouncements.length);
        return trackName + postAnnouncements[i];
    }
}

export async function getLogoUrlfromUrl(url: string): Promise<string> {
    try {
        let domainName = url.match(/\w+(?=\.\w+\/)/gi)![0];
        let images = await google.image(domainName + ' logo | icon', { safe: false });
        return images[0].url;
    } catch (error) {
        console.log(error);
        return '';
    }
}
