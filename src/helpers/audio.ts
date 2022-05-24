import scdl from 'soundcloud-downloader';
import ytdl from 'ytdl-core';
import ytsr from 'ytsr';
import { Track, TrackType } from '../classes';
import https from 'node:https';
import { getLogoUrlfromUrl, timeStringToDurationString as timeStringToSecondsNumber } from './message';
import { Playlist } from '../interfaces';

export function determineInputType(args: string): TrackType {
    if (args.startsWith('http://') || args.startsWith('https://')) {
        // URL, get type
        if (isYouTubeURL(args)) {
            if (args.includes('playlist?list=')) {
                // YouTube Playlist
                return TrackType.YouTubePlaylist;
            } else {
                // YouTube video
                return TrackType.YouTube;
            }
        }
        if (isSoundCloudURL(args)) return TrackType.SoundCloud;
        if (isNewgroundsURL(args)) return TrackType.Newgrounds;
        return TrackType.DirectFile;
    } else {
        // YouTube search
        return TrackType.YouTube;
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
                TrackType.YouTube,
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
                            channelTitle: snippet.channelTitle,
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

export function getYoutubePlaylistTracks(url: string, maxResults: number = 50, requestor: string, announce: boolean) {
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
                                    TrackType.YouTube,
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
                TrackType.SoundCloud,
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
                        TrackType.Newgrounds,
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
