chrome.extension.onRequest.addListener(function (request, sender) {
	console.log(request);
	EJS.Helpers.prototype.file_size = file_size;
	EJS.Helpers.prototype.gen_path = gen_path;
	var total_size = 0;
	if (request.torrent.info.files) {
		//multiple files
		for(var i=0; i<request.torrent.info.files.length; i++) {
			total_size += Number(request.torrent.info.files[i].length);
		}
		request.torrent.info.total_size = file_size(total_size);
	}else{
		//single file
		request.torrent.info.total_size = file_size(request.torrent.info.length);
		request.torrent.info.files = [{"length" : request.torrent.info.length, "path":[request.torrent.info.name] }]
	}
	
	document.title = request.torrent.info.name + " - Adding torrent";
	document.getElementById('holder').innerHTML = new EJS({url: 'template/confirm.ejs'}).render(request.torrent);
	document.getElementById('confirm').addEventListener('click',function (ev) {
		uploadTorrent(request.data, function (response) {
			window.close();
		});
	},false);
	document.getElementById('cancel').addEventListener('click',function (ev) {
		window.close();
	},false);
})
function file_size (bytes) {
	var s = ['bytes', 'kb', 'MB', 'GB', 'TB', 'PB'];
	var e = Math.floor(Math.log(bytes)/Math.log(1024));
	return (Number(bytes)/Math.pow(1024, Math.floor(e))).toFixed(2)+" "+s[e];
}

function gen_path (path) {
	var pth = "";
	for (var i=0; i < path.length; i++) {
		pth += "/"+path[i];
	};
	return pth;
}

window.addEventListener('resize',function () {
var ul = document.getElementById('files');
	if (ul != null) {
		ul.style.cssText ="height: "+(window.innerHeight - 215)+"px;";
	};
},false);