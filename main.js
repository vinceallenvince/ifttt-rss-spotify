var config = require('./config').config;
var args = process.argv;

var path = require('path');
var appDir = path.dirname(require.main.filename);
var FeedParser = require("feedparser");  
var request = require("request");
var fs = require("fs");
var nodemailer = require('nodemailer');

// RSS feed url
var feedUrl = args.length > 2 ? args[2] : "";

// Use to filter items based on title.
var titleFilter = args.length > 3 ? args[3] : "";

// Use for hashtag in email subject line
var emailHashTag = args.length > 4 ? args[4] : "";

// Holds new items.
var newItems = [];

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
    .on("end", handleEnd);

function onError(error) {
  throw error;
}

function handleItem(item) {
	if (!cachedItems[item.title] && item.title.search(titleFilter) != -1) {
		cachedItems[item.title] = "true";
    newItems.push(item.title.replace(titleFilter, '').trim());
	}
}

function handleEnd() {
  
  str = JSON.stringify(cachedItems);

  fs.writeFile(CACHED_ITEMS_FILENAME, str, function(error) {
    if (error) throw error;
  });
  
  if (newItems.length) {
    emailItems(newItems);
  }
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
      text: items[i] // plaintext body 
    }

    transporter.sendMail(mailOptions, function(error, info) {
      if (error){
        return console.log(error);
      }
      console.log('Message sent: ' + info.response);
    });

  }

}

