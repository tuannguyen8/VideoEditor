import { Segment } from "./types/segment";
import { createHighlight } from "./services/highlightService";

const inputVideo = "input/match.mp4";

const highlightOutput =
  "output/highlight_node.mp4";

const segments: Segment[] = [
  { start: "0:20", end: "0:35" },
  { start: "0:50", end: "1:05" }
];

createHighlight(
  inputVideo,
  segments,
  highlightOutput
).catch((error) => {
  console.error("Failed to create highlight:");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
});