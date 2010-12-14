// global variables
var port = chrome.extension.connect({ name: 'inject' }),
	customDLElem, torrentURL,
	searchPattern = /(^magnet:|\.torrent$|torrents\.php\?action=download|\?.*info_hash=|(bt-chat\.com|torrentreactor\.net|vertor\.com|seedpeer\.com|torrentzap\.com|limetorrents\.com|h33t\.com|ahashare\.com|1337x\.org|bitenova\.nl|bibliotik\.org).*download|alivetorrents\.com\/dl\/|newtorrents\.info\/down\.php|mininova\.org\/get|kickasstorrents\.com\/torrents)/i;

// attach clickTorrent as an onclick event on links that are found to be torrents
function findTorrentLinks() {
	var links = document.links;

	for (var i = 0, link; link = links[i]; ++i) {
		if (searchPattern.test(link.href)) {
			link.addEventListener('click', clickTorrent, true);
		}
	}
}

// handle a clicked torrent link
function clickTorrent(event) {
	if (event.altKey || event.ctrlKey || event.shiftKey) return;		// download locally if ALT|CTRL|SHIFT key is held down

	// check with background page if custom download location is enabled
	port.postMessage({ url: event.currentTarget.href, method: 'torrent-add' });

	// stop any further events and the default action of downloading locally
	event.preventDefault();
	event.stopPropagation();
}

// recieve context menu link from background page
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	// check with background page if custom download location is enabled
	port.postMessage({ url: request.url, method: 'torrent-add' });

	sendResponse({});		// clean up request
});

// populate the custom download location dropdown
function populateCustomDLDropdown(dirs, selectElem) {
	var optionElem;

	// clear out the dropdown list
	selectElem.length = 0;

	// add the download locations
	for (var i = 0, dir; dir = dirs[i]; ++i) {
		optionElem = document.createElement('option');
		optionElem.text = dir.label;
		optionElem.value = dir.dir;

		selectElem.add(optionElem, null);
	}
}

// create the custom download location element
function createCustomDLElem() {
	if (typeof customDLElem === 'undefined') {
		customDLElem = document.createElement('div');

		var selectElem = document.createElement('select'), downloadElem = document.createElement('button');

		customDLElem.appendChild(document.createTextNode('Choose download location'));
		customDLElem.appendChild(selectElem);
		customDLElem.appendChild(downloadElem);
		customDLElem.setAttribute('style', '\
			z-index: 2147483647;\
			display: block;\
			-webkit-box-sizing: content-box;\
			float: none;\
			position: fixed;\
			right: 20px;\
			top: -100px;\
			-webkit-transition: top 0.3s;\
			width: 300px;\
			min-width: 300px;\
			border: 0;\
			-webkit-box-shadow: rgba(0, 0, 0, 0.7) 0 3px 6px;\
			padding: 20px;\
			background-color: #eee;\
			line-height: normal;\
			vertical-align: baseline;\
			text-align: left;\
			font-size: small;\
			text-decoration: none;\
			letter-spacing: normal;\
			white-space: normal;\
			word-spacing: normal;\
			font: bold 17px Verdana, Arial, Helvetica, sans-serif;\
			color: #222;\
		');

		selectElem.setAttribute('style', '\
			display: inline;\
			float: none;\
			position: static;\
			width: 212px;\
			min-width: 212px;\
			height: 20px;\
			min-height: 20px;\
			margin: 0;\
			border: 0 none;\
			padding: 1px 0;\
			line-height: normal;\
			vertical-align: baseline;\
			text-align: left;\
			font-size: small;\
			text-decoration: none;\
			letter-spacing: normal;\
			white-space: normal;\
			word-spacing: normal;\
			font: normal 14px Verdana, Arial, Helvetica, sans-serif;\
			color: #222;\
		');

		downloadElem.appendChild(document.createTextNode('Download'));
		downloadElem.setAttribute('style', '\
			display: inline;\
			float: right;\
			position: static;\
			width: 77px;\
			min-width: 77px;\
			height: 20px;\
			min-height: 20px;\
			margin: 0;\
			padding: 0 5px;\
			border: 2px outset #ddd;\
			background: #ddd none;\
			line-height: normal;\
			vertical-align: baseline;\
			text-align: left;\
			font-size: small;\
			text-decoration: none;\
			letter-spacing: normal;\
			white-space: normal;\
			word-spacing: normal;\
			font: normal 14px Verdana, Arial, Helvetica, sans-serif;\
			color: #222;\
		');

		// onclick function to send the torrent (with download location)
		downloadElem.addEventListener('click', function () {
			port.postMessage({ url: torrentURL, dir: selectElem.options[selectElem.selectedIndex].value, method: 'torrent-add' });
			customDLElem.style.top = '-100px';
		}, true);

		document.getElementsByTagName('body')[0].appendChild(customDLElem);
	}
}

// receive message from background page and determine what to do with it
port.onMessage.addListener(function(msg) {
	switch(msg.method)
	{
	case 'customdl':
		populateCustomDLDropdown(msg.dirs, customDLElem.childNodes[1]);
		customDLElem.style.top = 0;
		torrentURL = msg.url;
		break;
	}
});

// find torrent links as they are loaded
findTorrentLinks();
document.addEventListener('load', findTorrentLinks, true);

// create the custom download location element
createCustomDLElem();
