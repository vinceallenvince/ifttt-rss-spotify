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


	it("should handle getting a top track", function() {

		// test error
		var stubHandleError = sinon.stub(spManager, "handleError");
    spManager.handleGetTopTrack({}, "", "", true);
    expect(stubHandleError.calledOnce).toBe(true);
		sinon.restore(spManager, 'handleError');

		// test success
		var artist;
		var deferred = {resolve: function(results) {artist = results}};

		spManager.handleGetTopTrack(deferred, "123abc", "Joe Jackson", false, {statusCode: 200}, '{"tracks": [{"name": "Hello"}]}');
		expect(artist.artistName).toEqual("Joe Jackson");
		expect(artist.artistID).toEqual("123abc");
		expect(artist.topTrack).toEqual("Hello");

		var artist;
		var deferred = {resolve: function(results) {artist = results}};

		spManager.handleGetTopTrack(deferred, "123abc", "Joe Jackson", false, {statusCode: 200}, '{"tracks": []}');
		expect(artist.artistName).toEqual("Joe Jackson");
		expect(artist.artistID).toEqual("123abc");
		expect(artist.topTrack).toEqual(null);

	});

	it("should parse artist names from event titles", function() {

		spManager.titleFilter = "\\at Smoke Jazz & Supper Club \\([^)]*\\)";

		var eventTitles = [
			{title: 'Duane Eubanks at Smoke Jazz & Supper Club (August 12, 2015)'},
			{title: 'Camille Thurman at Smoke Jazz & Supper Club (August 12, 2015)'},
			{title: 'Duane Eubanks at Smoke Jazz & Supper Club (August 13, 2015)'},
			{title: 'Camille Thurman at Smoke Jazz & Supper Club (August 19, 2015)'},
			{title: 'Camille Thurman at Smoke Jazz & Supper Club (August 26, 2015)'},
			{title: 'Sarah Elizabeth Charles with S.E.Charles Quartet at Smoke Jazz & Supper Club (September 16, 2015)'},
			{title: 'Sarah Elizabeth Charles with S.E.Charles Quartet at Smoke Jazz & Supper Club (September 17, 2015)'}
		];

		var expectedResult = ['Duane Eubanks', 'Camille Thurman', 'Sarah Elizabeth Charles'];

		spManager.eventEmitter = {
			"emit": function(eventName, results) {
				expect(results).toEqual(expectedResult);
			}
		};

		spManager.parseArtistNamesFromEventTitles(eventTitles);
	});

	it("should parse artist names", function() {

		var titleFilter = "\\at Pianos \\([^)]*\\)";
		var eventTitle = "Afika Nx with Kwesi K, Jordan Bratton, Gabi Wilson, and 1 more at Pianos (August 5, 2015)";
		var name = spManager._parseArtistName(titleFilter, eventTitle);
		expect(name).toEqual("Afika Nx");

		var titleFilter = "\\at Pianos \\([^)]*\\)";
		var eventTitle = "Jon & the Jones with Jules, Teeth People, Lounge Act, and 1 more at Pianos (August 8, 2015)";
		var name = spManager._parseArtistName(titleFilter, eventTitle);
		expect(name).toEqual("Jon and the Jones");

		var titleFilter = "\\at Music Hall of Williamsburg \\([^)]*\\)";
		var eventTitle = "High On Fire, Pallbearer, Venomous Maximus, and Lucifer at Music Hall of Williamsburg (August 18, 2015)";
		var name = spManager._parseArtistName(titleFilter, eventTitle);
		expect(name).toEqual("High On Fire");

		var titleFilter = "\\at Rockwood Music Hall \\([^)]*\\)";
		var eventTitle = "Lynda DeFuria at Rockwood Music Hall (August 11, 2015)";
		var name = spManager._parseArtistName(titleFilter, eventTitle);
		expect(name).toEqual("Lynda DeFuria");

	});
  
  it("should parse dates from event titles.", function() {

    var eventTitle = "Afika Nx with Kwesi K, Jordan Bratton, Gabi Wilson, and 1 more at Pianos (August 5, 2015)";
    var name = spManager._parseDateFromEventTitle(eventTitle);
    expect(name).toEqual("August 5, 2015");
  });


