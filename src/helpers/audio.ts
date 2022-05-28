import scdl from 'soundcloud-downloader';
import ytdl from 'ytdl-core';
import ytsr from 'ytsr';
import { Track, InputType, Queue } from '../classes';
import { getLoadingMessage, timeStringToDurationString as timeStringToSecondsNumber } from './message';
import { Playlist, PlaylistType } from '../interfaces';
import BetterClient from '../client';
import fetch from 'node-fetch';
import { ButtonInteraction, CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import { safeDeferReply, safeReply, shuffleArray } from './general';
import {
    getSpotifyAlbumsApiResponse,
    getSpotifyPlaylistsApiResponse,
    getSpotifyPlaylistsItemsApiResponse,
    getSpotifyTracksApiResponse
} from './spotifyApi';
import { JSDOM } from 'jsdom';

const youTubeThumbnail = 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg';
const spotifyThumbnail = 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg';

export function determineInputType(args: string): InputType {
    if (args.startsWith('http://') || args.startsWith('https://')) {
        // URL, get type
        if (isYouTubeURL(args)) {
            if (args.includes('playlist?list=')) {
                return InputType.YouTubePlaylist;
            } else {
                return InputType.YouTube;
            }
        }
        if (isSoundCloudURL(args)) return InputType.SoundCloud;
        if (isNewgroundsURL(args)) return InputType.Newgrounds;
        if (isSpotifyTrackURL(args)) return InputType.SpotifyTrack;
        if (isSpotifyAlbumURL(args)) return InputType.SpotifyAlbum;
        if (isSpotifyPlaylistURL(args)) return InputType.SpotifyPlaylist;
        return InputType.DirectFile;
    } else {
        // YouTube search
        return InputType.YouTube;
    }
}

export function getYouTubeTrack(
    query: string,
    requestor: string,
    announce: boolean,
    inputType: InputType = InputType.YouTube
) {
    return new Promise<Track>(async (resolve, reject) => {
        try {
            if (!query.startsWith('http://') && !query.startsWith('https://')) {
                const filters1 = await ytsr.getFilters(query);
                const filter1 = filters1.get('Type')!.get('Video');
                const options = {
                    safeSearch: false,
                    limit: 1
                };
                let searchInfo: any = (await ytsr(filter1!.url!, options)).items[0];
                query = searchInfo.url;
            }

            let info = await ytdl.getInfo(query);

            const track = new Track(
                inputType,
                InputType.YouTube,
                info.videoDetails.video_url,
                info.videoDetails.title,
                requestor,
                announce,
                info.videoDetails.video_url,
                timeStringToSecondsNumber(info.videoDetails.lengthSeconds),
                info.videoDetails.thumbnails[0].url,
                String(info.videoDetails.description),
                '',
                info.videoDetails.publishDate
            );

            resolve(track);
        } catch (error) {
            console.log(error);
            reject('Could not load video. Check URL and privacy status or try again later.');
        }
    });
}

export function getYoutubePlaylist(url: string, announce: boolean) {
    return new Promise<Playlist>(async (resolve, reject) => {
        try {
            const apiUrl =
                'https://youtube.googleapis.com/youtube/v3/playlists?part=snippet&part=contentDetails&maxResults=1';
            const playlistId = '&id=' + url.match(/(?<=list=)([a-zA-Z0-9-_]+)?/)![0];
            const apiKey = '&key=' + process.env.GOOGLE_API_KEY;
            const requestUrl = apiUrl + playlistId + apiKey;

            let response: any = await fetch(requestUrl, {
                method: 'GET'
            });
            response = await response.json();

            if (response!.error) {
                if (response!.error!.message!.includes('API key')) {
                    reject('Google ' + response!.error!.message);
                    return;
                }
                reject('Playlist not found. Is it private?');
                return;
            }

            let playlistItem = response.items![0];
            let playlist: Playlist;
            let snippet = playlistItem.snippet;

            playlist = {
                type: PlaylistType.YouTube,
                name: snippet.title,
                itemCount: playlistItem.contentDetails.itemCount,
                url: 'https://youtube.com/playlist?list=' + playlistItem.id,
                description: snippet.description,
                publishedAt: snippet.publishedAt,
                owner: snippet.channelTitle,
                thumbnailUrl: snippet.thumbnails?.default?.url ? snippet.thumbnails.default.url : youTubeThumbnail,
                announce: announce
            };
            resolve(playlist);
        } catch (error) {
            reject('Could not load playlist. Check URL and privacy status or try again later.');
        }
    });
}

export function getYoutubePlaylistTracks(
    url: string,
    offset: number,
    limit: number,
    requestor: string,
    announce: boolean,
    reverse: boolean,
    shuffle: boolean
) {
    return new Promise<Track[]>(async (resolve, reject) => {
        try {
            const apiUrl = 'https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50';
            const playlistId = '&playlistId=' + url.match(/(?<=list=)([a-zA-Z0-9-_]+)?/)![0];
            const apiKey = '&key=' + process.env.GOOGLE_API_KEY;

            let nextPageToken = '';
            let tracks: Track[] = [];
            let nextPage = true;
            do {
                const requestUrl = apiUrl + nextPageToken + playlistId + apiKey;
                let response: any = await fetch(requestUrl, {
                    method: 'GET'
                });
                response = await response.json();

                if (response!.error) {
                    if (response!.error!.message!.includes('API key')) {
                        reject('Google ' + response!.error!.message);
                        return;
                    }
                    console.log(response!.error);
                    reject('Playlist Tracks not found. Are they private?');
                    return;
                }

                let videos = response.items;
                videos.forEach((video: any) => {
                    let snippet = video.snippet;
                    tracks.push(
                        new Track(
                            InputType.YouTubePlaylist,
                            InputType.YouTube,
                            'https://youtu.be/' + snippet.resourceId.videoId,
                            snippet.title,
                            requestor,
                            announce,
                            'https://youtu.be/' + snippet.resourceId.videoId,
                            0,
                            snippet.thumbnails?.default?.url || youTubeThumbnail,
                            snippet.description,
                            '',
                            snippet.publishedAt
                        )
                    );
                });

                if (tracks.length >= limit + offset) nextPage = false;

                if (response.nextPageToken) {
                    nextPageToken = '&pageToken=' + response.nextPageToken;
                } else {
                    nextPage = false;
                }
            } while (nextPage);

            if (offset) {
                if (tracks.length > offset) {
                    tracks.splice(0, offset - 1);
                }
            }

            if (limit) {
                if (tracks.length > limit) {
                    tracks.splice(limit, tracks.length - limit);
                }
            }

            if (shuffle) {
                tracks = shuffleArray(tracks);
            } else if (reverse) {
                tracks = tracks.reverse();
            }

            resolve(tracks);
        } catch (error) {
            reject(error);
        }
    });
}

export function getSoundCloudTrack(url: string, requestor: string, announce: boolean) {
    return new Promise<Track>(async (resolve, reject) => {
        try {
            let info: any = await scdl.getInfo(url);
            const track = new Track(
                InputType.SoundCloud,
                InputType.SoundCloud,
                info.uri,
                info.title,
                requestor,
                announce,
                url,
                Math.ceil(info.duration / 1000),
                info.artwork_url,
                info.description,
                info.genre,
                String(info.created_at).split('T')[0]
            );

            resolve(track);
        } catch (error) {
            reject(error);
        }
    });
}

export function getNewgroundsTrack(url: string, requestor: string, announce: boolean) {
    return new Promise<Track>(async (resolve, reject) => {
        let response: any = await fetch(url, {
            method: 'GET'
        });
        response = await response.json();
        if (response!.error) reject('Track not found. Is it private?');

        try {
            //regex pattern for the https result
            const pattern = /(?:"params":)(.*)(?:,"portal_item_requirements":)/;
            let m;
            m = pattern.exec(response);
            //regex matching group 1 to json
            let info = JSON.parse(m![1]);

            const track = new Track(
                InputType.Newgrounds,
                InputType.Newgrounds,
                info.filename,
                `${info.artist} - ${decodeURIComponent(info.name)}`,
                requestor,
                announce,
                url,
                info.duration,
                info.icon
            );

            resolve(track);
        } catch (error) {
            reject(error);
        }
    });
}

export function getSpotifyTrack(url: string, client: BetterClient, requestor: string, announce: boolean) {
    return new Promise<Track>(async (resolve, reject) => {
        try {
            let response = await getSpotifyTracksApiResponse(client, url, reject);
            const track = await getYouTubeTrack(
                response.artists[0].name + ' ' + response.name,
                requestor,
                announce,
                InputType.SpotifyTrack
            );
            resolve(track);
        } catch (error) {
            reject(error);
        }
    });
}

export function getSpotifyAlbumOrPlaylistTracks(
    url: string,
    client: BetterClient,
    interaction: CommandInteraction | ButtonInteraction,
    announce: boolean,
    reverse: boolean,
    shuffle: boolean,
    offset: number,
    limit: number
) {
    return new Promise<[Playlist, Track[]]>(async (resolve, reject) => {
        try {
            let response: any;
            let playlist: Playlist;
            let tracks: Track[] = [];
            let responseTracks: any[];

            if (url.includes('/album/')) {
                response = await getSpotifyAlbumsApiResponse(client, url, reject);
                responseTracks = response.tracks.items;
                playlist = {
                    type: PlaylistType.SpotifyAlbum,
                    name: JSDOM.fragment(response.name).textContent || 'Unknown',
                    description:
                        'Album Type: ' +
                        JSDOM.fragment(response.album_type).textContent +
                        (response.copyrights
                            ? '\nCopyright: (' + response.copyrights[0]!.type + ') ' + response.copyrights[0]!.text
                            : ''),
                    url: response.external_urls.spotify,
                    itemCount: responseTracks.length,
                    announce: announce,
                    owner: response.artists[0]?.name || 'Unknown',
                    publishedAt: response.release_date,
                    thumbnailUrl: response.images[0]?.url || spotifyThumbnail
                };
            } else {
                response = await getSpotifyPlaylistsApiResponse(client, url, reject);
                responseTracks = response.tracks.items;
                playlist = {
                    type: PlaylistType.SpotifyPlaylist,
                    name: JSDOM.fragment(response.name).textContent || 'Unknown',
                    description: JSDOM.fragment(response.description).textContent || 'No desciption available.',
                    url: response.external_urls.spotify,
                    itemCount: response.tracks.total,
                    announce: announce,
                    owner: response.owner.display_name || 'Unknown',
                    publishedAt: 'Unknown',
                    thumbnailUrl: response.images[0]?.url || spotifyThumbnail
                };
                let next = responseTracks.length < playlist.itemCount;
                while (next) {
                    let res: any = await getSpotifyPlaylistsItemsApiResponse(
                        client,
                        url,
                        responseTracks.length,
                        reject
                    );
                    let trackArr: any[] = res.items;
                    responseTracks.push(trackArr);
                    next = responseTracks.length < playlist.itemCount;
                }
            }

            if (offset) {
                if (responseTracks.length > offset) {
                    responseTracks.splice(0, offset - 1);
                }
            }

            if (limit) {
                if (responseTracks.length > limit) {
                    responseTracks.splice(limit, responseTracks.length - limit);
                }
            }

            if (shuffle) {
                responseTracks = shuffleArray(responseTracks);
            } else if (reverse) {
                responseTracks = responseTracks.reverse();
            }

            // Get first track
            if (playlist.type === PlaylistType.SpotifyAlbum) {
                tracks.push(
                    await getYouTubeTrack(
                        responseTracks[0].artists[0].name + ' ' + responseTracks[0].name,
                        interaction.user.username,
                        announce,
                        InputType.SpotifyPlaylist
                    )
                );
            } else {
                tracks.push(
                    await getYouTubeTrack(
                        responseTracks[0].track.artists[0].name + ' ' + responseTracks[0].track.name,
                        interaction.user.username,
                        announce,
                        InputType.SpotifyAlbum
                    )
                );
            }

            // Remove first track
            responseTracks.splice(0, 1);

            // Load other tracks in background
            const queue = client.musicManager.getQueue(interaction);
            loadAndQueueAsync(interaction, playlist, queue, responseTracks, announce);

            resolve([playlist, tracks]);
        } catch (error) {
            reject(error);
        }
    });
}

function loadAndQueueAsync(
    interaction: CommandInteraction | ButtonInteraction,
    playlist: Playlist,
    queue: Queue,
    responseTracks: any[],
    announce: boolean
) {
    return new Promise<void>(async (resolve, reject) => {
        let stopLoop = false;
        let loaded = 1;
        let failed = 0;
        let embedmsg!: MessageEmbed;

        // Start interval message
        let messageTrigger = setInterval(async () => {
            embedmsg = getLoadingMessageEmbed(interaction, playlist, responseTracks, loaded, failed);
            const row = new MessageActionRow().addComponents([
                new MessageButton().setCustomId('loading_stop').setLabel('Stop Import').setStyle('DANGER')
            ]);

            const collector = interaction.channel!.createMessageComponentCollector({
                componentType: 'BUTTON',
                time: 3_000
            });

            collector.on('collect', async (button) => {
                try {
                    clearInterval(messageTrigger);
                    await safeDeferReply(button);
                    if (button.customId === 'loading_stop') {
                        stopLoop = true;
                    }
                    await safeReply(interaction, { embeds: [embedmsg], components: [] });
                } catch (err) {
                    console.log(err);
                }
            });

            await safeReply(interaction, { embeds: [embedmsg], components: [row] });
        }, 3_000);

        // Get tracks
        for (const track of responseTracks) {
            try {
                if (playlist.type === PlaylistType.SpotifyAlbum) {
                    queue.queue(
                        await getYouTubeTrack(
                            track.artists[0].name + ' ' + track.name,
                            interaction.user.username,
                            announce,
                            InputType.SpotifyPlaylist
                        )
                    );
                } else {
                    queue.queue(
                        await getYouTubeTrack(
                            track.track.artists[0].name + ' ' + track.track.name,
                            interaction.user.username,
                            announce,
                            InputType.SpotifyAlbum
                        )
                    );
                }
                loaded += 1;
                if (stopLoop) {
                    break;
                }
            } catch (error) {
                failed += 1;
                continue;
            }
        }
        clearInterval(messageTrigger);
        embedmsg = getLoadingMessageEmbed(interaction, playlist, responseTracks, loaded, failed, true);
        await safeReply(interaction, { embeds: [embedmsg], components: [] });
        resolve();
    });
}

function getLoadingMessageEmbed(
    interaction: CommandInteraction | ButtonInteraction,
    playlist: Playlist,
    playlistTracks: any,
    loaded: number,
    failed: number,
    done: boolean = false
) {
    let desciptionMsg = '';
    if (done) {
        desciptionMsg = '`🔺 ' + String(loaded + 1) + ' Playlist Track(s) loaded and added to the queue.`';
    } else {
        desciptionMsg =
            '`🔺 Playlist is loading...`\n`' +
            getLoadingMessage(loaded + failed, playlistTracks.length) +
            ' ' +
            String(Math.floor(((loaded + failed) / playlistTracks.length) * 100)) +
            '%`\n' +
            '`Loaded: ' +
            String(loaded) +
            (failed > 0 ? '`\n`Not found: ' + String(failed) + '`' : '`');
    }
    let embedmsg = new MessageEmbed()
        .setColor('#1DB954')
        .setTitle(playlist.name)
        .setDescription(desciptionMsg)
        .setThumbnail(playlist.thumbnailUrl || spotifyThumbnail)
        .addField('Description', playlist.description, false)
        .addField('Owner', playlist.owner, true)
        .addField('Videos', String(playlist.itemCount), true)
        .addField('Published At', playlist.publishedAt, true);
    embedmsg.footer = {
        text: `Requested by ${interaction.user.username}` + (playlist.announce ? ' 📣' : ''),
        iconURL: interaction.user.avatarURL() || undefined
    };
    return embedmsg;
}

function isYouTubeURL(url: string): boolean {
    const urls = [
        'http://youtube.com/',
        'https://youtube.com/',
        'http://www.youtube.com/',
        'https://www.youtube.com/',
        'http://m.youtube.com/',
        'https://m.youtube.com/',
        'http://youtu.be/',
        'https://youtu.be/'
    ];

    for (let u of urls) {
        if (url.startsWith(u)) return true;
    }
    return false;
}

function isSoundCloudURL(url: string): boolean {
    const urls = ['http://soundcloud.com/', 'https://soundcloud.com/'];

    for (let u of urls) {
        if (url.startsWith(u)) return true;
    }
    return false;
}

function isNewgroundsURL(url: string): boolean {
    const urls = ['https://www.newgrounds.com/audio/listen/'];

    for (let u of urls) {
        if (url.startsWith(u)) return true;
    }
    return false;
}

function isSpotifyTrackURL(url: string): boolean {
    const urls = ['https://open.spotify.com/track/'];

    for (let u of urls) {
        if (url.startsWith(u)) return true;
    }
    return false;
}

function isSpotifyPlaylistURL(url: string): boolean {
    const urls = ['https://open.spotify.com/playlist/'];

    for (let u of urls) {
        if (url.startsWith(u)) return true;
    }
    return false;
}

function isSpotifyAlbumURL(url: string): boolean {
    const urls = ['https://open.spotify.com/album/'];

    for (let u of urls) {
        if (url.startsWith(u)) return true;
    }
    return false;
}
