var SPManager = require('../src/spmanager');
var expect = require('expect');
var sinon = require('sinon');
var request = require("request");

var spManager;

var SOLR_URI = "http://www.someurl.com";
var ARTIST_SEARCH_URL = "https://api.spotify.com/v1/search?type=artist&q=";
var ARTIST_TRACKS_URL = "https://api.spotify.com/v1/artists/";

beforeEach(function() {
	spManager = new SPManager({}, ARTIST_SEARCH_URL, ARTIST_TRACKS_URL);
});

describe('SPManager', function() {

	it("should have required properties.", function () {
		expect(spManager.artistSearchURL).toEqual(ARTIST_SEARCH_URL);
		expect(spManager.artistTracksURL).toEqual(ARTIST_TRACKS_URL);

		var fn = function() {
      	spManager = new SPManager();
    };
    expect(fn).toThrow();

    var fn = function() {
      	spManager = new SPManager(ARTIST_SEARCH_URL);
    };
    expect(fn).toThrow();

    var fn = function() {
      	spManager = new SPManager(null, ARTIST_TRACKS_URL);
    };
    expect(fn).toThrow();
	});

	/*it("should accept optional properties.", function () {
		spManager = new SPManager(WEB_API_URI, SOLR_URI, true);
		expect(spManager.webApiUri).toEqual(WEB_API_URI);
		expect(spManager.solrUri).toEqual(SOLR_URI);
		expect(spManager.useSolr).toEqual(true);
	});

	it("should get an artist uri", function() {
		var fn = function() {
      spManager.getArtistURI();
    };
    expect(fn).toThrow();
	});

	it("should handle getting an artist uri", function() {
		
		// handleGetArtistURI = function(deferred, artistName, ancestorUri, error, response, body) {


		var stubHandleError = sinon.stub(spManager, "handleError");
    spManager.handleGetArtistURI({}, "", "", true);
    expect(stubHandleError.calledOnce).toBe(true);
		sinon.restore(spManager, 'handleError');
		
		var artist;
		var deferred = {resolve: function(results) {artist = results}};

		spManager.handleGetArtistURI(deferred, "Joe Jackson", "", false, {}, '{"response": {"docs": [{"name": "Joe Jackson", "artist_uri": "spotify:artist:6KOqPxwfNAmZPkiCnDE9yT"}]}}');
		expect(artist.name).toEqual("Joe Jackson");
		expect(artist.uri).toEqual("spotify:artist:6KOqPxwfNAmZPkiCnDE9yT");

		artist = false;
		spManager.handleGetArtistURI(deferred, "Joe Jackson", "", false, {}, '{"response": {"docs": []}}');
		expect(artist.name).toEqual("EMPTY");
		expect(artist.uri).toEqual("EMPTY");
	});

	it("should handle errors.", function() {
		var fn = function() {
      spManager.handleError({});
    };
    expect(fn).toThrow();
	});*/

});