it("should select artistID from artistResults.", function () {

  var artistResults = {
    artists:
      {
        items: [
          { 
            id: '2H5elA2mJKrHmqkN9GSfkz',
            name: 'Gillian Welch'
          },
          { 
            id: '3uA9RwNUL7HZKroYyVlUuL',
            name: 'Gillian Hills'
          },
          { 
            id: '5Q79DaQrf8UBCoNsy0wjxg',
            name: 'Gillian Keith'
          },
          { 
            id: '7jXoGtR69J2iYCefc58MZX',
            name: 'Twins'
          },
          { 
            id: '0kLfQUXou95AsQKZ0mu7fl',
            name: 'Gillian Gordon'
          },
          { 
            id: '34dOF8IepmvZBCldKuELFw',
            name: 'Gillian Knight'
          },
          { 
            id: '2pbPA75QuFUaWUgl9rxgTK',
            name: 'Gillian'
          }
        ]
      }
  };

  var expectedResult = "2pbPA75QuFUaWUgl9rxgTK";
  var result = spManager._selectArtistID("Gillian", artistResults);
  expect(expectedResult).toEqual(result);

  //

  var artistResults = {
    artists:
      {
        items: [
          { 
            id: '3FX6ZjUpCoJOwsxleWx2ci',
            name: 'Kat Wright'
          },
          { 
            id: '0B99YzQXttG6nvi5GcIoda',
            name: 'Kat Wright & the Indomitable Soul Band'
          }
        ]
      }
  };

  var expectedResult = "0B99YzQXttG6nvi5GcIoda";
  var result = spManager._selectArtistID("Kat Wright & the Indomitable Soul Band", artistResults);
  expect(expectedResult).toEqual(result);
});


it("should nullify an artist.", function() {

  var artist;
  var deferred = {resolve: function(results) {artist = results}};

  spManager._nullifyArtist(deferred);
  expect(artist.artistName).toEqual(null);
  expect(artist.artistID).toEqual(null);
  expect(artist.topTrack).toEqual(null);
});


it("should handle getting an artist id.", function() {

  var artist;
  var artistName = "Kat Wright";
  var deferred = {resolve: function(results) {artist = results}};

  // tests errors

  spManager._handleGetArtistID(deferred, artistName, true, {statusCode: 200}, '{"artists": {}}');
  expect(artist.artistName).toEqual(null);
  expect(artist.artistID).toEqual(null);
  expect(artist.topTrack).toEqual(null);

  spManager._handleGetArtistID(deferred, artistName, false, {statusCode: 300}, '{"artists": {}}');
  expect(artist.artistName).toEqual(null);
  expect(artist.artistID).toEqual(null);
  expect(artist.topTrack).toEqual(null);

  // tests api returning an artist
  var stubSelectArtistID = sinon.stub(spManager, "_selectArtistID", function() {
    return 1;
  });

  var body = {
    "artists": {
      "total": 1,
      "items": [
        {
          "name": "Kat Wright",
          "id": "3FX6ZjUpCoJOwsxleWx2ci"
        }
      ]
    }
  }
  spManager._handleGetArtistID(deferred, artistName, false, {statusCode: 200}, JSON.stringify(body));
  expect(artist.artistName).toEqual("Kat Wright");
  expect(artist.artistID).toEqual(1);
  expect(artist.topTrack).toEqual(null);

  // tests no artists returned
  var body = {
    "artists": {
      "total": 0
    }
  }
  spManager._handleGetArtistID(deferred, artistName, false, {statusCode: 200}, JSON.stringify(body));
  expect(artist.artistName).toEqual(null);
  expect(artist.artistID).toEqual(null);
  expect(artist.topTrack).toEqual(null);

  // TODO: test no artists returned; artist name contains " and "
  
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