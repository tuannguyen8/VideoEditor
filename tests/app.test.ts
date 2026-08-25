import {
  describe,
  expect,
  it
} from "vitest";

import request from "supertest";

import { app } from "../src/app";

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
});