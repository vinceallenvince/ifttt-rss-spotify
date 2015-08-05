var EmailManager = require('../src/emailmanager');
var expect = require('expect');
var sinon = require('sinon');
var request = require("request");

var emailManager;

var EMAIL_USER = "vince@vinceallen.com";
var EMAIL_PASS = "applesandoranges";
var EMAIL_ADDR = "vince@vinceallen.com";
var EMAIL_RECIPE = "trigger@recipe.ifttt.com";

beforeEach(function() {
	emailManager = new EmailManager(EMAIL_USER, EMAIL_PASS, EMAIL_ADDR, EMAIL_RECIPE);
});

describe('EmailManager', function() {

	it("should have required properties.", function () {
		expect(emailManager.user).toEqual(EMAIL_USER);
		expect(emailManager.pass).toEqual(EMAIL_PASS);
    expect(emailManager.email_from).toEqual(EMAIL_ADDR);
    expect(emailManager.email_to).toEqual(EMAIL_RECIPE);
    
    var fn = function() {
      	spManager = new SPManager();
    };
    
    expect(fn).toThrow();
	});

  it("should get email items", function() {
    var items = [ { artistName: 'Shirley House',
    artistID: '7kNSDAU61cgZ6cffjdSDPq',
    topTrack: 'Carry on (Remastered)' },
  { artistName: 'Jounce',
    artistID: '0YzfsWC93W3lgsBaniRmSD',
    topTrack: 'Truth Defines' },
  { artistName: 'It Was Romance',
    artistID: '2WFBreO0cLomhmlluLHN9Y',
    topTrack: 'Philadelphia' } ]
    emailManager.emailItems(items);

  });

});