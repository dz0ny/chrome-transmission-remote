chrome.extension.onRequest.addListener(function (request, sender) {
	console.log(request, sender);
	document.title = request.torrent.info.name + " - Adding torrent";
})