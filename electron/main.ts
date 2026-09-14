import {
	app,
	BrowserWindow,
	dialog,
	ipcMain
} from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import { randomUUID } from 'crypto';
import {
	rm,
} from 'fs/promises';

interface Segment {
	start: string;
	end: string;
}

type CreateHighlightFunction = (
	inputVideo: string,
	segments: Segment[],
	highlightOutput: string,
	workDir?: string,
) => Promise<void>;

const { createHighlight } = require(
	'../dist/services/highlightService',
) as {
	createHighlight: CreateHighlightFunction;
};

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

ipcMain.handle(
	'dialog:saveHighlight',
	async () => {
		const result =
			await dialog.showSaveDialog({
				title: 'Save Highlight',
				defaultPath: 'highlight.mp4',
				filters: [
					{
						name: 'MP4 Video',
						extensions: ['mp4'],
					},
				],
			});

		if (
			result.canceled ||
			!result.filePath
		) {
			return null;
		}

		return result.filePath;
	},
);

ipcMain.handle(
	'highlight:create',
	async (
		_event,
		payload: {
			videoPath: string;
			segments: Segment[];
			outputPath: string;
		},
	) => {
		const jobId = randomUUID();

		const workDir =
			path.join(
				process.cwd(),
				'temp',
				jobId,
			);

		let outputPath =
			payload.outputPath;

		if (
			path.extname(
				outputPath,
			).toLowerCase() !== '.mp4'
		) {
			outputPath += '.mp4';
		}

		if (
			path.resolve(outputPath) ===
			path.resolve(
				payload.videoPath,
			)
		) {
			throw new Error(
				'The highlight cannot overwrite the original video.',
			);
		}

		try {
			await createHighlight(
				payload.videoPath,
				payload.segments,
				outputPath,
				workDir,
			);

			return {
				videoPath: outputPath,
				videoUrl:
					pathToFileURL(
						outputPath,
					).href,
			};
		} finally {
			try {
				await rm(
					workDir,
					{
						recursive: true,
						force: true,
					},
				);

				console.log(
					`Deleted temporary workspace: ${workDir}`,
				);
			} catch (error) {
				console.error(
					'Failed to delete temporary workspace:',
					error,
				);
			}
		}
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