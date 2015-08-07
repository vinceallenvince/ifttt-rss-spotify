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
  this.artistNameLookup = {};
}

/*SPManager.prototype.parseArtistNamesFromEventTitles = function(eventTitles) {
	
  var l = eventTitles.length;
  var artistNames = [];
  for (var i = 0; i < l; i++) {
    var parsedName = this._parseArtistName(this.titleFilter, eventTitles[i].title);
    if (!this.artistNameLookup[parsedName] && parsedName.search("(CANCELLED)") == -1) {
      this.artistNameLookup[parsedName] = true;
      artistNames.push(parsedName);
    }
  }

  this.eventEmitter.emit("artistNamesParsed", artistNames);
};*/

SPManager.prototype.parseArtistNamesDatesFromEventTitles = function(eventTitles) {
  
  var l = eventTitles.length;
  var eventList = [];
  for (var i = 0; i < l; i++) {
    var parsedName = this._parseArtistName(this.titleFilter, eventTitles[i].title);
    var parsedDate = this._parseDateFromEventTitle(eventTitles[i].title);
    if (!this.artistNameLookup[parsedName] && parsedName.search("(CANCELLED)") == -1) {
      this.artistNameLookup[parsedName] = true;
      eventList.push({
        "name": parsedName,
        "date": parsedDate
      });
    }
  }

  this.eventEmitter.emit("artistNamesDatesParsed", eventList);
};

SPManager.prototype._parseArtistName = function(titleFilter, eventTitle) {

  var venueExp = new RegExp(titleFilter, "i");
  var withExp = new RegExp("\\with[^)]*\\w", "i");
  var commaExp = new RegExp("\\,[^)]*\\w", "i");

  return eventTitle.replace(venueExp, "").replace(withExp, "").replace(commaExp, "").replace("&", "and").trim();
};

SPManager.prototype._parseDateFromEventTitle = function(eventTitle) {
  var dateExp = new RegExp("\\([^)]*\\)", "i");
  return eventTitle.match(dateExp)[0].replace("(", "").replace(")", "").trim();
};

SPManager.prototype.getArtistIDs = function(eventList) {
  var promises = [];
  var l = eventList.length;
  for (var i = 0; i < l; i++) {
    promises.push(this._getArtistID(eventList[i]));
  }

  var allPromises = Q.all(promises);
  allPromises.
    then(this.handleAllGetArtistIDs.bind(this));
};

SPManager.prototype._getArtistID = function(event) {
	var deferred = Q.defer();
  request(encodeURI("https://api.spotify.com/v1/search?type=artist&q=" + event.name), this._handleGetArtistID.bind(this, deferred, event));
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

SPManager.prototype._handleGetArtistID = function(deferred, event, error, response, body) {

  // TODO: Spotify api may not resolve artistIDs for artist names w special characters

  if (error || response.statusCode != 200) {
    this._nullifyArtist(deferred);
    return;
  }

  var resultsArtist = JSON.parse(body);
  
  if (resultsArtist.artists.total) {
    deferred.resolve({
      "artistName": event.name,
      "artistID": this._selectArtistID(event.name, resultsArtist),
      "eventDate": event.date
    });
  } else if (event.name.search(" and ") != -1) { // check the name is not a combination of artist names; is there an "and " in the artistName
      var andExp = new RegExp("\\and[^)]*\\w", "i");
      var altName = event.name.replace(andExp, "").trim();
      request(encodeURI("https://api.spotify.com/v1/search?type=artist&q=" + altName), this._handleGetArtistID.bind(this, deferred, {name: altName, date: event.date}));
  } else { // Spotify API did not return an artist
    this._nullifyArtist(deferred);
  }
  
};

SPManager.prototype.handleAllGetArtistIDs = function(results) {

  var promises = []; 
  
  var l = results.length;
  for (var i = 0; i < l; i++) {
    if (results[i].artistID && results[i].artistName) {
      promises.push(this.getTopTrack(results[i]));
    }
  }

  var allPromises = Q.all(promises);
  allPromises.
    then(this.handleAllGetTopTracks.bind(this)); 
}

SPManager.prototype.getTopTrack = function(event) {
  var deferred = Q.defer();
  request(encodeURI("https://api.spotify.com/v1/artists/" + event.artistID + "/top-tracks?country=US"), this.handleGetTopTrack.bind(this, deferred, event));
  return deferred.promise;
}

SPManager.prototype.handleGetTopTrack = function(deferred, event, error, response, body) {

  if (error || response.statusCode != 200) {
    this.handleError(error, deferred);
    return;
  }

  // TODO: check market availability

  var resultsTrack = JSON.parse(body);

  if (resultsTrack.tracks.length) {
    var topTrack = resultsTrack.tracks[0].name;
    event.artistTopTrack = topTrack;
    deferred.resolve(event);
    return;
  }
  event.artistTopTrack = null;
  deferred.resolve(event);
};

SPManager.prototype.handleAllGetTopTracks = function(results) {
	this.eventEmitter.emit("eventListCreated", results);
}

/**
 * Sorts items by event date ascending.
 */
SPManager.prototype.sortEventListByDate = function(eventList) {
  var sortedList = eventList.sort(function(a, b) {
    return Date.parse(a.eventDate) - Date.parse(b.eventDate);
  });
  this.eventEmitter.emit("eventListSortedByDate", sortedList);
};

SPManager.prototype.handleError = function(error, deferred) {
  console.log("Error: " + error);
  deferred.reject();
};

SPManager.prototype._nullifyArtist = function(deferred) {
  deferred.resolve({
    "artistName": null,
    "artistID": null,
    "eventDate": null,
    "artistTopTrack": null
  });
};

module.exports = SPManager;

