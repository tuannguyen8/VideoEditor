import { app, BrowserWindow } from 'electron';
import path from 'path';

function createWindow() {
	const window = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	const frontendPath = path.join(
		__dirname,
		'../frontend/dist/index.html',
	);

	window.loadFile(frontendPath);
}

app.whenReady().then(() => {
	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});