var request = require("request");
var Q = require('q');

function SPManager(eventEmitter, artistSearchURL, artistTracksURL) {
	if (!eventEmitter || !artistSearchURL || !artistTracksURL) {
		throw new Error("Error: A new SPManager requires an artistSearchURL and an artistTracksURL.");
	}
  this.eventEmitter = eventEmitter;
	this.artistSearchURL = artistSearchURL;
	this.artistTracksURL = artistTracksURL;
}

SPManager.prototype.verifyArtists = function(artistNames) {
	
	var promises = [];
  var l = artistNames.length;
  for (var i = 0; i < l; i++) {
    promises.push(this.getArtistID(artistNames[i]));
  }

  var allPromises = Q.all(promises);
  allPromises.
    then(this.handleGetArtistIDs.bind(this));
};

SPManager.prototype.getArtistID = function(artistName) {

	var deferred = Q.defer();

  request("https://api.spotify.com/v1/search?type=artist&q=" + artistName, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var resultsArtist = JSON.parse(body);
      if (resultsArtist.artists.total && resultsArtist.artists.items[0].name == artistName) {
        var artistID = resultsArtist.artists.items[0].id;
        console.log(artistName + ": " + artistID);
        deferred.resolve({
          "artistName": artistName,
          "artistID": artistID
        });
      } else {
        deferred.resolve("");
      } 
    } else {
    	// TODO: handle request error
    }
  });

  return deferred.promise;
};

SPManager.prototype.handleGetArtistIDs = function(results) {
  
  var promises = []; 
  
  var l = results.length;
  for (var i = 0; i < l; i++) {
    if (results[i]) {
      promises.push(this.getTopTrack(results[i].artistID, results[i].artistName));
    }
  }

  var allPromises = Q.all(promises);
  allPromises.
    then(this.handleGetTopTracks.bind(this)); 
}

SPManager.prototype.getTopTrack = function(artistID, artistName) {

  var deferred = Q.defer();

  request("https://api.spotify.com/v1/artists/" + artistID + "/top-tracks?country=US", function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var resultsTrack = JSON.parse(body);
      if (resultsTrack.tracks.length) {
        var topTrack = resultsTrack.tracks[0].name;
        deferred.resolve({
          "artistName": artistName,
          "artistID": artistID,
          "topTrack": topTrack
        });
      } else {
        deferred.resolve("");
      }
    } else {
    	// TODO: handle error
    }
  });

  return deferred.promise;
}

SPManager.prototype.handleGetTopTracks = function(results) {
  console.log(results);
	this.eventEmitter.emit("artistsDone", results);
}

module.exports = SPManager;

