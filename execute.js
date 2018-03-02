//a moderation tool for the MSQL DB. allows to query the DB specified for dotenv.
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

require("dotenv").config({path: "../heroku-deploy.env"});

var mysql = require("mysql"); //MySQL API
var con = mysql.createConnection({
	host: process.env.MYSQL_HOST,
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD, //log in
	database: process.env.MYSQL_DATABASE, //USE command
	port: process.env.MYSQL_PORT
});
con.connect(function(err) {
	if(err) { //if an error occured
		errPrint("Could not connect to MySQL!");
		throw err;
	}
});

function querySQL(cmd) {
	var dataPromise = new Promise(function(resolve, reject) {
		con.query(cmd, function(err, result) {
			if(err) throw err;
			resolve(result);
		});
	});
	return dataPromise;
} //end querySQL()

console.log("Starting...");
var cmd = process.argv[2];
console.log("Command:\n" + cmd + "\n\n");
querySQL(cmd).then(function(fromResolve) {
	console.log("Resolved:");
	console.log(fromResolve);
	process.exit();
}).catch(function(fromReject) {
	errPrint("Rejected:");
	console.log(fromReject);
	process.exit();
});