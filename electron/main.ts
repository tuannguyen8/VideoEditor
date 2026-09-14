import {
	app,
	BrowserWindow,
	dialog,
	ipcMain
} from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';

ipcMain.handle(
	'dialog:selectVideo',
	async () => {
		const result =
			await dialog.showOpenDialog({
				properties: ['openFile'],
				filters: [
					{
						name: 'Video Files',
						extensions: [
							'mp4',
							'mov',
							'mkv',
							'webm',
						],
					},
				],
			});

		if (
			result.canceled ||
			result.filePaths.length === 0
		) {
			return null;
		}

		const filePath =
			result.filePaths[0];

		return {
			filePath,
			fileName:
				path.basename(filePath),
			fileUrl:
				pathToFileURL(filePath).href,
		};
	},
);

function createWindow() {
	const window = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			preload: path.join(
				__dirname,
				'preload.js',
			),
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