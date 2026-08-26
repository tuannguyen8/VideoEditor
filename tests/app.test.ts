import {
  describe,
  expect,
  it
} from "vitest";

import request from "supertest";

import { app } from "../src/app";

import path from "path";

import { readdir } from "fs/promises";

describe("GET /health", () => {
  it("returns API health status", async () => {
    const response = await request(app)
      .get("/health");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      status: "ok",
      message: "Video Editor API is running"
    });
  });
});

describe("DELETE /api/highlights/:jobId", () => {
  it("rejects an invalid highlight ID", async () => {
    const response = await request(app)
      .delete("/api/highlights/not-a-valid-uuid");

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      status: "error",
      message: "Invalid highlight ID."
    });
  });
});

describe("POST /api/highlights", () => {
  it("rejects a request without a video file", async () => {
    const response = await request(app)
      .post("/api/highlights")
      .field(
        "segments",
        JSON.stringify([
          {
            start: "0:20",
            end: "0:35"
          }
        ])
      );

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      status: "error",
      message: "Video file is required."
    });
  });

  it("rejects a file that is not a supported video type", async () => {
    const filePath = path.resolve(
      "tests",
      "fixtures",
      "not-video.txt"
    );

    const response = await request(app)
      .post("/api/highlights")
      .field(
        "segments",
        JSON.stringify([
          {
            start: "0:20",
            end: "0:35"
          }
        ])
      )
      .attach(
        "video",
        filePath
      );

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      status: "error",
      message:
        "Invalid file type. Only MP4, MOV, MKV, and WEBM videos are allowed."
    });
  });

    it("cleans up the uploaded video when segments are missing", async () => {
    const filePath = path.resolve(
        "tests",
        "fixtures",
        "fake-video.mp4"
    );

    const inputDirectory = path.resolve(
        "input"
    );

    const filesBefore =
        await readdir(inputDirectory);

    const response = await request(app)
        .post("/api/highlights")
        .attach(
        "video",
        filePath
        );

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
        status: "error",
        message: "Segments are required."
    });

    const filesAfter =
        await readdir(inputDirectory);

    expect(
        filesAfter.sort()
    ).toEqual(
        filesBefore.sort()
    );
    });

    it("cleans up the uploaded video when segments JSON is invalid", async () => {
    const filePath = path.resolve(
        "tests",
        "fixtures",
        "fake-video.mp4"
    );

    const inputDirectory = path.resolve(
        "input"
    );

    const filesBefore =
        await readdir(inputDirectory);

    const response = await request(app)
        .post("/api/highlights")
        .field(
        "segments",
        "[{invalid-json"
        )
        .attach(
        "video",
        filePath
        );

    expect(response.status).toBe(400);

    expect(response.body.status).toBe(
        "error"
    );

    const filesAfter =
        await readdir(inputDirectory);

    expect(
        filesAfter.sort()
    ).toEqual(
        filesBefore.sort()
    );
    });
});