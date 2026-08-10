import express from "express";

import { createHighlight } from "./services/highlightService";
import { parseSegments } from "./validators/segmentInputValidator";

const app = express();

const PORT = 3000;

// Allow Express to read JSON request bodies
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Video Editor API is running"
  });
});

app.post("/api/highlights", async (req, res) => {
  try {
    // Step 1: Read and validate segments from request body
    const segments = parseSegments(req.body.segments);

    // For now, we still use a fixed input video
    const inputVideo = "input/match.mp4";

    const outputVideo =
      "output/highlight_api.mp4";

    console.log(
      `Received request with ${segments.length} segments.`
    );

    // Step 2: Create highlight
    await createHighlight(
      inputVideo,
      segments,
      outputVideo
    );

    // Step 3: Send success response
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
});

app.listen(PORT, () => {
  console.log(
    `Server is running on http://localhost:${PORT}`
  );
});