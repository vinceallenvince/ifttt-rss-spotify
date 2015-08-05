var FeedParser = require("feedparser");
var request = require("request");

function FeedManager(eventEmitter, feedUrl) {
	if (!feedUrl) new Error();
	this.eventEmitter = eventEmitter;
	this.feedUrl = feedUrl;
}

FeedManager.prototype.requestFeed = function() {

	var eventEmitter = this.eventEmitter;

	var onError = function(error) {console.error(error);};

	var handleFeedEnd = function() {
		eventEmitter.emit("feedEnd");
	};

	request(this.feedUrl)
	    .on("error", onError)
	    .pipe(new FeedParser())
	    .on("error", onError)
	    .on("readable", function() {
	    	var stream = this, item;
				while (item = stream.read()) {
					eventEmitter.emit("feedItem", item);
					// handleItem(item);
				} 
	    })
	    .on("end", handleFeedEnd);
};

module.exports = FeedManager;
