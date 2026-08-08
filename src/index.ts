import { execFile } from "child_process";
import { promisify } from "util";
import { writeFileSync } from "fs";

const execFileAsync = promisify(execFile);

const inputVideo = "input/match.mp4";

interface Segment {
    start: number;
    end: number;
}

const segments: Segment[] = [
    { start: 20, end: 35 },
    { start: 50, end: 65 }
];

async function createHighlight() {
    const clipPaths: string[] = [];

    // Step 1: Cut every segment
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        const duration = segment.end - segment.start;

        const clipNumber = String(i + 1).padStart(3, "0");

        const outputVideo = `temp/node_clip_${clipNumber}.mp4`;

        const args = [
            "-y",
            "-ss", String(segment.start),
            "-i", inputVideo,
            "-t", String(duration),
            "-c", "copy",
            outputVideo
        ];

        console.log(`Cutting clip ${clipNumber}...`);

        await execFileAsync("ffmpeg", args);

        clipPaths.push(outputVideo);

        console.log(`Created: ${outputVideo}`);
    }

    // Step 2: Create clips.txt
    const concatContent = clipPaths
    .map((clipPath) => `file '${clipPath}'`)
    .join("\n");

    writeFileSync("clips.txt", concatContent);

    console.log("Created clips.txt");

    // Step 3: Merge all clips
    const highlightOutput = "output/highlight_node.mp4";

    const concatArgs = [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", "clips.txt",
    "-c", "copy",
    highlightOutput
    ];

    console.log("Merging clips...");

    await execFileAsync("ffmpeg", concatArgs);

    console.log("Highlight created successfully!");
    console.log(`Created: ${highlightOutput}`);
}

createHighlight().catch((error) => {
    console.error("Failed to create highlight:");
    console.error(error);
});