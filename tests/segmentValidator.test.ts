import {
  describe,
  expect,
  it
} from "vitest";

import {
  validateSegments
} from "../src/validators/segmentValidator";

import {
  Segment
} from "../src/types/segment";

describe("validateSegments", () => {
  const videoDuration = 120;

  it("accepts valid segments", () => {
    const segments: Segment[] = [
      {
        start: "0:20",
        end: "0:35"
      },
      {
        start: "0:50",
        end: "1:05"
      }
    ];

    expect(() => {
      validateSegments(
        segments,
        videoDuration
      );
    }).not.toThrow();
  });

  it("rejects an empty segment list", () => {
    const segments: Segment[] = [];

    expect(() => {
      validateSegments(
        segments,
        videoDuration
      );
    }).toThrow(
      "At least one segment is required."
    );
  });

  it("rejects a segment when start is after end", () => {
    const segments: Segment[] = [
      {
        start: "0:50",
        end: "0:20"
      }
    ];

    expect(() => {
      validateSegments(
        segments,
        videoDuration
      );
    }).toThrow(
      "Invalid segment 1: start time (0:50) must be before end time (0:20)."
    );
  });

  it("rejects a start time outside the video", () => {
    const segments: Segment[] = [
      {
        start: "2:10",
        end: "2:20"
      }
    ];

    expect(() => {
      validateSegments(
        segments,
        videoDuration
      );
    }).toThrow(
      "Invalid segment 1: start time (2:10) is outside the video."
    );
  });

  it("rejects an end time beyond the video duration", () => {
    const segments: Segment[] = [
      {
        start: "1:50",
        end: "2:30"
      }
    ];

    expect(() => {
      validateSegments(
        segments,
        videoDuration
      );
    }).toThrow(
      "Invalid segment 1: end time (2:30) exceeds the video duration."
    );
  });
});