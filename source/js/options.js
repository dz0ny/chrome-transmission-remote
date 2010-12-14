// communication port with background page
var port = chrome.extension.connect({ name: 'options' });

function addDir(label, dir) {
	if (label === '' || dir === '') return;

	var table = document.getElementById('customdirs');

	for (var i = 2, rowsLength = table.rows.length; i < rowsLength; i++) {
		if (table.rows[i].childNodes[0].textContent === label || table.rows[i].childNodes[1].textContent === dir) return;
	}

	var rowElem = table.insertRow(table.rows.length),
		labelElem = rowElem.insertCell(0),
		labelInputElem = document.createElement('input'),
		dirElem = rowElem.insertCell(1),
		dirInputElem = document.createElement('input'),
		buttonsElem = rowElem.insertCell(2),
		upElem = document.createElement('div'),
		downElem = document.createElement('div'),
		removeElem = document.createElement('div');

	labelElem.appendChild(labelInputElem);
	dirElem.appendChild(dirInputElem);
	buttonsElem.appendChild(upElem);
	buttonsElem.appendChild(downElem);
	buttonsElem.appendChild(removeElem);

	labelInputElem.setAttribute('type', 'text');
	labelInputElem.setAttribute('value', label);
	dirInputElem.setAttribute('type', 'text');
	dirInputElem.setAttribute('value', dir);

	upElem.setAttribute('class', 'button button_up');
	upElem.addEventListener('click', function() { if (rowElem.previousSibling.nodeName !== 'TBODY') { table.insertBefore(rowElem, rowElem.previousSibling); } }, false);

	downElem.setAttribute('class', 'button button_down');
	downElem.addEventListener('click', function() { if (rowElem !== table.lastChild) { table.insertBefore(rowElem, rowElem.nextSibling.nextSibling); } }, false);

	removeElem.setAttribute('class', 'button button_remove');
	removeElem.addEventListener('click', function() { table.removeChild(rowElem); }, false);

	document.getElementById('customlabel').value = '';
	document.getElementById('customdir').value = '';
}

function save() {
	localStorage.server = document.getElementById('protocol').value + '://' +
		document.getElementById('ip').value + ':' +
		document.getElementById('port').value;

	if (document.getElementById('path').value !== '') {
		localStorage.server += '/' + document.getElementById('path').value;
	}

	localStorage.user = document.getElementById('user').value;
	localStorage.pass = document.getElementById('pass').value;
	localStorage.notifications = document.getElementById('notifications').checked;

	// send message to background page to en/disable notifications
	port.postMessage({ notifications: document.getElementById('notifications').checked });

	localStorage.dLocation = (document.getElementById('dldefault').checked) ? 'dldefault' : 'dlcustom';

	// loop through the custom directories and save them
	var table = document.getElementById('customdirs'), dirs = [];
	for (var i = 2, rowsLength = table.rows.length; i < rowsLength; i++) {
		dirs.push({ label: table.rows[i].childNodes[0].childNodes[0].value, dir: table.rows[i].childNodes[1].childNodes[0].value });
	}

	localStorage.dirs = JSON.stringify(dirs);

	document.getElementById('saved').style.opacity = 1.0;
	setTimeout(function() { document.getElementById('saved').style.opacity = 0; }, 2000);
}

(function() {
	// default options
	if (typeof localStorage.server === 'undefined') localStorage.server = 'http://localhost:9091/transmission';
	if (typeof localStorage.user === 'undefined') localStorage.user = '';
	if (typeof localStorage.pass === 'undefined') localStorage.pass = '';
	if (typeof localStorage.notifications === 'undefined') localStorage.notifications = true;

	if (typeof localStorage.dLocation === 'undefined') {
		if (typeof localStorage.dlocation !== 'undefined') {
			localStorage.dLocation = localStorage.dlocation;
		} else {
			localStorage.dLocation = 'dldefault';
			localStorage.dirs = '[]';
		}
	}

	if (typeof localStorage.sessionId === 'undefined') localStorage.sessionId = '';
	if (typeof localStorage.torrentType === 'undefined') localStorage.torrentType = '0';
	if (typeof localStorage.torrentFilter === 'undefined') localStorage.torrentFilter = '';

	// make sure the script knows we've updated to the latest version of the config
	localStorage.verConfig = '2';

	var dirs = JSON.parse(localStorage.dirs),
		server_schema = localStorage.server.match(/(https?):\/\/(.*):(\d+)\/(.*)/);

	document.getElementById('protocol').value = server_schema[1];
	document.getElementById('ip').value = server_schema[2];
	document.getElementById('port').value = server_schema[3];
	document.getElementById('path').value = server_schema[4];
	document.getElementById('user').value = localStorage.user;
	document.getElementById('pass').value = localStorage.pass;
	document.getElementById('notifications').checked = (localStorage.notifications === 'true') ? true : false;

	document.getElementById(localStorage.dLocation).checked = true;

	for (var i = 0, dirsLength = dirs.length; i < dirsLength; i++) {
		addDir(dirs[i].label, dirs[i].dir);
	}
})();
