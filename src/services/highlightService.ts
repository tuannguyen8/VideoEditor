import { mkdirSync } from "fs";

import { Segment } from "../types/segment";
import { timeToSeconds } from "../utils/time";
import { validateSegments } from "../validators/segmentValidator";

import {
  getVideoDuration,
  cutVideoSegment,
  createConcatFile,
  mergeVideoClips
} from "./videoService";

export async function createHighlight(
  inputVideo: string,
  segments: Segment[],
  highlightOutput: string,
  workDir: string = "temp"
): Promise<void> {
  mkdirSync(workDir, {
    recursive: true
  });

  console.log("Reading video information...");

  const videoDuration =
    await getVideoDuration(inputVideo);

  console.log(
    `Video duration: ${videoDuration.toFixed(2)} seconds`
  );

  console.log("Validating segments...");

  validateSegments(
    segments,
    videoDuration
  );

  console.log("All segments are valid!");

  const clipPaths: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    const start =
      timeToSeconds(segment.start);

    const end =
      timeToSeconds(segment.end);

    const duration =
      end - start;

    const clipNumber =
      String(i + 1).padStart(3, "0");

    const outputVideo =
      `${workDir}/node_clip_${clipNumber}.mp4`;

    console.log(
      `Cutting clip ${clipNumber}: ${segment.start} -> ${segment.end}`
    );

    await cutVideoSegment(
      inputVideo,
      start,
      duration,
      outputVideo
    );

    clipPaths.push(outputVideo);

    console.log(
      `Created: ${outputVideo}`
    );
  }

  const concatFilePath =
    `${workDir}/clips.txt`;

  createConcatFile(
    clipPaths,
    concatFilePath
  );

  console.log(
    `Created: ${concatFilePath}`
  );

  console.log("Merging clips...");

  await mergeVideoClips(
    concatFilePath,
    highlightOutput
  );

  console.log(
    "Highlight created successfully!"
  );

  console.log(
    `Created: ${highlightOutput}`
  );
}