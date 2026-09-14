export {};

declare global {
	interface Window {
		electronAPI?: {
			selectVideo: () => Promise<{
				filePath: string;
				fileName: string;
				fileUrl: string;
			} | null>;

            selectSaveLocation: () =>
                Promise<string | null>;

			createHighlight: (
				videoPath: string,
				segments: {
					start: string;
					end: string;
				}[],
                outputPath: string,
			) => Promise<{
				videoPath: string;
				videoUrl: string;
			}>;
		};
	}
}