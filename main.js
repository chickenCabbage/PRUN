/*
  __      __                            __
 /__)    /__)    /  /    /| )  __  (  //_ 
/    .  / (  .  (__/ .  / |/       |_/ __)

 * Made by Alon Shiboleth and Idan Lerman
 * Prague Race by Petra Nordlund
 * github.com/chickenCabbage/PRUN-V5
 
 */

var colors = require("colors"); //awsome console
function errPrint(text) {
	console.log("\n--------------------");
	console.log(colors.red("ERROR: ") + text);
	console.log("--------------------\n");
} //end errPrint()
function wrnPrint(text) {
	console.log(colors.yellow("WARNING: ") + text);
} //end wrnPrint()

var configPath = "./res/cfg/";
var fs = require("fs"); //file reader

require("dotenv").config({path: "../inf-deploy.env"});

var mysql = require("mysql"); //MySQL API
var con = mysql.createConnection({
	host: process.env.MySQL_HOST,
	user: process.env.MySQL_USER,
	password: process.env.MySQL_PASSWORD, //log in
	database: process.env.MySQL_DATABASE //USE command
});
try {
	con.connect(function(err) {
		if(err) { //if an error occured
			errPrint("Could not connect to MySQL!");
			throw err;
		}
	});
}
catch(err) {
	errPrint("MySQL error on mysql.connect!\n" + err);
}

function querySQL(cmd, data) {
	var dataPromise = new Promise(function(resolve, reject) {
		con.query(cmd, data, function(err, result) {
			if(err) throw err;
			resolve(result);
		});
	});
	return dataPromise;
} //end querySQL()

var nodemailer = require("nodemailer");
function sendMail(recip, subject, content) {
	var mailOptions = {
		from: process.env.EMAIL_USERNAME,
		to: recip,
		subject: subject,
		html: content
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
	});
}//end sendMail()

var MailListener = require("mail-listener2"); //email API
var mailListener = new MailListener({
	username: process.env.EMAIL_USERNAME,
	password: process.env.EMAIL_PASSWORD, //log in
	host: process.env.EMAIL_LISTENER_HOST,
	port: process.env.EMAIL_PORT,
	tls: process.env.EMAIL_TLS,
	mailbox: "INBOX",
	markSeen: false
});
 
mailListener.start(); //start listening 

 mailListener.on("server:connected", function() {
	wrnPrint("Connected to email.");
});
mailListener.on("server:disconnected", function() {
	errPrint("Disconnected from email!");
	mailListener.start(); //reconnect
});
mailListener.on("mail", function(mail, seqno, attributes) {
	var from = []; //for passing data into MySQL
	from[0] = mail.from[0].address; //isolate the email address
	var subject = mail.headers.subject.toLowerCase().trim();
	switch(subject) {
		case "subscribe": //user wants to be added
			var cmd = "SELECT * FROM " + process.env.MySQL_TABLE + " WHERE emails = ?;"; //look for that user...
			querySQL(cmd, from).then(function(fromResolve) {
				if(!fromResolve[0]) { //and if there were no results...
					cmd = "INSERT INTO " + process.env.MySQL_TABLE + " (emails) VALUES (?);"; //...add them
					querySQL(cmd, from).then(function() {
						console.log("Added " + from[0] + ", welcome!");
					}).catch(function(fromReject) { //catch for INSERT
						errPrint("Could not add user " + from[0] + ":\n" + fromReject);
					});
				} //end if(!fromResolve[0])
				else { //if there was a result in the email lookup
					console.log(from[0] + " is already added!");
				}
			}).catch(function(fromReject) { //catch for SELECT
				errPrint("Could not add user because could not query for user! " + from[0] + "\n" +  fromReject);
			});

			mailListener.imap.addFlags(attributes.uid, "\\Seen");
		break; //end case "subscribe"
		case "unsubscribe":
			var cmd = "DELETE FROM " + process.env.MySQL_TABLE + " WHERE emails = ?;";
			querySQL(cmd, from);
			console.log("Removed " + from[0] + ". Check for feedback in unsubscribe emails.");
			mailListener.imap.addFlags(attributes.uid, "\\Seen");
		break; //end case "usubscribe"
		default:
			if(((subject.startsWith("su") || subject.startsWith("uns") || subject.endsWith("be")) && (subject.length > 6 && subject.length < 15)) && subject != "subscribe" && subject != "unsubscribe") {
				sendMail(from[0], "You might have misspelled your email title", fs.readFileSync("./res/titleEmail.html").toString().replace("SUBME", subject));
				mailListener.imap.addFlags(attributes.uid, "\\Seen");
			}
		break;
	} //end switch(mail subject)
}); //end mailListener.on("mail")

var http = require("http");
var port = process.env.PORT;
var forbiddenFiles = []; //no special forbidden files
var landingPage = "./index.html"; //the page you get when you request "/"

http.createServer(function(request, response) { //on every request to the server:
	var filePath = "." + request.url;
	if(filePath == "./") filePath = landingPage; //there isn't actually a file as the directory.
	//so we need to redirect the filepath to the actual landing page.

	if(forbiddenFiles.join().includes(filePath) || filePath.includes(configPath)) {
		serveError(403, "403, file forbidden.", request, response);
	}
	try {
		var content = fs.readFileSync(filePath); //check if the file exists and read it!
		//no error yet? That means the file was found.
		var type = filePath.split(".")[filePath.split(".").length - 1];
		switch(type) {
			//images:
			case "png":
				response.writeHead(200, {"Content-Type": "image/png"});
			break;
			case "jpg":
			case "jpeg":
				response.writeHead(200, {"Content-Type": "image/jpg"});
			break;
			case "gif":
				response.writeHead(200, {"Content-Type": "image/gif"});
			break;
			case "ico":
				response.writeHead(200, {"Content-Type": "image/x-icon"});
			break;

			//scripts or programs
			case "js":
				response.writeHead(200, {"Content-Type": "application/javascript"});
			break;

			//serve as text/format
			default:
				response.writeHead(200, {"Content-Type": "text/" + type});
			break;
		} //end switch(type)
		response.end(content); //serve the requseted file
	} //end try
	catch(error) {
		if(error.code == "ENOENT") { //the file wasn't found
			serveError(404, "404, file not found", request, response);
			console.log("Could not find file " + filePath);
		}
		else {
			serveError(500, "500: " + error.toString().replace("Error: ", ""), request, response);
		}
	} //end catch
}).listen(port); //end http.createServer()
wrnPrint("Listening on port " + port + ".");

function serveError(code, text, request, response) { //internal server error
	try {
		var content = fs.readFileSync("./error.html").toString().replace("ERRBODY", text);
		response.writeHead(code, {"Content-Type": "text/html"});
		response.end(content);
	}
	catch(error2) { //if another error was thrown
		var msg = "A severe error occured.\n" + error2 + "\n\nCaused by " + request.url + "\n\n" + text;
		errPrint(msg);
		response.writeHead(500, {"Content-Type": "text/plain"});
		response.end(msg);
	}
} //end serveError()

function parseCookies(cookies) {
	cookies = {
		email: cookies.split("=")[1].split(";")[0],
		pw: cookies.split("=")[2]
	}
	return cookies;
} //end parseCookies()

function serveText(text, response) {
	try {
		response.writeHead(200, {"Content-Type": "text/plain"});
		response.end(text);
	}
	catch(err) { //if an error was thrown
		errPrint("in serving plaintext: " + err);
		response.writeHead(500, {"Content-Type": "text/plain"});
		response.end("Error: " + err);
	}
} //end serveText()
