var insp = require("node-metainspector");
var client = new insp("http://praguerace.com/", { //crawling config
	timeout: 9999, //maximal reply time in ms. 9999 ~= 10 seconds
	headers: { //custom headers for the request
		"User-Agent": "prunScraper/update.js" //user agent
	}
});

var intervalTime = 2 * 60 * 1000; //two minutes

var eol = require("os").EOL;

var fs = require("fs"); //for readng the files
var title = fs.readFileSync("./update.txt").toString().split(eol)[1]; //stores the page's title
var configPath = "./res/cfg/";

require("dotenv").config({path: "../vars.env"});

var colors = require("colors"); //for fancy console
function errPrint(text) {
	console.log("\n--------------------");
	console.log(colors.red("ERROR: ") + text);
	console.log("--------------------\n");
} //end errPrint()
function wrnPrint(text) {
	console.log(colors.yellow("WARNING: ") + text);
} //end wrnPrint()

var mysql = require('mysql');
var con = mysql.createConnection({
	host: process.env.MYSQL_HOST,
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,
	database: process.env.MYSQL_DATABASE
});
con.connect(function(err) {
	if(err) { //if an error was thrown
		errPrint("Could not connect to MySQL!");
		throw err;
	}
});

function querySQL(cmd) {
	var dataPromise = new Promise(function(resolve, reject) {
		con.query(cmd, function(err, result) {
			resolve(result);
		});
	});
	return dataPromise;
} //end querySQL()

var nodemailer = require("nodemailer");
function sendMail(recip, title, time) {
	var mailOptions = {
		from: process.env.EMAIL_USERNAME,
		to: recip,
		subject: "Prague Race just updated!",
		html: fs.readFileSync("./res/updateEmail.html").toString().replace("TITLEME", title).replace("TIMEME", time)
	};

	var transporter = nodemailer.createTransport({
		service: process.env.MAILER_SERVICE,
		auth: {
			"user": process.env.EMAIL_USERNAME,
			"pass": process.env.EMAIL_PASSWORD
		}
	});
	transporter.sendMail(mailOptions, function(error, info){
		if(error) errPrint("in mailing!\n" + error);
		else wrnPrint("Email sent.");
	});
}//end sendMail()

function testEmail(email) {
	if(new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/).test(email.replace("%40", "@"))) {
		return true;
	}
	else {
		errPrint("Illegal email!" + email);
		return false;
	}
} //end testEmail()

client.on("fetch", function(){ //when client.fetch() is called
	try {
		title = fs.readFileSync("./update.txt").toString().split(eol)[1]; //read the current data
		if(client.title != title) { //if the title changed - new page!
			title = client.title;

			var time = client.parsedDocument(".cc-publishtime").html() //the div content
			.split("<br>")[0].split("posted ")[1] + " EST"; //remove excess HTML/data
			time = time.toString().replace("pm", "PM");

			fs.writeFile("./update.txt", time + eol + client.title + eol + client.images[0], function(){
				console.log("Updated file.");
			}); //change update.txt
			wrnPrint("UPDATED! on " + time + ": " + client.title); //woo
			console.log("Recoginzed on " + new Date().toString() + eol);

			var cmd = "SELECT * FROM v5;";
			querySQL(cmd).then(function(data) {
				var allEmails = [];
				for(i = 0; i < data.length; i ++) { //for every row in the table
					if(testEmail(data[i].email)) allEmails[i] = data[i].email;
				}
				sendMail(allEmails.toString(), title, time);
			});
		}//end if
	}//end try
	catch(err) {
		errPrint(err);
	}
});

client.on("error", function(err) { //if an error occures
	errPrint(err);
});

console.log("Starting now, " + new Date().toString() + ".");
if(((intervalTime / 1000) / 60) > 1) { //it will return a fraction if it's less than a minute
	console.log("Checking at interval of " + (intervalTime / 1000) + " seconds.\n");
}
else { //otherwise it'll be larger/equal to 1
	console.log("Checking at interval of " + ((intervalTime / 1000) / 60) + " minutes.\n");
}
client.fetch(); //initialization

setInterval(function() { //do this every [intervalTime] miliseconds
  client.fetch();
}, intervalTime);