import http from 'node:http';

const AutocompleteURL = 'http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=';

export function getYouTubeSuggestions(query: string) {
    return new Promise<any>(async (resolve, reject) => {
        http.get(AutocompleteURL + query, function (res) {
            let rawData = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                rawData += chunk;
            });
            res.on('end', () => {
                const parsedData = JSON.parse(rawData);
                resolve(parsedData[1]);
            });
        }).on('error', function (e) {
            reject(e.message);
        });
    });
}
