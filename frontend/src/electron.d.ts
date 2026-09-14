export {};

declare global {
	interface Window {
		electronAPI?: {
			selectVideo: () => Promise<{
				filePath: string;
				fileName: string;
				fileUrl: string;
			} | null>;
		};
	}
}