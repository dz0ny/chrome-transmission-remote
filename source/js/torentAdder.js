function downloadTorrent (url) {
	var torrent = new XMLHttpRequest();
	torrent.open('GET', url, true);
	torrent.overrideMimeType('text/plain; charset=x-user-defined');
	torrent.responseType = "arraybuffer";
	torrent.onload = function(ev) {
	    var blob = new BlobBuilder();
	    blob.append(torrent.response);
		addTorrent(blob.getBlob());
	};
	torrent.send(null);
}

function parseTorrent (file, callback) {
	infoReader = new FileReader();
	infoReader.onload = function (ev) {
		var delo = new Worker('js/bencode.js');
		delo.onmessage = function(event) {  
			callback(event.data);
		}; 
		delo.postMessage(infoReader.result); 
	}
	infoReader.readAsBinaryString(file);
}
function addTorrent (file) {
	parseTorrent(file, function (torrent) {
		if (torrent != null) {
			chrome.windows.create({width:640, height:480, type:"popup", url:"confirm.html"}, function (pWindow) {
				encodeTorrent(file, function (data) {
					chrome.tabs.sendRequest(pWindow.tabs[0].id, {"torrent": torrent, "data": data});
				})
			})
		}else{
			alert("This file isn't torrent!")
		}
	})
}	
function uploadTorrent (data, callback) {
	var method = 'torrent-add';
	var xhr = new XMLHttpRequest();
	xhr.open('POST', localStorage.server + '/rpc', true, localStorage.user, localStorage.pass);
	xhr.setRequestHeader('X-Transmission-Session-Id', localStorage.sessionId);
	xhr.send('{ "arguments": { "metainfo": "' + data + '" }, "method": "' + method + '" }');
	xhr.onreadystatechange = function () {
	    if (xhr.readyState === 4) {
	        if (xhr.getResponseHeader('X-Transmission-Session-Id')) { // re-request with the correct session id
	            localStorage.sessionId = xhr.getResponseHeader('X-Transmission-Session-Id');
	        }
	        var responseJSON = JSON.parse(xhr.responseText);
	        if (method === 'torrent-add') {
	        	callback(responseJSON.result);
	            switch (responseJSON.result) {
	            case 'success':
	                showBadge('add', [0, 255, 0, 255], 5000);
	                break;
	            case 'duplicate torrent':
	                showBadge('dup', [0, 0, 255, 255], 5000);
	                break;
	            default:
	                showBadge('fail', [255, 0, 0, 255], 5000);
	                alert('Torrent download failed!\n\n' + responseJSON.result);
	            }
	        }
	    }
	};

}
function encodeTorrent (file, callback) {
	var reader = new FileReader();
	reader.onload = function (ev) {
	    var data = reader.result.replace("data:application/x-bittorrent;base64,", "").replace("data:base64,", "");
	    callback(data);
	}
	reader.readAsDataURL(file);
}

function showBadge(text, color, duration) {
    chrome.browserAction.setBadgeBackgroundColor({
        color: color
    });
    chrome.browserAction.setBadgeText({
        text: text
    });

    setTimeout(function () {
        chrome.browserAction.setBadgeText({
            text: ''
        });
    }, duration);
}