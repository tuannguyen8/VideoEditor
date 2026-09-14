export {};

declare global {
	interface Window {
		electronAPI?: {
			selectVideo: () => Promise<{
				filePath: string;
				fileName: string;
				fileUrl: string;
			} | null>;

			createHighlight: (
				videoPath: string,
				segments: {
					start: string;
					end: string;
				}[],
			) => Promise<{
				videoPath: string;
				videoUrl: string;
			}>;
		};
	}
}