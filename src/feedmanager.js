var FeedParser = require("feedparser");
var request = require("request");

function FeedManager(eventEmitter, feedUrl, cachedItems) {
	if (!feedUrl) new Error();
	this.eventEmitter = eventEmitter;
	this.feedUrl = feedUrl;
	this.cachedItems = cachedItems;
	this.eventTitles = [];
}

FeedManager.prototype.requestFeed = function() {

	var eventEmitter = this.eventEmitter;
	var eventTitles = this.eventTitles;
	var cachedItems = this.cachedItems;

	var onError = function(error) {console.error(error);};

	var handleFeedEnd = function() {
		eventEmitter.emit("feedEnd", eventTitles);
	};
  console.log(this.feedUrl);
	request(this.feedUrl)
	    .on("error", onError)
	    .pipe(new FeedParser())
	    .on("error", onError)
	    .on("readable", function() {
	    	var stream = this, item;
				while (item = stream.read()) {
					if (!cachedItems[item.title]) {
						cachedItems[item.title] = "true";
						eventTitles.push(item);
					}
				} 
	    })
	    .on("end", handleFeedEnd);
};

module.exports = FeedManager;
