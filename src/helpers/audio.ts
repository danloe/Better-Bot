import scdl from 'soundcloud-downloader';
import ytdl from 'ytdl-core';
import ytsr from 'ytsr';
import { Track, TrackType } from '../classes/Track';
import https from 'node:https';

export function determineTrackType(args: string): TrackType {
    if (args.startsWith('http://') || args.startsWith('https://')) {
        // URL, get type
        if (isYouTubeURL(args)) return TrackType.YouTube;
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
            let info: any;

            if (query.startsWith('http://') || query.startsWith('https://')) {
                info = await ytdl.getInfo(query);

                const track = new Track(
                    TrackType.YouTube,
                    info.videoDetails.video_url,
                    info.videoDetails.title,
                    requestor,
                    announce,
                    info.videoDetails.lengthSeconds
                );

                resolve(track);
            } else {
                const filters1 = await ytsr.getFilters(query);
                const filter1 = filters1.get('Type')!.get('Video');
                const options = {
                    limit: 1
                };
                info = (await ytsr(filter1!.url!, options)).items[0];

                const track = new Track(TrackType.YouTube, info.url, info.title, requestor, announce, info.duration);

                resolve(track);
            }
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
                info.duration,
                info.artwork_url,
                info.genre,
                info.created_at
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
                        decodeURIComponent(info.name),
                        requestor,
                        announce,
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
