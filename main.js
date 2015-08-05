var config = require('./config').config;
var args = process.argv;

var path = require('path');
var appDir = path.dirname(require.main.filename);
var FeedParser = require("feedparser");  
var request = require("request");
var fs = require("fs");
var nodemailer = require('nodemailer');
var Q = require('q');

//

var FeedManager = require('./src/feedmanager');
var SPManager = require('./src/spmanager');
var EmailManager = require('./src/emailmanager');

// Check if we have cached items.
var CACHED_ITEMS_FILENAME = appDir + "/items.txt";
var cachedItems;
try {
  cachedItems = JSON.parse(fs.readFileSync(CACHED_ITEMS_FILENAME, "utf8"));
} catch(error) {
  cachedItems = {};
}

// Holds artist names
var artistNames = [];

// TODO: check args length; return if entries missing

// RSS feed url
var feedUrl = args.length > 2 ? args[2] : "";

// Use to filter items based on title.
var titleFilter = args.length > 3 ? args[3] : "";

// Use for hashtag in email subject line
var emailHashTag = args.length > 4 ? args[4] : "";

//

var eventEmitter = require('events').EventEmitter;
var emitter = new eventEmitter();

var fm = new FeedManager(emitter, feedUrl);
fm.requestFeed();

var spm = new SPManager(emitter, "https://api.spotify.com/v1/search?type=artist&q=", "https://api.spotify.com/v1/artists/");
var em = new EmailManager(emitter, config.email_addr, config.email_pwd, config.email_addr, config.email_recipe, emailHashTag);



emitter.addListener("feedItem", function(item) {

  var exp = new RegExp(titleFilter, "i");

  if (!cachedItems[item.title] && item.title.search(exp) != -1) {
    cachedItems[item.title] = "true";
    var artistName = item.title.replace(exp, "").trim();
    artistNames.push(artistName);
  }
});

emitter.addListener("feedEnd", function(item) {
  str = JSON.stringify(cachedItems);

  fs.writeFile(CACHED_ITEMS_FILENAME, str, function(error) {
    if (error) throw error;
  });

  // Feed is parsed. Get Spotify artist ids for each artist name.
  spm.verifyArtists(artistNames);

});

emitter.addListener("artistsDone", function(results) {
  em.emailItems(results);
});





/*
// Holds artist names
var artistNames = [];

// Check if we have cached items.
var CACHED_ITEMS_FILENAME = appDir + "/items.txt";
var cachedItems;
try {
  cachedItems = JSON.parse(fs.readFileSync(CACHED_ITEMS_FILENAME, "utf8"));
} catch(error) {
  cachedItems = {};
}

// Request the feed.
request(feedUrl)
    .on("error", onError)
    .pipe(new FeedParser())
    .on("error", onError)
    .on("readable", function() {
      var stream = this, item;
      while (item = stream.read()) {
        handleItem(item);
      }
    })
    .on("end", handleFeedEnd);

function onError(error) {
  throw error;
}

function handleItem(item) {
	if (!cachedItems[item.title] && item.title.search(titleFilter) != -1) {
		
    cachedItems[item.title] = "true";
    
    var exp = new RegExp(titleFilter, "i");
    var artistName = item.title.replace(exp, "").trim();
    artistNames.push(artistName);
	}
}

function getArtistID(artistName) {

    var deferred = Q.defer();

    request("https://api.spotify.com/v1/search?q=" + artistName + "&type=artist", function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var resultsArtist = JSON.parse(body);
        if (resultsArtist.artists.total) {
          var artistID = resultsArtist.artists.items[0].id;
          deferred.resolve({
            "artistName": artistName,
            "artistID": artistID
          });
        } else {
          deferred.resolve("");
        } 
      }
    });

    return deferred.promise;
}

function handleGetArtistIDs(results) {
  var promises = []; 
  var l = results.length;
  for (var i = 0; i < l; i++) {
    if (results[i]) {
      promises.push(getTopTrack(results[i].artistID, results[i].artistName));
    }
  }
  var allPromises = Q.all(promises);
  allPromises.
    then(handleGetTopTracks); 

}

function getTopTrack(artistID, artistName) {
    var deferred = Q.defer();

          request("https://api.spotify.com/v1/artists/" + artistID + "/top-tracks?country=US", function (error, response, body) {
            if (!error && response.statusCode == 200) {
              var resultsTrack = JSON.parse(body);
              if (resultsTrack.tracks.length) {
                var topTrack = resultsTrack.tracks[0].name;
                console.log(topTrack);
                deferred.resolve({
                  "artistName": artistName,
                  "artistID": artistID,
                  "topTrack": topTrack
                });
              } else {
                deferred.resolve("");
              }
            }
          });

    return deferred.promise;
}

function handleGetTopTracks(results) {

  var l = results.length;
  for (var i = 0; i < l; i++) {
    if (results[i]) {
      console.log(results[i]);
    }
  } 
  emailItems(results);
}

function handleFeedEnd() {
  
  str = JSON.stringify(cachedItems);

  fs.writeFile(CACHED_ITEMS_FILENAME, str, function(error) {
    if (error) throw error;
  });

  var promises = [];
  var l = artistNames.length;
  for (var i = 0; i < l; i++) {
    promises.push(getArtistID(artistNames[i]));
  }

  var allPromises = Q.all(promises);
  allPromises.
    then(handleGetArtistIDs);
  
}

function emailItems(items) {

  var transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: config.email_addr,
        pass: config.email_pwd
    }
  });
  
  for (var i = 0; i < items.length; i++) {
    var mailOptions = {
      from: config.email_addr, // sender address 
      to: config.email_recipe, // list of receivers 
      subject: emailHashTag, // Subject line 
      text: items[i].topTrack, // plaintext body
      html: items[i].artistName 
    }

    transporter.sendMail(mailOptions, function(error, info) {
      if (error){
        return console.log(error);
      }
      console.log('Message sent: ' + info.response);
    });

  }

}*/

