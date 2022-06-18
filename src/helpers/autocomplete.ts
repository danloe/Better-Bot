import http from 'node:http';

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
