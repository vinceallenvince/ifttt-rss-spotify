var nodemailer = require('nodemailer');

var EMAIL_DELAY = 5000;

function EmailManager(eventEmitter, user, pass, email_addr, email_recipe, hash_tag) {
	if (!eventEmitter || !user || !pass || !email_addr || !email_recipe || !hash_tag) {
		throw new Error("Error: A new EmailManager requires...");
	}
  this.eventEmitter = eventEmitter;
	this.user = user;
	this.pass = pass;
	this.email_from = email_addr;
	this.email_to = email_recipe;
  this.hash_tag = hash_tag;
}

EmailManager.prototype.emailItems = function(items) {
console.log(items);
  var transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: this.user,
        pass: this.pass
    }
  });
  
  var delay = 0;

  for (var i = 0; i < items.length; i++) {
    if (items[i].topTrack && items[i].artistName) {
      var mailOptions = {
        from: this.email_from, 
        to: this.email_to, 
        subject: this.hash_tag, 
        text: items[i].topTrack,
        html: items[i].artistName 
      }
      delay += EMAIL_DELAY;
      setTimeout(this.sendEmail.bind(this, transporter, mailOptions), delay);
    }
  }
}

EmailManager.prototype.sendEmail = function(transporter, mailOptions) {
  transporter.sendMail(mailOptions, function(error, info) {
      if (error){
        return console.log(error);
      }
      console.log("Message sent: " + mailOptions.html + " | " + mailOptions.text + " " + mailOptions.subject + " " + info.response);
    });
};

module.exports = EmailManager;