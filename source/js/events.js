//================
// delete button

// change the delete button to indicate if it deletes data or not
function changeDeleteButton(event, type) {
	if (event.which === 17) {
		var elems = document.getElementsByName('torrent_remove');

		for (var i = 0, elem; elem = elems[i]; ++i) {
			elem.setAttribute('class', 'torrent_button ' + type);
		}
	}
}

// change delete button to indicate delete w/ data
document.addEventListener('keydown', function() { changeDeleteButton(event, 'remove_data') }, false);

// change delete button to indicate just delete from list
document.addEventListener('keyup', function(event) { changeDeleteButton(event, 'remove') }, false);


//=================
// torrent filter

// set the current torrent filter
function applyFilter() {
	for (var i = 0, torrent; torrent = torrents[i]; ++i) {
		torrent.filter();
	}

	// set whether or not the no torrents status message is visible
	setStatusVisibility();
}

// filter torrents by type
document.getElementById('filter_type').addEventListener('change', function() {
	localStorage.torrentType = this.value;

	applyFilter();
}, false);

// filter torrents by name
document.getElementById('filter_input').addEventListener('change', function() {
	localStorage.torrentFilter = this.value;

	applyFilter();
}, false);

// clear the filter when the clear button is clicked
document.getElementById('filter_clear').addEventListener('click', function() {
	this.style.display = 'none';
	document.getElementById('filter_input').value = '';
	localStorage.torrentFilter = '';

	applyFilter();
}, false);

// set the visibility of the clear filter button when something is typed into the filter input field
document.getElementById('filter_input').addEventListener('keyup', function() {
	document.getElementById('filter_clear').style.display = (this.value === '') ? 'none' : 'block';
}, false);


//=======
// menu

// toggle the menu
document.getElementById('menu_button').addEventListener('click', function(event) {
	var menuElem = document.getElementById('menu');

	if (this.className !== 'on') {
		menuElem.style.display = 'block';
		this.setAttribute('class', 'on');
	} else {
		menuElem.style.display = 'none';
		this.removeAttribute('class');
	}

	event.stopPropagation();
}, false);

// hide menu when something besides the menu is clicked
document.getElementById('menu').addEventListener('click', function() { event.stopPropagation(); }, false);
document.addEventListener('click', function() {
	document.getElementById('menu').style.display = 'none';
	document.getElementById('menu_button').removeAttribute('class');
}, false);


//==============
// turtle mode

// toggle turtle mode
document.getElementById('turtle_button').addEventListener('click', function() {
	clearTimeout(refresh);

	if (this.className === 'on') port.postMessage({ args: '"alt-speed-enabled": false', method: 'session-set' });
	else port.postMessage({ args: '"alt-speed-enabled": true', method: 'session-set' });

	refreshPopup();
}, false);
