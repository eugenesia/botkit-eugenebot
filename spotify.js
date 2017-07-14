/**
 * Integrate with spotify.
 */
'use strict';

// Config and credentials.
const config = require('./config');

const SpotifyWebApi = require('spotify-web-api-node');


// credentials are optional
const spotifyApi = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret,
  redirectUri: config.spotify.redirectUri,
});

// Retrieve an access token
// This is required as Spotify implemented a new auth flow since May 2017.
// See https://developer.spotify.com/news-stories/2017/01/27/removing-unauthenticated-calls-to-the-web-api/
spotifyApi.clientCredentialsGrant()
  .then(function(data) {
    console.log('The access token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);

    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(data.body['access_token']);
  }, function(err) {
    console.log('Something went wrong when retrieving an access token', err.message);
  });

// Search tracks whose name, album or artist contains a query term.
// done: function(err, tracks)
function searchTracks(query, done) {

  spotifyApi.searchTracks(query, {limit: 5})
    .then(function(data) {

      // Tracks to return.
      let tracks = [];

      data.body.tracks.items.forEach(function(item, index) {
        tracks.push({
          artistName: item.artists[0].name,
          trackName: item.name,
          thumbUrl: item.album.images[2].url,
          trackUrl: item.external_urls.spotify,
          albumName: item.album.name,
        });
      });

      // Execute callback with track data.
      done(null, tracks);

    }, function(err) {
      // Execute callback with error.
      done(err);
    });
}

exports.searchTracks = searchTracks;

