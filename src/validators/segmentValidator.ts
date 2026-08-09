import { Segment } from "../types/segment";
import { timeToSeconds } from "../utils/time";

export function validateSegments(
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