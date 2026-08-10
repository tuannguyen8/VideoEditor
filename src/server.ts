import express from "express";

import { createHighlight } from "./services/highlightService";
import { parseSegments } from "./validators/segmentInputValidator";
import { upload } from "./middleware/upload";

const app = express();

const PORT = 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Video Editor API is running"
  });
});

app.post(
  "/api/highlights",
  upload.single("video"),
  async (req, res) => {
    try {
      // Step 1: Make sure a video was uploaded
      if (!req.file) {
        throw new Error("Video file is required.");
      }

      // Step 2: Make sure segments were provided
      if (!req.body.segments) {
        throw new Error("Segments are required.");
      }

      // Step 3: Convert segments string into JavaScript data
      const rawSegments: unknown =
        JSON.parse(req.body.segments);

      // Step 4: Validate segment structure
      const segments =
        parseSegments(rawSegments);

      const inputVideo =
        req.file.path;

      const outputVideo =
        "output/highlight_api.mp4";

      console.log(
        `Received video: ${inputVideo}`
      );

      console.log(
        `Received ${segments.length} segments.`
      );

      // Step 5: Create highlight
      await createHighlight(
        inputVideo,
        segments,
        outputVideo
      );

      res.status(201).json({
        status: "success",
        message: "Highlight created successfully",
        output: outputVideo
      });

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error";

      console.error(
        "Failed to create highlight:",
        message
      );

      res.status(400).json({
        status: "error",
        message
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(
    `Server is running on http://localhost:${PORT}`
  );
});