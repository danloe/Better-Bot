import scdl from 'soundcloud-downloader';
import ytdl from 'ytdl-core';
import ytsr from 'ytsr';
import { Track, InputType } from '../classes';
import https from 'node:https';
import { getLogoUrlfromUrl, timeStringToDurationString as timeStringToSecondsNumber } from './message';
import { Playlist } from '../interfaces';
import BetterClient from '../client';
import fetch from 'node-fetch';

export function determineInputType(args: string): InputType {
    if (args.startsWith('http://') || args.startsWith('https://')) {
        // URL, get type
        if (isYouTubeURL(args)) {
            if (args.includes('playlist?list=')) {
                // YouTube Playlist
                return InputType.YouTubePlaylist;
            } else {
                // YouTube video
                return InputType.YouTube;
            }
        }
        if (isSoundCloudURL(args)) return InputType.SoundCloud;
        if (isNewgroundsURL(args)) return InputType.Newgrounds;
        if (isSpotifyPlaylistURL(args)) return InputType.SpotifyPlaylist;
        return InputType.DirectFile;
    } else {
        // YouTube search
        return InputType.YouTube;
    }
}

export function getYouTubeTrack(query: string, requestor: string, announce: boolean) {
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

            https.get(requestUrl, (res: any) => {
                let rawData: any = '';

                res.on('data', (chunk: any) => {
                    rawData += chunk;
                });

                res.on('end', async () => {
                    try {
                        let playlistItem = JSON.parse(rawData).items![0];
                        let playlist: Playlist;

                        let snippet = playlistItem.snippet;

                        playlist = {
                            name: snippet.title,
                            itemCount: playlistItem.contentDetails.itemCount,
                            url: 'https://youtube.com/playlist?list=' + playlistItem.id,
                            description: snippet.description,
                            publishedAt: snippet.publishedAt,
                            owner: snippet.channelTitle,
                            thumbnailUrl: snippet.thumbnails?.default?.url
                                ? snippet.thumbnails.default.url
                                : await getLogoUrlfromUrl('https://youtube.com/'),
                            announce: announce
                        };
                        resolve(playlist);
                    } catch (error) {
                        console.log(error);
                        reject('Could not load playlist. Check URL and privacy status or try again later.');
                    }
                });
            });
        } catch (error) {
            reject('Could not load playlist. Please try again later.');
        }
    });
}

