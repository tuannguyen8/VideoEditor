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
	},
);