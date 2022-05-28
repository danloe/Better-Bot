import { EmbedFooterData, embedLength } from '@discordjs/builders';
import { ColorResolvable, EmbedFieldData, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import { Track, InputType, Queue } from '../classes';
import google from 'googlethis';
import { AudioPlayer, AudioPlayerStatus } from '@discordjs/voice';

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
        case InputType.SpotifyAlbum:
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
            return 'YouTube Playlist';
        case InputType.SoundCloud:
            return 'SoundCloud';
        case InputType.Newgrounds:
            return 'Newgrounds';
        case InputType.SpotifyTrack:
            return 'Spotify Track';
        case InputType.SpotifyAlbum:
            return 'Spotify Album';
        case InputType.SpotifyPlaylist:
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

export function getLoadingMessage(actual: number, total: number, style = 0, size = 20): string {
    let p = Math.floor((actual / total) * 100);
    let bars = ['⣀⣄⣤⣦⣶⣷⣿', '▁▂▃▄▅▆▇█', '□▣■'];
    var full: number,
        m: string,
        middle: number,
        rest: number,
        x: number,
        full_symbol = bars[style][bars.length - 1],
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

function repeatString(string: string, amount: number) {
    var s = '';
    for (var j = 0; j < amount; j++) s += string;
    return s;
}

export function getNowPlayingMessage(
    currentTrack: Track,
    queue: Queue,
    audioPlayer: AudioPlayer,
    durationMs: number,
    showTrackBar: boolean = false
): [message: MessageEmbed, row: MessageActionRow] {
    let embedmsg = new MessageEmbed().setColor('#403075').setTitle('Queue');

    if (currentTrack) {
        embedmsg
            .setTitle(currentTrack.name)
            .setURL(currentTrack.displayUrl)
            .setThumbnail(currentTrack.artworkUrl)
            .setDescription('Requested by ' + currentTrack.requestor);
    }

    if (showTrackBar) {
        if (!isNaN(currentTrack.duration)) {
            embedmsg.addField('\u200B', '`' + getLoadingMessage(durationMs / 1000, currentTrack.duration, 2) + '`');
        } else {
            embedmsg.addField('\u200B', '`Track is running since:' + String(durationMs / 1000) + 'seconds`');
        }
    }

    if (queue.length > 0) {
        embedmsg.addField('\u200B', '**Next:**');

        for (let i = 0; i < 2; i++) {
            if (i + 1 > queue.length) break;
            embedmsg.addField(
                i + 1 + ': `' + queue[i].name + '`',
                queue[i].requestor + (queue[i].announce ? ' 📣' : '') + ' | ' + queue[i].displayUrl
            );
        }
    }
    const row = new MessageActionRow().addComponents([
        new MessageButton().setCustomId('np_back').setLabel('⏮️').setStyle('SECONDARY'),
        new MessageButton().setCustomId('np_stop').setLabel('⏹️').setStyle('SECONDARY'),
        new MessageButton()
            .setCustomId('np_playresume')
            .setLabel(audioPlayer.state.status === AudioPlayerStatus.Paused ? '▶️' : '⏸️')
            .setStyle('SECONDARY'),
        new MessageButton().setCustomId('np_skip').setLabel('⏭️').setStyle('SECONDARY'),
        new MessageButton().setCustomId('np_repeat').setLabel('🔂').setStyle('SECONDARY')
    ]);

    return [embedmsg, row];
}
