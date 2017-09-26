var updateText;
var lastCheckTime = 0;
var statusMsg = "Awaiting sync...";

window.onLoad = jQuery.get("/update.txt", function(data, status) { //init
	updateText = data;
	assignSplit();
	resizeContent();

	setInterval(function() {
		document.getElementById("status").innerHTML = "Counting down until sync.";
		if (lastCheckTime == 60){ //reset the check loop
			updateInfo(); //refresh
			lastCheckTime = 0;
		}
		lastCheckTime ++;
	}, 1000);
});

function updateInfo() {
	jQuery.get("./update.txt", function(data, status) {
		if(data == updateText) {
			document.getElementById("status").innerHTML = "No update found.";
		} //no update
		else { //yes update
			statusMsg = "Update!";
			assignSplit();
			notify(updateText.split("\n")[2]);
		}
		updateText = data;
	});
}

function assignSplit() {
	document.getElementById("time").innerHTML = "Update time: " + updateText.split("\n")[0];
	document.getElementById("title").innerHTML = "Update title : " + updateText.split("\n")[1];
	document.getElementById("status").innerHTML = statusMsg;
	document.getElementById("background").src = updateText.split("\n")[2];
}

function notify(image) {
	if (!Notification) {
		alert("Prague Race updated!");
		return;
	}

	if (Notification.permission !== "granted"){ //if you didn't get permission
		Notification.requestPermission();
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

		setTimeout(function() {
			notification.close();

		}, 60000);
	}
}

function resizeContent() {
	var img = document.getElementById("background");
	var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

	if((img.clientHeight / img.clientWidth) > (windowHeight / windowWidth)) { //image is taller than the window
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

	var cent = document.getElementById("centered");
	cent.style.fontSize = "0.95em";
	var divHeight = cent.clientHeight;
	var divWidth = cent.clientWidth;
	cent.style.top = (windowHeight - divHeight) / 2 + "px";
	cent.style.left = (windowWidth - divWidth) / 2 + "px";
}