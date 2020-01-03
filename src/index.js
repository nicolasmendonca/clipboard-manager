const { app, Menu, Tray, globalShortcut, clipboard } = require('electron');
const path = require('path');
const clipboardWatcher = require('electron-clipboard-watcher');

const contents = new Map();
const initialPosition = 1;
let clipboardWatcherInstance = null;

let activePosition = initialPosition;
/** @type {Tray} */
let tray = null;
let clipboardPositions = Array(10)
	.fill(null)
	.map((_, i) => ({
		label: `${i}`,
		type: 'radio',
		click: () => onPositionSelect(i),
		accelerator: `CommandOrControl+${i}`,
		checked: i === activePosition,
		enabled: true,
	}));

const separator = { type: 'separator' };

const quitOption = {
	label: 'Quit',
	click: () => {
		clipboardWatcherInstance.stop();
		app.exit();
	},
};

// @ts-ignore
const contextMenu = Menu.buildFromTemplate([
	...clipboardPositions,
	separator,
	quitOption,
]);

function getIconAbsPath(position) {
	const contentFolder = contents.has(position) ? 'filled' : 'empty';
	return path.join(__dirname, `icons/numbers/${contentFolder}/${position}.png`);
}

function setIcon(position) {
	tray.setImage(getIconAbsPath(position));
	tray.setToolTip(contents.has(position) ? 'Copied!' : 'No text available');
}

function onPositionSelect(index) {
	contextMenu.items[index].checked = true;
	activePosition = index;
	const text = contents.has(index) ? contents.get(index) : '';
	clipboard.writeText(text);
	setIcon(index);
}

function boot() {
	tray = new Tray(getIconAbsPath(activePosition));
	tray.setContextMenu(contextMenu);

	clipboardPositions.forEach((_, index) => {
		// select position
		globalShortcut.register(`CommandOrControl+${index}`, () =>
			onPositionSelect(index)
		);
		// clear position
		globalShortcut.register(`CommandOrControl+Shift+${index}`, () => {
			contents.delete(index);
			onPositionSelect(index);
			clipboard.writeText('');
		});
	});

	clipboardWatcherInstance = clipboardWatcher({
		watchDelay: 300,
		onTextChange: text => {
			contents.set(activePosition, text);
			// This needs to happen after the content has been set
			setIcon(activePosition);
		},
	});

	// Select first position
	onPositionSelect(initialPosition);
}

app.on('ready', boot);
