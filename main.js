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

var spm = new SPManager(emitter, "https://api.spotify.com/v1/search?type=artist&q=", "https://api.spotify.com/v1/artists/", titleFilter);
var em = new EmailManager(emitter, config.email_addr, config.email_pwd, config.email_addr, config.email_recipe, emailHashTag);

/*emitter.addListener("feedItem", function(item) {

  var venueExp = new RegExp(titleFilter, "i");
  var withExp = new RegExp("\\with[^)]*\\w", "i");
  var commaExp = new RegExp("\\,[^)]*\\w", "i");

  if (!cachedItems[item.title] && item.title.search(venueExp) != -1) {
    cachedItems[item.title] = "true";
    var artistName = item.title.replace(venueExp, "").replace(withExp, "").replace(commaExp, "").trim();
    artistNames.push(artistName.trim());
  }
});*/

emitter.addListener("feedEnd", function(item) {
  str = JSON.stringify(cachedItems);

  fs.writeFile(CACHED_ITEMS_FILENAME, str, function(error) {
    if (error) throw error;
  });

  spm.parseAritstNamesFromEventTitles(fm.eventTitles);
});

emitter.addListener("artistNamesParsed", function(artistNames) {
  spm.getArtistIDs(artistNames);
});

emitter.addListener("artistsDone", function(results) {
  // Artists are verified. Top tracks fetched. Send IFTTT email for each.
  em.emailItems(results);
});
