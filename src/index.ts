import { readFileSync } from "fs";

import { Segment } from "./types/segment";
import { createHighlight } from "./services/highlightService";
import { parseSegments } from "./validators/segmentInputValidator";

const inputVideo = "input/match.mp4";
const highlightOutput = "output/highlight_node.mp4";
const segmentsFile = "data/segments.json";

async function main(): Promise<void> {
  const fileContent = readFileSync(
    segmentsFile,
    "utf-8"
  );

  const rawData: unknown = JSON.parse(fileContent);

  const segments: Segment[] =
    parseSegments(rawData);

  console.log(
    `Loaded ${segments.length} segments.`
  );

  await createHighlight(
    inputVideo,
    segments,
    highlightOutput
  );
}

main().catch((error) => {
  console.error("Failed to start application:");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
});