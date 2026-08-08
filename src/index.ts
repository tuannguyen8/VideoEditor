import { execFile } from "child_process";
import { promisify } from "util";

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

async function cutSegments() {
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

    console.log(`Created: ${outputVideo}`);
  }
}

cutSegments().catch((error) => {
  console.error("Failed to create clips:");
  console.error(error);
});
