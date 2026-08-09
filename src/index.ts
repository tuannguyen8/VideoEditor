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
  const parts = time.split(":");

  // Must be in minute:second format
  if (parts.length !== 2) {
    throw new Error(
      `Invalid time format: "${time}". Use format M:SS, for example 1:35.`
    );
  }

  const minutes = Number(parts[0]);
  const seconds = Number(parts[1]);

  // Check that values are actually numbers
  if (
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds)
  ) {
    throw new Error(
      `Invalid time: "${time}". Minutes and seconds must be whole numbers.`
    );
  }

  // Minutes cannot be negative
  if (minutes < 0) {
    throw new Error(
      `Invalid time: "${time}". Minutes cannot be negative.`
    );
  }

  // Seconds must be 0 - 59
  if (seconds < 0 || seconds > 59) {
    throw new Error(
      `Invalid time: "${time}". Seconds must be between 0 and 59.`
    );
  }

  return minutes * 60 + seconds;
}

async function getVideoDuration(videoPath: string): Promise<number> {
  const args = [
    "-v",
    "error",

    "-show_entries",
    "format=duration",

    "-of",
    "default=noprint_wrappers=1:nokey=1",

    videoPath
  ];

  const { stdout } = await execFileAsync("ffprobe", args);

  const duration = Number(stdout.trim());

  if (!Number.isFinite(duration)) {
    throw new Error("Could not determine video duration.");
  }

  return duration;
}

// function validateSegments(segments: Segment[]): void {
//   if (segments.length === 0) {
//     throw new Error("At least one segment is required.");
//   }

//   for (let i = 0; i < segments.length; i++) {
//     const segment = segments[i];

//     const start = timeToSeconds(segment.start);
//     const end = timeToSeconds(segment.end);

//     if (start >= end) {
//       throw new Error(
//         `Invalid segment ${i + 1}: start time (${segment.start}) must be before end time (${segment.end}).`
//       );
//     }
//   }
// }

function validateSegments(
  segments: Segment[],
  videoDuration: number
): void {
  if (segments.length === 0) {
    throw new Error("At least one segment is required.");
  }

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    const start = timeToSeconds(segment.start);
    const end = timeToSeconds(segment.end);

    if (start >= end) {
      throw new Error(
        `Invalid segment ${i + 1}: start time (${segment.start}) must be before end time (${segment.end}).`
      );
    }

    if (start >= videoDuration) {
      throw new Error(
        `Invalid segment ${i + 1}: start time (${segment.start}) is outside the video.`
      );
    }

    if (end > videoDuration) {
      throw new Error(
        `Invalid segment ${i + 1}: end time (${segment.end}) exceeds the video duration.`
      );
    }
  }
}



async function createHighlight() {
  // Step 1: Validate user input
  console.log("Reading video information...");

  const videoDuration = await getVideoDuration(inputVideo);

  console.log(
    `Video duration: ${videoDuration.toFixed(2)} seconds`
  );

  console.log("Validating segments...");

  validateSegments(segments, videoDuration);

  console.log("All segments are valid!");

  const clipPaths: string[] = [];

  // Step 2: Cut every segment
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

  // Step 3: Create clips.txt
  const concatContent = clipPaths
    .map((clipPath) => `file '${clipPath}'`)
    .join("\n");

  writeFileSync("clips.txt", concatContent);

  console.log("Created clips.txt");

  // Step 4: Merge all clips
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

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
});