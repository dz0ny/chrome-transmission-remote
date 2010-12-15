var infoReader;
(function () {
    var dropbox = document.getElementById("dropbox");
    dropbox.addEventListener("dragenter", discard, false);
    dropbox.addEventListener("dragover", discard, false);
    dropbox.addEventListener("drop", drop, false);
    window.onUnload = function () {
    	chrome.browserAction.setBadgeText({
            text: ''
        });
    }
    document.getElementById('dropbox').addEventListener('click',function (ev) {
		document.getElementById('Hfile').click();
	},false);
})();

function discard(e) {
    e.stopPropagation();
    e.preventDefault();
}

function drop(e) {
    e.stopPropagation();
    e.preventDefault();
    var files = e.dataTransfer.files;
    if (files.length > 5) {
    	alert("Select no more than 5 files!")
    }else{
	    for (var i = 0; i < files.length; i++) {
	        var file = files[i];
	
	        if (!file.type.match(/application\/x-bittorrent/)) {
	            continue;
	        }
	        if (file.fileSize > 200000) {
	            alert("File too large! Are you sure it's torrent?")
	            continue;
	        };
	        addTorrent(file);
	    }  
	}
}