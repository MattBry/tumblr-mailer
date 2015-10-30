var fs = require('fs');
var ejs = require('ejs');
var tumblr = require('tumblr.js');
var client = tumblr.createClient({
  consumer_key: 'mwAONJj1JtVjDHU8kZU2BzxtgcuKuAcGQxN4kpol9DXUX3IcwJ',
  consumer_secret: 'mmfdBArY238qzc0kINVSkhB29rkmThHm50trLWs0OCanK3rruJ',
  token: 'G71pWchD7KymhTQCjzmWKV5Dsc3ZGUvJCYp4fAevdKbbH75TS6',
  token_secret: 'SFXJ2lq31m2WXs6AX9WKS7FCJEcU4LjXKfNapGOFz0J1ZNoWhc'
});
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('7cOM623HtMXrCFVo489UTw');

var csvFile = fs.readFileSync("friend_list.csv", "utf8");
var emailTemp = fs.readFileSync('email_template.ejs', 'utf-8');

function csvParse (csv) {
	var csv_data = [];
	var lineArray = csv.split("\n");
	var keys = lineArray[0].split(",");
	var lineArrayValues = lineArray.slice(1);
	i = 0;
	while (i < lineArrayValues.length) {
		j = 0;
		obj = {};
		individualValues = lineArrayValues[i].split(",");
		while (j < individualValues.length) {
			obj[keys[j]] = individualValues[j];
			j += 1;
		}
		csv_data.push(obj);
		i += 1;
	}
	return csv_data;
}

var friendsList = csvParse(csvFile);

function emailSender(template, contacts, latest){
	var i = 0;
		while (i < contacts.length) {
			var contact = contacts[i];
			var firstName = contact.firstName;
			var numMonthsSinceContact = contact.numMonthsSinceContact;
			var customizedTemplate = ejs.render(template, {
				firstName: firstName,
				numMonthsSinceContact: numMonthsSinceContact,
				latestPosts: latest
			});
			sendEmail(contact.firstName, contact.emailAddress, "Matt Bryan", "mpbryan90@gmail.com", "snazzy robot", customizedTemplate);
			i += 1;
		}
}
client.posts('animatinglimits.tumblr.com', function(err, blog){
	var latestPosts = findLatest(blog.posts);
	emailSender(emailTemp, friendsList, latestPosts);
  });
function findLatest(posts){
	i = 0;
	freshPosts = [];
	while (i < posts.length) {
	//screw parsing date strings; 604800 s === 7 days
		if (Math.round(Date.now()/1000) - posts[i].timestamp < 604800) {
			freshPosts.push({
				"title": posts[i].title,
				"url": posts[i].post_url
			});
		}
		i += 1;
	}
	return freshPosts;
}

function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,    
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]    
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        // console.log(message);
        // console.log(result);   
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
 }
