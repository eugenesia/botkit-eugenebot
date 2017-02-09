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

