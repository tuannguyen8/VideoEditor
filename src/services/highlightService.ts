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
  highlightOutput: string
): Promise<void> {
  // Step 1: Read video information
  console.log("Reading video information...");

  const videoDuration = await getVideoDuration(inputVideo);

  console.log(
    `Video duration: ${videoDuration.toFixed(2)} seconds`
  );

  // Step 2: Validate segments
  console.log("Validating segments...");

  validateSegments(segments, videoDuration);

  console.log("All segments are valid!");

  const clipPaths: string[] = [];

  // Step 3: Cut every segment
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    const start = timeToSeconds(segment.start);
    const end = timeToSeconds(segment.end);

    const duration = end - start;

    const clipNumber = String(i + 1).padStart(3, "0");

    const outputVideo =
      `temp/node_clip_${clipNumber}.mp4`;

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

    console.log(`Created: ${outputVideo}`);
  }

  // Step 4: Create clips.txt
  const concatFilePath = "clips.txt";

  createConcatFile(
    clipPaths,
    concatFilePath
  );

  console.log("Created clips.txt");

  // Step 5: Merge clips
  console.log("Merging clips...");

  await mergeVideoClips(
    concatFilePath,
    highlightOutput
  );

  console.log("Highlight created successfully!");
  console.log(`Created: ${highlightOutput}`);
}