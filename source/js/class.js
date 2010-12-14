function Torrent() {
	this.id = 0,
	this.name = '',
	this.status = 0,
	this.elem = document.createElement('li'),

	// send RPC for a torrent
	this.sendRPC = function(method, ctrlDown) {
		clearTimeout(refresh);

		if (method === 'torrent-remove' && ctrlDown) {
			port.postMessage({ args: '"ids": [ ' + this.id + ' ], "delete-local-data": true', method: method });
		} else {
			port.postMessage({ args: '"ids": [ ' + this.id + ' ]', method: method });
		}

		if (method === 'torrent-stop') setTimeout(refreshPopup, 500);
		else refreshPopup();
	}

	// test the torrent name against the current filter and set whether it's visible or not
	this.filter = function(order) {
		var filter = (localStorage.torrentFilter === '') ? '' : new RegExp(localStorage.torrentFilter.replace(/ /g, '[^A-z0-9]*'), 'i'),
			type = localStorage.torrentType,
			listElem = document.getElementById('list'), hiddenListElem = document.getElementById('list_hidden');

		// append to the visible table or the hidden table
		if ((type == 0 || this.status == type) && this.name.search(filter) > -1) {
			listElem.insertBefore(this.elem, listElem.childNodes[order]);
		} else {
			hiddenListElem.appendChild(this.elem);
		}
	}

	// create the list element and update torrent properties
	this.createElem = function(props) {
		if (typeof props.id !== 'undefined') this.id = props.id;
		if (typeof props.name !== 'undefined') this.name = props.name;
		if (typeof props.status !== 'undefined') this.status = props.status;

		var thisTorrent = this,
			percentDone = 100 - (props.leftUntilDone / props.sizeWhenDone * 100),
			nameElem = document.createElement('div'),
			statsElem = document.createElement('div'),
			speedsElem = document.createElement('div'),
			progressElem = document.createElement('div'),
			curProgressElem = document.createElement('div'),
			pauseElem = document.createElement('div'),
			resumeElem = document.createElement('div'),
			removeElem = document.createElement('div');

		this.elem.appendChild(nameElem);
		this.elem.appendChild(statsElem);
		this.elem.appendChild(progressElem);
		this.elem.appendChild(pauseElem);
		this.elem.appendChild(resumeElem);
		this.elem.appendChild(removeElem);

		nameElem.setAttribute('class', 'torrent_name');
		nameElem.setAttribute('title', props.name + '\n\nDownloaded to: ' + props.downloadDir);
		nameElem.appendChild(document.createTextNode(props.name));

		statsElem.appendChild(speedsElem);
		statsElem.setAttribute('class', 'torrent_stats');

		speedsElem.setAttribute('class', 'torrent_speeds');

		progressElem.appendChild(curProgressElem);
		progressElem.setAttribute('class', 'torrent_progress');

		if (percentDone === 100) {
			curProgressElem.setAttribute('class', 'complete');
			curProgressElem.setAttribute('style', 'width: ' + percentDone + '%');
		} else if (percentDone > 0) {
			curProgressElem.setAttribute('class', 'downloading');
			curProgressElem.setAttribute('style', 'width: ' + percentDone + '%');
		} else {
			curProgressElem.setAttribute('style', 'display: none');
		}

		pauseElem.setAttribute('class', 'torrent_button pause');
		pauseElem.setAttribute('title', 'Pause');
		pauseElem.addEventListener('click', function() { thisTorrent.sendRPC('torrent-stop'); }, true);

		resumeElem.setAttribute('class', 'torrent_button resume');
		resumeElem.setAttribute('title', 'Resume');
		resumeElem.addEventListener('click', function() { thisTorrent.sendRPC('torrent-start'); }, true);

		removeElem.setAttribute('name', 'torrent_remove');
		removeElem.setAttribute('class', 'torrent_button remove');
		removeElem.setAttribute('title', 'Double-click to remove torrent\n\nHold down CTRL to also delete data');
		removeElem.addEventListener('dblclick', function() { thisTorrent.sendRPC('torrent-remove', event.ctrlKey); }, true);

		switch(props.status)
		{
		case 1:
			statsElem.appendChild(document.createTextNode(
				formatBytes(props.sizeWhenDone - props.leftUntilDone) + ' of ' + formatBytes(props.sizeWhenDone) +
				' (' + percentDone.toFixed(2) + '%) - waiting to verify local data'
			));
			speedsElem.appendChild(document.createTextNode(''));
			pauseElem.setAttribute('style', 'display: none');
			resumeElem.setAttribute('style', 'display: none');

			break;
		case 2:
			statsElem.appendChild(document.createTextNode(
				formatBytes(props.sizeWhenDone - props.leftUntilDone) + ' of ' + formatBytes(props.sizeWhenDone) +
				' (' + percentDone.toFixed(2) + '%) - verifying local data (' + (props.recheckProgress * 100).toFixed() + '%)'
			));
			speedsElem.appendChild(document.createTextNode(''));
			pauseElem.setAttribute('style', 'display: none');
			resumeElem.setAttribute('style', 'display: none');

			break;
		case 4:
			if (props.metadataPercentComplete < 1) {
				statsElem.appendChild(document.createTextNode('\
					Magnetized transfer - retrieving metadata (' + (props.metadataPercentComplete * 100).toFixed() + '%)'
				));
				speedsElem.appendChild(document.createTextNode(''));
				progressElem.setAttribute('class', 'torrent_progress magnetizing');
			} else {
				statsElem.appendChild(document.createTextNode(
					formatBytes(props.sizeWhenDone - props.leftUntilDone) + ' of ' + formatBytes(props.sizeWhenDone) +
					' (' + percentDone.toFixed(2) + '%) - ' + formatSeconds(props.eta) + ' remaining'
				));
				speedsElem.appendChild(document.createTextNode('\
					DL: ' + formatBytes(props.rateDownload) + '/s\
					UL: ' + formatBytes(props.rateUpload) + '/s'
				));
			}
			pauseElem.setAttribute('style', 'display: block');
			resumeElem.setAttribute('style', 'display: none');

			break;
		case 8:
			statsElem.appendChild(document.createTextNode(
				formatBytes(props.sizeWhenDone) +
				' - Seeding, uploaded ' + formatBytes(props.uploadedEver) + ' (Ratio ' + (props.uploadedEver / props.sizeWhenDone).toFixed(2) + ')'
			));
			speedsElem.appendChild(document.createTextNode('UL: ' + formatBytes(props.rateUpload) + '/s'));
			curProgressElem.setAttribute('class', 'seeding');
			pauseElem.setAttribute('style', 'display: block');
			resumeElem.setAttribute('style', 'display: none');

			break;
		case 16:
			if (props.leftUntilDone) {
				statsElem.appendChild(document.createTextNode(
					formatBytes(props.sizeWhenDone - props.leftUntilDone) + ' of ' + formatBytes(props.sizeWhenDone) +
					' (' + percentDone.toFixed(2) + '%) - Paused'
				));
				curProgressElem.setAttribute('class', 'paused');
			} else {
				if (props.doneDate > 0) {
					statsElem.appendChild(document.createTextNode(
						formatBytes(props.sizeWhenDone) +
						' - Completed on ' + new Date(props.doneDate * 1000).toLocaleDateString()
					));
				} else {
					statsElem.appendChild(document.createTextNode(
						formatBytes(props.sizeWhenDone) +
						' - Completed on ' + new Date(props.addedDate * 1000).toLocaleDateString()
					));
				}
			}
			speedsElem.appendChild(document.createTextNode(''));
			pauseElem.setAttribute('style', 'display: none');
			resumeElem.setAttribute('style', 'display: block');

			break;
		}
	}

	// update the list element and update torrent properties
	this.updateElem = function(props) {
		if (typeof props.status !== 'undefined') this.status = props.status;

		var percentDone = 100 - (props.leftUntilDone / props.sizeWhenDone * 100),
			nameElem = this.elem.childNodes[0],
			statsElem = this.elem.childNodes[1],
			speedsElem = statsElem.childNodes[0],
			progressElem = this.elem.childNodes[2],
			curProgressElem = progressElem.childNodes[0],
			pauseElem = this.elem.childNodes[3],
			resumeElem = this.elem.childNodes[4];

		nameElem.setAttribute('title', props.name + '\n\nDownloaded to: ' + props.downloadDir);

		progressElem.setAttribute('class', 'torrent_progress');

		if (percentDone === 100) {
			curProgressElem.setAttribute('class', 'complete');
			curProgressElem.setAttribute('style', 'width: ' + percentDone + '%');
		} else if (percentDone > 0) {
			curProgressElem.setAttribute('class', 'downloading');
			curProgressElem.setAttribute('style', 'width: ' + percentDone + '%');
		} else {
			curProgressElem.setAttribute('style', 'display: none');
		}

		switch(props.status)
		{
		case 1:
			statsElem.replaceChild(document.createTextNode(
				formatBytes(props.sizeWhenDone - props.leftUntilDone) + ' of ' + formatBytes(props.sizeWhenDone) +
				' (' + percentDone.toFixed(2) + '%) - waiting to verify local data'
			), statsElem.childNodes[1]);
			speedsElem.replaceChild(document.createTextNode(''), speedsElem.childNodes[0]);
			pauseElem.setAttribute('style', 'display: none');
			resumeElem.setAttribute('style', 'display: none');

			break;
		case 2:
			statsElem.replaceChild(document.createTextNode(
				formatBytes(props.sizeWhenDone - props.leftUntilDone) + ' of ' + formatBytes(props.sizeWhenDone) +
				' (' + percentDone.toFixed(2) + '%) - verifying local data (' + (props.recheckProgress * 100).toFixed() + '%)'
			), statsElem.childNodes[1]);
			speedsElem.replaceChild(document.createTextNode(''), speedsElem.childNodes[0]);
			pauseElem.setAttribute('style', 'display: none');
			resumeElem.setAttribute('style', 'display: none');

			break;
		case 4:
			if (props.metadataPercentComplete < 1) {
				statsElem.replaceChild(document.createTextNode('\
					Magnetized transfer - retrieving metadata (' + (props.metadataPercentComplete * 100).toFixed() + '%)'
				), statsElem.childNodes[1]);
				speedsElem.replaceChild(document.createTextNode(''), speedsElem.childNodes[0]);
				progressElem.setAttribute('class', 'torrent_progress magnetizing');
			} else {
				statsElem.replaceChild(document.createTextNode(
					formatBytes(props.sizeWhenDone - props.leftUntilDone) + ' of ' + formatBytes(props.sizeWhenDone) +
					' (' + percentDone.toFixed(2) + '%) - ' + formatSeconds(props.eta) + ' remaining'
				), statsElem.childNodes[1]);
				speedsElem.replaceChild(document.createTextNode('\
					DL: ' + formatBytes(props.rateDownload) + '/s\
					UL: ' + formatBytes(props.rateUpload) + '/s'
				), speedsElem.childNodes[0]);
			}
			pauseElem.setAttribute('style', 'display: block');
			resumeElem.setAttribute('style', 'display: none');

			break;
		case 8:
			statsElem.replaceChild(document.createTextNode(
				formatBytes(props.sizeWhenDone) +
				' - Seeding, uploaded ' + formatBytes(props.uploadedEver) + ' (Ratio ' + (props.uploadedEver / props.sizeWhenDone).toFixed(2) + ')'
			), statsElem.childNodes[1]);
			speedsElem.replaceChild(document.createTextNode('UL: ' + formatBytes(props.rateUpload) + '/s'), speedsElem.childNodes[0]);
			curProgressElem.setAttribute('class', 'seeding');
			pauseElem.setAttribute('style', 'display: block');
			resumeElem.setAttribute('style', 'display: none');

			break;
		case 16:
			if (props.leftUntilDone) {
				statsElem.replaceChild(document.createTextNode(
					formatBytes(props.sizeWhenDone - props.leftUntilDone) + ' of ' + formatBytes(props.sizeWhenDone) +
					' ('+ percentDone.toFixed(2) + '%) - Paused'
				), statsElem.childNodes[1]);
				curProgressElem.setAttribute('class', 'paused');
			} else {
				if (props.doneDate > 0) {
					statsElem.replaceChild(document.createTextNode(
						formatBytes(props.sizeWhenDone) +
						' - Completed on ' + new Date(props.doneDate * 1000).toLocaleDateString()
					), statsElem.childNodes[1]);
				} else {
					statsElem.replaceChild(document.createTextNode(
						formatBytes(props.sizeWhenDone) +
						' - Completed on ' + new Date(props.addedDate * 1000).toLocaleDateString()
					), statsElem.childNodes[1]);
				}
			}
			speedsElem.replaceChild(document.createTextNode(''), speedsElem.childNodes[0]);
			pauseElem.setAttribute('style', 'display: none');
			resumeElem.setAttribute('style', 'display: block');

			break;
		}
	}

	// remove the list element for torrent
	this.removeElem = function() {
		this.elem.parentNode.removeChild(this.elem);
	}
}
