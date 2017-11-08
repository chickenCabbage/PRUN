/*
 * FUNCTIONS OF INDEX.JS
 * ---------------------
 * index.js gets update.txt, then loads the info from there into the HTML. It starts looping in intervals of one minute
 * and syncing with the host on each loop. If the "current" data from update.txt and the newly received data don't match
 * that means there's been an update!
 * updateInfo() syncs with the server, assignSplit() assigns the update.txt values into the HTML, and notify()... well,
 * it notifies the users via Chrome notifications. resizeContent() is mainly called from <body onresize="resizeContent()">.
 *
 */

var updateText; //stores update.txt values
var lastCheckTime = 0; //for sync countdown
var statusMsg = "Awaiting sync...";

window.onLoad = jQuery.get("/update.txt", function(data, status) { //initialization
	if (Notification.permission !== "granted"){ //if you don't have permission yet
		Notification.requestPermission(); //request it!
	}
	updateText = data; //init updateText
	updateInfo(); //get the info
	assignSplit(); //assign it
	resizeContent(); //and make sure it looks good

	setInterval(function() { //forever do this every 1000 milisecs
		document.getElementById("status").innerHTML = "Counting down until sync.";
		if (lastCheckTime == 60){ //reset the check loop if it's been a minute
			updateInfo(); //refresh
			lastCheckTime = 0; //zero it out
		}
		lastCheckTime ++; //count up to a minute
	}, 1000); //end setInterval()
}); //end jQuery.get()

function updateInfo() {
	jQuery.get("./update.txt", function(data, status) { //fetch update.txt
		updateText = data;
		if(data == updateText) { //everything is the same
			document.getElementById("status").innerHTML = "No update found."; // :^(
		} //no update
		else { //yes update
			statusMsg = "Update!"; // :^D
			assignSplit(); //re-assign the values
			notify(updateText.split("\n")[2]); //make an obligatory squee of excitment
		}
	});
}

function assignSplit() {
	document.getElementById("time").innerHTML = "Update time: " + updateText.split("\n")[0];
	document.getElementById("title").innerHTML = "Update title : " + updateText.split("\n")[1];
	document.getElementById("status").innerHTML = statusMsg;
	document.getElementById("background").src = updateText.split("\n")[2];
	//pretty self-explanatory, get the HTML values and replace them
}

function notify(image) {
	if (!Notification) {
		alert("Prague Race updated!"); //i said the squee of excitment was obligatory damnit, even if you're too lowtech for it
		return;
	}

	if (Notification.permission !== "granted"){ //if you didn't get permission
		Notification.requestPermission(); //make cute puppy eyes
	}
	else { //if you did though
		var notification = new Notification("Prague Race updated!", {
			icon: image,
			body: "PRUN just noticed an update to Prague Race, you should go check it out!",
		});

		notification.onclick = function() {
			window.open("http://www.praguerace.com/");
			notification.close();      
		};

		setTimeout(function() { //close yourself after 60000 milisecs = a minute
			notification.close();
		}, 60000);
	}
}

function resizeContent() {
	var img = document.getElementById("background");
	var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

	if((img.clientHeight / img.clientWidth) > (windowHeight / windowWidth)) { //if the image is taller than the window
		img.style.width = "100%";
		img.clientHeight = img.clientHeight;

		var rem = Math.round(Math.random() * (img.clientHeight - windowHeight));
		//calculate the difference between the image and the window, and move it randomly between it
		img.style.bottom = -rem + "px";
	}
	else { //image is wider
		img.style.height = "100%";
		img.clientWidth = img.clientWidth;

		var rem = Math.round(Math.random() * (img.clientWidth - windowWidth));
		img.style.left = -rem + "px";
	}
	//I used Math.round() because elements stretched between two pixels look aliased

	var cent = document.getElementById("centered");
	cent.style.fontSize = "0.95em"; //yes this is important and noticable
	var divHeight = cent.clientHeight;
	var divWidth = cent.clientWidth;
	cent.style.top = (windowHeight - divHeight) / 2 + "px";
	cent.style.left = (windowWidth - divWidth) / 2 + "px";
}