var updateText; //stores update.txt values
var lastCheckTime = 0; //for sync countdown
var statusMsg = "Awaiting sync...";

window.onLoad = jQuery.get("/update.txt", function(data, status) { //initialization
  	console.log("update.txt retrieved");
	if (Notification.permission !== "granted"){ //if you don't have permission yet
		Notification.requestPermission(); //request it!
	}
	updateText = data; //init updateText
	updateInfo(); //get the info
	assignSplit(); //assign it
	resizeContent(); //and make sure it looks good

	setInterval(function() { //forever do this every 1000 milisecs
		document.getElementById("status").innerHTML = "Counting down until sync.";
		updateInfo(); //refresh
    	console.log("looping");
	}, 60000); //end setInterval()
}); //end jQuery.get()

function updateInfo() {
	jQuery.get("./update.txt", function(data, status) { //fetch update.txt
		jQuery.get("prace-notifier.herokuapp.com/ping", function(pdata, pstatus) {
			console.log("Update checker status:" + pstatus);
			console.log("Update checker results: " + pdata + "\n");
			var heroku = "Update checking unknown.";
			if(pstatus == 200) heroku = "Checker online.";
			else heroku = "Checker offline!"; //must be the end of the month
			updateText = data;
			if(data == updateText) document.getElementById("status").innerHTML = "No update found.<br>" + heroku; // :^(
			//everything is the same, no update
			else { //yes update
				statusMsg = "Update!<br>" + heroku; // :^D
				assignSplit(); //re-assign the values
				notify(updateText.split("\n")[2]); //make an obligatory squee of excitment
			}
		});
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
  	console.log("rsing");
	var img = document.getElementById("background");
	var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

	if((img.clientHeight / img.clientWidth) > (windowHeight / windowWidth)) { //if the image is taller than the window
		img.style.width = "100%";
		var rand = Math.random();
		var rem = Math.round(rand * (img.clientHeight - windowHeight));
		//calculate the difference between the image and the window, and move it randomly between it
		img.style.bottom = -rem + "px";
    	img.style.width = "100%";
	}
	else { //image is wider
		img.style.height = "100%";

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