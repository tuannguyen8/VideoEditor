import {
	contextBridge,
	ipcRenderer
} from 'electron';

contextBridge.exposeInMainWorld(
	'electronAPI',
	{
		selectVideo: () =>
			ipcRenderer.invoke(
				'dialog:selectVideo',
			),

		selectSaveLocation: () =>
			ipcRenderer.invoke(
				'dialog:saveHighlight',
			),

		createHighlight: (
			videoPath: string,
			segments: {
				start: string;
				end: string;
			}[],
            outputPath: string,
		) =>
			ipcRenderer.invoke(
				'highlight:create',
				{
					videoPath,
					segments,
                    outputPath,
				},
			),
	},
);

