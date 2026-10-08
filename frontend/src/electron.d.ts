export {};


interface Segment {
    start: string;
    end: string;
}


interface SelectedVideo {
    filePath: string;
    fileName: string;
    fileUrl: string;
}


interface ElectronAPI {
    selectVideo():
        Promise<
            SelectedVideo
            | null
        >;

    selectSaveLocation():
        Promise<
            string
            | null
        >;

    createHighlight(
        inputVideo:
            string,
        segments:
            Segment[],
        outputPath:
            string,
    ): Promise<{
        videoUrl:
            string;
    }>;
}


declare global {
    interface Window {
        electronAPI?:
            ElectronAPI;
    }
}
