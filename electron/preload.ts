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

		createHighlight: (
			videoPath: string,
			segments: {
				start: string;
				end: string;
			}[],
		) =>
			ipcRenderer.invoke(
				'highlight:create',
				{
					videoPath,
					segments,
				},
			),
	},
);

