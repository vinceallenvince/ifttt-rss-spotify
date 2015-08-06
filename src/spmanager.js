var request = require("request");
var Q = require('q');

function SPManager(eventEmitter, artistSearchURL, artistTracksURL, titleFilter) {
	if (!eventEmitter || !artistSearchURL || !artistTracksURL) {
		throw new Error("Error: A new SPManager requires an artistSearchURL and an artistTracksURL.");
	}
  this.eventEmitter = eventEmitter;
	this.artistSearchURL = artistSearchURL;
	this.artistTracksURL = artistTracksURL;
  this.titleFilter = titleFilter;
  this.lookup = {};
}

SPManager.prototype.parseAritstNamesFromEventTitles = function(eventTitles) {
	
  var l = eventTitles.length;
  var artistNames = [];
  for (var i = 0; i < l; i++) {
    var parsedName = this._parseArtistName(this.titleFilter, eventTitles[i].title);
    if (!this.lookup[parsedName] && parsedName.search("(CANCELLED)") == -1) {
      this.lookup[parsedName] = true;
      artistNames.push(parsedName);
    }
  }

  this.eventEmitter.emit("artistNamesParsed", artistNames);
};

SPManager.prototype._parseArtistName = function(titleFilter, eventTitle) {

  var venueExp = new RegExp(titleFilter, "i");
  var withExp = new RegExp("\\with[^)]*\\w", "i");
  var commaExp = new RegExp("\\,[^)]*\\w", "i");

  return eventTitle.replace(venueExp, "").replace(withExp, "").replace(commaExp, "").replace("&", "and").trim();
};

SPManager.prototype.getArtistIDs = function(artistNames) {
  var promises = [];
  var l = artistNames.length;
  for (var i = 0; i < l; i++) {
    promises.push(this._getArtistID(artistNames[i]));
  }

  var allPromises = Q.all(promises);
  allPromises.
    then(this.handleAllGetArtistIDs.bind(this));
};

SPManager.prototype._getArtistID = function(artistName) {
	var deferred = Q.defer();
  request("https://api.spotify.com/v1/search?type=artist&q=" + artistName, this._handleGetArtistID.bind(this, deferred, artistName));
  return deferred.promise;
};

SPManager.prototype._selectArtistID = function(artistName, resultsArtist) {
  var l = resultsArtist.artists.items.length;
  for (var i = 0; i < l; i++) {
    var item = resultsArtist.artists.items[i];
    if (item.name == artistName) {
      return item.id;
    }  
  }
};

SPManager.prototype._handleGetArtistID = function(deferred, artistName, error, response, body) {

  if (!error && response.statusCode == 200) {

    var resultsArtist = JSON.parse(body);
    
    if (resultsArtist.artists.total) {

      deferred.resolve({
        "artistName": artistName,
        "artistID": this._selectArtistID(artistName, resultsArtist)
      });
    } else if (artistName.search(" and ") != -1) { // check the name is not a combination of artist names; is there an "and " in the artistName
        var andExp = new RegExp("\\and[^)]*\\w", "i");
        var altName = artistName.replace(andExp, "").trim();
        request("https://api.spotify.com/v1/search?type=artist&q=" + altName, this._handleGetArtistID.bind(this, deferred, altName));
    } else { // Spotify API did not return an artist
      deferred.resolve({
        "artistName": null,
        "artistID": null
      });
    }
  } else {
    deferred.reject();
  }
};

SPManager.prototype.handleAllGetArtistIDs = function(results) {
  
  var promises = []; 
  
  var l = results.length;
  for (var i = 0; i < l; i++) {
    if (results[i].artistID && results[i].artistName) {
      promises.push(this.getTopTrack(results[i].artistID, results[i].artistName));
    }
  }

  var allPromises = Q.all(promises);
  allPromises.
    then(this.handleAllGetTopTracks.bind(this)); 
}

SPManager.prototype.getTopTrack = function(artistID, artistName) {
  var deferred = Q.defer();
  request("https://api.spotify.com/v1/artists/" + artistID + "/top-tracks?country=US", this.handleGetTopTrack.bind(this, deferred, artistID, artistName));
  return deferred.promise;
}

SPManager.prototype.handleGetTopTrack = function(deferred, artistID, artistName, error, response, body) {

  if (error || response.statusCode != 200) {
    this.handleError(error, deferred);
    return;
  }

  // TODO: check market availability

  var resultsTrack = JSON.parse(body);

  if (resultsTrack.tracks.length) {
    var topTrack = resultsTrack.tracks[0].name;
    deferred.resolve({
      "artistName": artistName,
      "artistID": artistID,
      "topTrack": topTrack
    });
    return;
  }
  deferred.resolve({ // no top track
    "artistName": artistName,
    "artistID": artistID,
    "topTrack": null
  });
};

SPManager.prototype.handleAllGetTopTracks = function(results) {
	this.eventEmitter.emit("artistsDone", results);
}

SPManager.prototype.handleError = function(error, deferred) {
  console.log("Error: " + error);
  deferred.reject();
};

module.exports = SPManager;

