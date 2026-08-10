import { Segment } from "../types/segment";

function isSegment(value: unknown): value is Segment {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const segment = value as Record<string, unknown>;

  return (
    typeof segment.start === "string" &&
    typeof segment.end === "string"
  );
}

export function parseSegments(data: unknown): Segment[] {
  if (!Array.isArray(data)) {
    throw new Error(
      "Invalid segments data: expected an array."
    );
  }

  const segments: Segment[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    if (!isSegment(item)) {
      throw new Error(
        `Invalid segment ${i + 1}: each segment must contain string fields "start" and "end".`
      );
    }

    segments.push(item);
  }

  return segments;
}