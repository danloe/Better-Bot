import { ColorResolvable, EmbedFieldData, MessageEmbed } from 'discord.js';
import { Track, TrackType } from '../classes';
import google from 'googlethis';
import BotterinoClient from '../client';
import { EmbedFooterData } from '@discordjs/builders';

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
        embeds: [
            new MessageEmbed()
                .setColor('#951020')
                .setTitle(global.config.general.errorEmbedMessage || 'Error')
                .setDescription(message)
        ],
        ephemeral: ephemeral
    };
}

export function getTrackTypeColor(trackType: TrackType): ColorResolvable {
    switch (trackType) {
        case TrackType.DirectFile:
            return '#999999';
        case TrackType.YouTube:
            return '#ff0000';
        case TrackType.YouTubePlaylist:
            return '#ff0000';
        case TrackType.SoundCloud:
            return '#ff5500';
        case TrackType.Newgrounds:
            return '#fda238';
        case TrackType.SpotifyTrack:
            return '#1DB954';
        case TrackType.SpotifyAlbum:
            return '#1DB954';
        case TrackType.SpotifyPlaylist:
            return '#1DB954';
        default:
            return '#ffffff';
    }
}

export function getTrackSourceString(track: Track): string {
    switch (track.inputType) {
        case TrackType.DirectFile:
            return track.url.match(/\w+(?=\.\w+\/)\.\w+/gi)![0];
        case TrackType.YouTube:
            return 'YouTube';
        case TrackType.YouTubePlaylist:
            return 'YouTube';
        case TrackType.SoundCloud:
            return 'SoundCloud';
        case TrackType.Newgrounds:
            return 'Newgrounds';
        case TrackType.SpotifyTrack:
            return 'YouTube';
        case TrackType.SpotifyPlaylist:
            return 'YouTube';
        default:
            return 'Unknown';
    }
}

export function getTrackTypeString(track: Track): string {
    switch (track.inputType) {
        case TrackType.DirectFile:
            return track.url.match(/\w+(?=\.\w+\/)\.\w+/gi)![0];
        case TrackType.YouTube:
            return 'YouTube';
        case TrackType.YouTubePlaylist:
            return 'YouTube Playlist';
        case TrackType.SoundCloud:
            return 'SoundCloud';
        case TrackType.Newgrounds:
            return 'Newgrounds';
        case TrackType.SpotifyTrack:
            return 'Spotify Track';
        case TrackType.SpotifyAlbum:
            return 'Spotify Album';
        case TrackType.SpotifyPlaylist:
            return 'Spotify Playlist';
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
    var hs: string, ms: string, ss: string;
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

export function secondsToColonsString(seconds: number): string {
    var mins = Math.floor(seconds / 60);
    var secs = seconds - mins * 60;
    var ms: string, ss: string;
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
    return ms + ':' + ss;
}

export function checkEmbedString(string: string, limit: number = 500): string {
    try {
        limit = global.config.music.trackDescriptionLengthLimit || limit;
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

export function getAnnouncementString(trackName: string): string {
    let i = 0;
    if (Math.random() > global.config.music.postAnnouncementChance || 0.4) {
        i = Math.floor(Math.random() * global.config.music.announcements.length);
        return global.config.music.announcements[i] + trackName;
    } else {
        i = Math.floor(Math.random() * global.config.music.postAnnouncements.length);
        return trackName + global.config.music.postAnnouncements[i];
    }
}

export async function getLogoUrlfromUrl(client: BotterinoClient, url: string): Promise<string> {
    try {
        let domainName = url.match(/\w+(?=\.\w+\/)/gi)![0];
        let images = await google.image(domainName + ' logo | icon', { safe: false });
        return images[0].url;
    } catch (err: any) {
        client.logger.debug(err);
        return '';
    }
}

export function getLoadingString(actual: number, total: number, style = 0, size = 20): string {
    size = global.config.music.loadingBarSize || size;
    let p = Math.floor((actual / total) * 100);
    let bars = ['⣀⣄⣤⣦⣶⣷⣿', '▁▂▃▄▅▆▇█'];
    var full: number,
        m: string,
        middle: number,
        rest: number,
        x: number,
        full_symbol = bars[style][bars[style].length - 1],
        barStyleIndex = bars[style].length - 1,
        bar: string = '';
    if (p == 100) return repeatString(full_symbol, size);
    p = p / 100;
    x = p * size;
    full = Math.floor(x);

    rest = x - full;
    middle = Math.floor(rest * barStyleIndex);
    m = bars[style][middle];

    bar = repeatString(full_symbol, full) + m + repeatString(bars[style][0], size - full - 1);
    return bar;
}

export function getTrackBarString(actual: number, total: number, size = 20) {
    size = global.config.music.nowPlayingTrackBarSize || size;
    let percentPlayed = actual / total;
    let barPercent = Math.floor(percentPlayed * size);
    //|■■■■■▣□□□□□|
    //start
    let barString = '|';
    //small white squares
    barString += repeatString('■', barPercent - 1);

    //button
    barString += '▣';

    //small black squares
    barString += repeatString('□', size - barPercent - 1);

    //end
    barString += '|';

    return barString;
}

function repeatString(string: string, amount: number): string {
    var s = '';
    for (var j = 0; j < amount; j++) s += string;
    return s;
}
