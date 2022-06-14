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

export const youTubeGeneratedLists = [
    { name: 'The Hit List', id: 'RDCLAK5uy_mkLtojKLOUUGwnu3ZnN5AaODijlieB-aQ' },
    { name: 'RELEASED', id: 'RDCLAK5uy_lx_HcGQ3dqhBbBk3aaZPWoy2trdcdhfio' },
    { name: 'I Feel House', id: 'RDCLAK5uy_kLwgLlrxA4-_EchctXgTyHR4rwRaRv1wk' },
    { name: 'Pop Fresh', id: 'RDCLAK5uy_nOwL35BM_GUTEbdbw_9FmvQhPWWdd3sAg' },
    { name: 'SAY NO MORE.', id: 'RDCLAK5uy_lMXERBY0Uw6-9ZW1DVmMu8cicbwkkg15Q' },
    { name: 'Alt-Frequencies', id: 'RDCLAK5uy_k0KkqT3D_36qFNHE9rq_Iz8VT-ZV7Jt0o' },
    { name: 'Hits Remixed', id: 'RDCLAK5uy_l2zLaMIWOqWSePvTSmt49GcuR8460ZR10' },
    { name: 'Luxe Life', id: 'RDCLAK5uy_kumKEaPpcfaAOpnEdpjtp4jyLoiqZdRnU' }
];
