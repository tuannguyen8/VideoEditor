import { execFile } from "child_process";
import { promisify } from "util";
import { writeFileSync } from "fs";

const execFileAsync = promisify(execFile);

const inputVideo = "input/match.mp4";
const highlightOutput = "output/highlight_node.mp4";

interface Segment {
  start: string;
  end: string;
}

const segments: Segment[] = [
  { start: "0:20", end: "0:35" },
  { start: "0:50", end: "1:05" }
];

function timeToSeconds(time: string): number {
  const parts = time.split(":").map(Number);

  const minutes = parts[0];
  const seconds = parts[1];

  return minutes * 60 + seconds;
}

async function createHighlight() {
  const clipPaths: string[] = [];

  // Step 1: Cut every segment
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    const start = timeToSeconds(segment.start);
    const end = timeToSeconds(segment.end);

    const duration = end - start;

    const clipNumber = String(i + 1).padStart(3, "0");

    const outputVideo = `temp/node_clip_${clipNumber}.mp4`;

    const args = [
      "-y",
      "-ss",
      String(start),

      "-i",
      inputVideo,

      "-t",
      String(duration),

      "-c",
      "copy",

      outputVideo
    ];

    console.log(
      `Cutting clip ${clipNumber}: ${segment.start} -> ${segment.end}`
    );

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
  const concatArgs = [
    "-y",

    "-f",
    "concat",

    "-safe",
    "0",

    "-i",
    "clips.txt",

    "-c",
    "copy",

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