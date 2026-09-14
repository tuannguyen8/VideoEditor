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
	mkdir,
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
	'highlight:create',
	async (
		_event,
		payload: {
			videoPath: string;
			segments: Segment[];
		},
	) => {
		const jobId = randomUUID();

		const outputDirectory =
			path.join(
				process.cwd(),
				'output',
			);

		const workDir =
			path.join(
				process.cwd(),
				'temp',
				jobId,
			);

		const outputPath =
			path.join(
				outputDirectory,
				`highlight_${jobId}.mp4`,
			);

		await mkdir(
			outputDirectory,
			{
				recursive: true,
			},
		);

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