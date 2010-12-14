// global variables
var torrents = [],		// array of displayed torrents
	refresh;		// variable that holds refreshPopup() timeout

// search for an id in the torrents array
// returns: index or -1
Array.prototype.getTorrentById = function(id) {
	for (var i = this.length - 1; i >= 0; i--) {

		if (this[i].id === id) return i;
	}

	return -1;
};

// credit to: http://web.elctech.com/2009/01/06/convert-filesize-bytes-to-readable-string-in-javascript/
// modified to allow for 0 bytes and removed extraneous Math.floor
function formatBytes(bytes) {
	if (bytes < 1) return '0 bytes';

	var s = [ 'bytes', 'KB', 'MB', 'GB', 'TB', 'PB' ],
		e = Math.floor(Math.log(bytes) / Math.log(1024));

	if (e > 2) return (bytes / Math.pow(1024, e)).toFixed(2) + ' ' + s[e];

	return (bytes / Math.pow(1024, e)).toFixed(1) + ' ' + s[e];
}

// display seconds in a human readable format
function formatSeconds(seconds) {
	if (seconds < 1) return 'unknown time';

	var units = [ { seconds: 86400, label: 'days' }, { seconds: 3600, label: 'hr' }, { seconds: 60, label: 'min' }, { seconds: 1, label: 'seconds' } ],
		tmp, time;

	// loop through units and display a max of two consecutive units
	for (var i = 0, unit; unit = units[i]; ++i) {
		if (seconds > unit.seconds) {
			tmp = Math.floor(seconds / unit.seconds);
			time = tmp + ' ' + unit.label;
			seconds -= unit.seconds * tmp;

			if (i < (units.length - 1)) {
				tmp = Math.floor(seconds / units[i + 1].seconds);

				if (tmp > 0) time += ' ' + tmp + ' ' + units[i + 1].label;
			}

			return time;
		}
	}
}

// update the global stats
function updateStats(uTorrents) {
	var stats = [0, 0, 0],
		totalDownload = 0,
		totalUpload = 0,
		globalTorrents = document.getElementById('global_torrents'),
		globalDownloading = document.getElementById('global_downloading'),
		globalSeeding = document.getElementById('global_seeding'),
		globalPausedCompleted = document.getElementById('global_pausedcompleted'),
		globalDownload = document.getElementById('global_downloadrate'),
		globalUpload = document.getElementById('global_uploadrate');

	// count how many of each status
	for (var i = 0, torrent; torrent = torrents[i]; ++i) {
		switch(torrent.status)
		{
		case 1: case 2: case 4:
			stats[0]++;
			break;
		case 8:
			stats[1]++;
			break;
		case 16:
			stats[2]++;
			break;
		}
	}

	// get the global speeds
	for (var i = 0, uTorrent; uTorrent = uTorrents[i]; ++i) {
		totalDownload += uTorrent.rateDownload;
		totalUpload += uTorrent.rateUpload;
	}

	// update the global status
	globalTorrents.replaceChild(document.createTextNode(torrents.length), globalTorrents.childNodes[0]);
	globalDownloading.replaceChild(document.createTextNode(stats[0]), globalDownloading.childNodes[0]);
	globalSeeding.replaceChild(document.createTextNode(stats[1]), globalSeeding.childNodes[0]);
	globalPausedCompleted.replaceChild(document.createTextNode(stats[2]), globalPausedCompleted.childNodes[0]);
	globalDownload.replaceChild(document.createTextNode(formatBytes(totalDownload)), globalDownload.childNodes[0]);
	globalUpload.replaceChild(document.createTextNode(formatBytes(totalUpload)), globalUpload.childNodes[0]);
}

// set the visibility of the no torrents status message
function setStatusVisibility() {
	if (document.getElementById('list').hasChildNodes()) {
		document.getElementById('status').style.display = 'none';
	} else {
		document.getElementById('status').style.display = 'block';
	}
}

var port = chrome.extension.connect({ name: 'popup' });
port.onMessage.addListener(function(msg) {
	switch(msg.tag)
	{
	case 1:		// baseline
		var uTorrents = msg.args.torrents.sort(function(a, b) { return b.addedDate - a.addedDate; });

		// add the torrent to the torrents array and set whether it's visible or not
		for (var i = 0, uTorrent; uTorrent = uTorrents[i]; ++i) {
			torrents[torrents.push(new Torrent()) - 1].createElem(uTorrent);
			torrents[i].filter();
		}

		setStatusVisibility();
		updateStats(uTorrents);

		break;
	case 2:		// update
		var rTorrents = msg.args.removed, uTorrents = msg.args.torrents, torrent;

		// remove torrents
		for (var i = 0, rTorrent; rTorrent = rTorrents[i]; ++i) {
			torrent = torrents.getTorrentById(rTorrent);

			if (torrent > -1) torrents.splice(torrent, 1)[0].removeElem();
		}

		// add/update torrents
		for (var i = 0, uTorrent; uTorrent = uTorrents[i]; ++i) {
			torrent = torrents.getTorrentById(uTorrent.id);

			if (torrent < 0) {		// new
				torrents.unshift(new Torrent());
				torrents[0].createElem(uTorrent);
				torrents[0].filter(0);
			} else {		// existing
				torrents[torrent].updateElem(uTorrent);
			}
		}

		setStatusVisibility();
		updateStats(uTorrents);

		break;
	case 3:		//turtle mode
		if (msg.args['alt-speed-enabled']) document.getElementById('turtle_button').setAttribute('class', 'on');
		else document.getElementById('turtle_button').removeAttribute('class');

		break;
	}
});

// keep refreshing the torrent list
function refreshPopup() {
	port.postMessage({
		args: '"fields": [ "id", "status", "name", "downloadDir", "metadataPercentComplete", "sizeWhenDone", "leftUntilDone", "eta", "rateDownload", "rateUpload", "uploadedEver", "addedDate", "doneDate", "recheckProgress" ], "ids": "recently-active"',
		method: 'torrent-get',
		tag: 2
	});
	port.postMessage({ args: '', method: 'session-get', tag: 3 });		// check for turtle mode

	refresh = setTimeout(refreshPopup, 3000);
}

(function() {
	// persistent torrent type dropdown and filter textbox
	document.getElementById('filter_type').value = localStorage.torrentType;
	if (localStorage.torrentFilter !== '') {
		document.getElementById('filter_input').value = localStorage.torrentFilter;
		document.getElementById('filter_clear').style.display = 'block';
	}

	// initial baseline of torrents, turtle mode, then start the refresh
	port.postMessage({
		args: '"fields": [ "id", "status", "name", "downloadDir", "metadataPercentComplete", "sizeWhenDone", "leftUntilDone", "eta", "rateDownload", "rateUpload", "uploadedEver", "addedDate", "doneDate", "recheckProgress" ]',
		method: 'torrent-get',
		tag: 1
	});
	port.postMessage({ args: '', method: 'session-get', tag: 3 });

	refresh = setTimeout(refreshPopup, 3000);
	document.getElementById('basket').addEventListener('click',function (ev) {
		chrome.windows.create({width:170, height:190, type:"popup", url:"basket.html"})
	},false);
})();
