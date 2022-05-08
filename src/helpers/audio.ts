import scdl from 'soundcloud-downloader';
import ytdl from 'ytdl-core';
import ytsr from 'ytsr';
import { Track, TrackType } from '../classes/Track';
import https from 'node:https';

function getYouTubeTrack(query: string, requestor: string, announce: boolean) {
    return new Promise<Track>(async (resolve, reject) => {
        try {
            let info: any;

            if (query.includes('://youtu') || query.includes('://www.youtu')) {
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

function getSoundCloudTrack(url: string, requestor: string, announce: boolean) {
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

function getNewgroundsTrack(url: string, requestor: string, announce: boolean) {
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