export function getYoutubePlaylistTracks(
    url: string,
    maxResults: number = 50,
    requestor: string,
    announce: boolean,
    reverse: boolean,
    shuffle: boolean
) {
    return new Promise<Track[]>(async (resolve, reject) => {
        try {
            const apiUrl = 'https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet';
            const apiMaxResults = '&maxResults=' + String(maxResults);
            const playlistId = '&playlistId=' + url.match(/(?<=list=)([a-zA-Z0-9-_]+)?/)![0];
            const apiKey = '&key=' + process.env.GOOGLE_API_KEY;
            const requestUrl = apiUrl + apiMaxResults + playlistId + apiKey;

            https.get(requestUrl, (res: any) => {
                let rawData: any = '';

                res.on('data', (chunk: any) => {
                    rawData += chunk;
                });

                res.on('end', () => {
                    try {
                        let videos = JSON.parse(rawData).items;
                        let tracks: Track[] = [];

                        videos.forEach((video: any) => {
                            let snippet = video.snippet;
                            tracks.push(
                                new Track(
                                    InputType.YouTube,
                                    'https://youtu.be/' + snippet.resourceId.videoId,
                                    snippet.title,
                                    requestor,
                                    announce,
                                    'https://youtu.be/' + snippet.resourceId.videoId,
                                    0,
                                    snippet.thumbnails.default.url,
                                    snippet.description,
                                    '',
                                    snippet.publishedAt
                                )
                            );
                        });

                        if (shuffle) {
                            let currentIndex = tracks.length;
                            let randomIndex = 0;

                            while (currentIndex != 0) {
                                randomIndex = Math.floor(Math.random() * currentIndex);
                                currentIndex--;
                                [tracks[currentIndex], tracks[randomIndex]] = [
                                    tracks[randomIndex],
                                    tracks[currentIndex]
                                ];
                            }
                        } else if (reverse) {
                            tracks = tracks.reverse();
                        }

                        resolve(tracks);
                    } catch (error) {
                        reject(error);
                    }
                });
            });
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
    return new Promise<Track>((resolve, reject) => {
        //send http request
        https.get(url, (res: any) => {
            let body: any;

            res.on('data', (chunk: any) => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    //regex pattern for the https result
                    const pattern = /(?:"params":)(.*)(?:,"portal_item_requirements":)/;
                    let m;
                    m = pattern.exec(body);
                    //regex matching group 1 to json
                    let info = JSON.parse(m![1]);

                    const track = new Track(
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
        });
    });
}

export function getSpotifyPlaylistTracks(
    url: string,
    client: BetterClient,
    requestor: string,
    announce: boolean,
    reverse: boolean,
    shuffle: boolean
) {
    return new Promise<[Playlist, Track[]]>(async (resolve, reject) => {
        try {
            if (client.SpotifyAuthorization == '' || client.SpotifyAuthorizationTimeout < new Date()) {
                await getSpotifyAuthorizationToken(client, reject);
            }

            const apiUrl = 'https://api.spotify.com/v1/playlists/';
            const playlistId = url.match(/(?<=playlist\/)([a-zA-Z0-9-_]+)?/)![0];
            const fields =
                '?fields=name,description,owner,external_urls,id,images,tracks.items(track(album(images),artists,duration_ms,name))';
            const requestUrl = apiUrl + playlistId + fields;

            let response: any = await fetch(requestUrl, {
                method: 'GET',
                headers: {
                    Authorization: client.SpotifyAuthorization
                }
            });
            response = await response.json();
            if (response!.error) reject('Playlist not found. Is it private?');

            let playlistTracks = response.tracks.items;

            let playlist: Playlist = {
                name: response.name || 'Unknown',
                description: response.description || 'No desciption available.',
                url: response.external_urls.spotify,
                itemCount: playlistTracks.length,
                announce: announce,
                owner: response.owner.display_name || 'Unknown',
                publishedAt: 'Unknown',
                thumbnailUrl: response.images?.url || (await getLogoUrlfromUrl(response.external_urls.spotify))
            };

            let tracks: Track[] = [];
            for (const track of playlistTracks) {
                tracks.push(
                    await getYouTubeTrack(track.track.artists[0].name + ' ' + track.track.name, requestor, announce)
                );
            }

            if (shuffle) {
                let currentIndex = tracks.length;
                let randomIndex = 0;

                while (currentIndex != 0) {
                    randomIndex = Math.floor(Math.random() * currentIndex);
                    currentIndex--;
                    [tracks[currentIndex], tracks[randomIndex]] = [tracks[randomIndex], tracks[currentIndex]];
                }
            } else if (reverse) {
                tracks = tracks.reverse();
            }

            resolve([playlist, tracks]);
        } catch (error) {
            reject(error);
        }
    });
}

async function getSpotifyAuthorizationToken(client: BetterClient, reject: (reason?: any) => void) {
    await fetch('https://accounts.spotify.com/api/token?grant_type=client_credentials', {
        method: 'POST',
        headers: {
            Authorization:
                'Basic ' +
                Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
        .then((response) => response.json())
        .then((data: any) => {
            if (data?.error) reject('Spotify API Authorization failed.');
            client.SpotifyAuthorization = data.token_type + ' ' + data.access_token;
            client.SpotifyAuthorizationTimeout = new Date(new Date().getTime() + data.expires_in * 1000);
        })
        .catch((reason) => {
            reject(reason);
        });
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

function isSpotifyPlaylistURL(url: string): boolean {
    const urls = ['https://open.spotify.com/playlist/'];

    for (let u of urls) {
        if (url.startsWith(u)) return true;
    }
    return false;
}
