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

var fm = new FeedManager(emitter, feedUrl, cachedItems);
fm.requestFeed();

var spm = new SPManager(emitter, "https://api.spotify.com/v1/search?type=artist&q=", "https://api.spotify.com/v1/artists/", titleFilter);
var em = new EmailManager(emitter, config.email_addr, config.email_pwd, config.email_addr, config.email_recipe, emailHashTag);


emitter.addListener("feedEnd", function() {

  str = JSON.stringify(fm.cachedItems);

  fs.writeFile(CACHED_ITEMS_FILENAME, str, function(error) {
    if (error) throw error;
  });
  spm.parseArtistNamesDatesFromEventTitles(fm.eventTitles);
});

emitter.addListener("artistNamesDatesParsed", function(eventList) {
  spm.getArtistIDs(eventList);
});

emitter.addListener("eventListCreated", function(eventList) {
  spm.sortEventListByDate(eventList);
});

emitter.addListener("eventListSortedByDate", function(eventList) {
  em.emailItems(eventList);
});
