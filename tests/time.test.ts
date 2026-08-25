import {
  describe,
  expect,
  it
} from "vitest";

import {
  timeToSeconds
} from "../src/utils/time";

describe("timeToSeconds", () => {
  it("converts 1:35 to 95 seconds", () => {
    const result = timeToSeconds("1:35");

    expect(result).toBe(95);
  });

  it("converts 0:20 to 20 seconds", () => {
    const result = timeToSeconds("0:20");

    expect(result).toBe(20);
  });

  it("rejects seconds greater than 59", () => {
    expect(() => {
      timeToSeconds("1:75");
    }).toThrow();
  });

  it("rejects an invalid time format", () => {
    expect(() => {
      timeToSeconds("hello");
    }).toThrow();
  });
});