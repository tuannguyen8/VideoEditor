import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseSegments
} from "../src/validators/segmentInputValidator";

describe("parseSegments", () => {
  it("accepts valid segment data", () => {
    const data: unknown = [
      {
        start: "0:20",
        end: "0:35"
      },
      {
        start: "0:50",
        end: "1:05"
      }
    ];

    const result = parseSegments(data);

    expect(result).toEqual([
      {
        start: "0:20",
        end: "0:35"
      },
      {
        start: "0:50",
        end: "1:05"
      }
    ]);
  });

  it("rejects data that is not an array", () => {
    const data: unknown = {
      start: "0:20",
      end: "0:35"
    };

    expect(() => {
      parseSegments(data);
    }).toThrow(
      "Invalid segments data: expected an array."
    );
  });

  it("rejects a segment missing start", () => {
    const data: unknown = [
      {
        end: "0:35"
      }
    ];

    expect(() => {
      parseSegments(data);
    }).toThrow(
      'Invalid segment 1: each segment must contain string fields "start" and "end".'
    );
  });

  it("rejects a segment missing end", () => {
    const data: unknown = [
      {
        start: "0:20"
      }
    ];

    expect(() => {
      parseSegments(data);
    }).toThrow(
      'Invalid segment 1: each segment must contain string fields "start" and "end".'
    );
  });

  it("rejects non-string start or end values", () => {
    const data: unknown = [
      {
        start: 20,
        end: 35
      }
    ];

    expect(() => {
      parseSegments(data);
    }).toThrow(
      'Invalid segment 1: each segment must contain string fields "start" and "end".'
    );
  });
});