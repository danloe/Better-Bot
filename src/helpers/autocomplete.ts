import http from 'node:http';
import fs from 'fs';
import { Logger } from '../classes';
import { shuffleArray } from './general';
import path from 'node:path';

const YouTubeSuggestionsURL = 'http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=';

export function getYouTubeSuggestions(query: string) {
    return new Promise<any>(async (resolve, reject) => {
        http.get(YouTubeSuggestionsURL + query, function (res) {
            let rawData = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                rawData += chunk;
            });
            res.on('end', () => {
                let parsedData: any;
                try {
                    parsedData = JSON.parse(rawData);
                } catch (error) {
                    resolve('»No results found«');
                }
                resolve(parsedData[1]);
            });
        }).on('error', function (e) {
            reject(e.message);
        });
    });
}

export function getSoundboardSuggestions(query: string) {
    try {
        const q = query.toLowerCase();
        var files = fs.readdirSync(path.resolve(__dirname, '../commands/audio/resources/'), {
            withFileTypes: false
        }) as string[];

        files = files.map((file) => file.replace('.mp3', ''));

        if (query.length === 0) {
            return shuffleArray(files).slice(0, 20);
        } else {
            return files
                .filter((element: string) => element.toLowerCase().startsWith(q) || element.toLowerCase().includes(q))
                .slice(0, 20);
        }
    } catch (error: any) {
        Logger.error(error.message);
    }
}
