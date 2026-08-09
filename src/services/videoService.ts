import { execFile } from "child_process";
import { promisify } from "util";
import { writeFileSync } from "fs";

const execFileAsync = promisify(execFile);

export async function getVideoDuration(
  videoPath: string
): Promise<number> {
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

export async function cutVideoSegment(
  inputVideo: string,
  start: number,
  duration: number,
  outputVideo: string
): Promise<void> {
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

  await execFileAsync("ffmpeg", args);
}

export async function mergeVideoClips(
  concatFilePath: string,
  outputVideo: string
): Promise<void> {
  const args = [
    "-y",
    "-f",
    "concat",

    "-safe",
    "0",

    "-i",
    concatFilePath,

    "-c",
    "copy",

    outputVideo
  ];

  await execFileAsync("ffmpeg", args);
}

export function createConcatFile(
  clipPaths: string[],
  concatFilePath: string
): void {
  const concatContent = clipPaths
    .map((clipPath) => `file '${clipPath}'`)
    .join("\n");

  writeFileSync(concatFilePath, concatContent);
}