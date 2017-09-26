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

require("dotenv").config({path: "../vars.env"});

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
