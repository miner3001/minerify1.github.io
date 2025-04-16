const fetch = require('node-fetch');
const clientId = 'YOUR_CLIENT_ID'; // Sostituisci con il tuo Client ID
const clientSecret = 'YOUR_CLIENT_SECRET'; // Sostituisci con il tuo Client Secret

const getSpotifyToken = async () => {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        },
        body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    return data.access_token;
};

getSpotifyToken().then(token => {
    console.log('Spotify Access Token:', token);
}).catch(error => {
    console.error('Error getting Spotify token:', error);
});