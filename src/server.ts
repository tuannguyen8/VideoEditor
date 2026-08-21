//import express from 'express';
import express, {
  Request,
  Response,
  NextFunction
} from "express";
import multer from "multer";
import { rm } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from "path";

import { createHighlight } from './services/highlightService';
import { parseSegments } from './validators/segmentInputValidator';
import { upload } from './middleware/upload';

const app = express();

const PORT = 3000;

app.use(express.json());

const outputDirectory = path.join(
  __dirname,
  "../output"
);

app.use(
  "/highlights",
  express.static(outputDirectory)
);

app.get('/health', (req, res) => {
	res.json({
		status: 'ok',
		message: 'Video Editor API is running',
	});
});

app.post('/api/highlights', upload.single('video'), async (req, res) => {
	let inputVideo: string | undefined;
	let workDir: string | undefined;

	try {
		// Step 1: Make sure a video was uploaded
		if (!req.file) {
			throw new Error('Video file is required.');
		}

		// Step 2: Make sure segments were provided
		if (!req.body.segments) {
			throw new Error('Segments are required.');
		}

		// Step 3: Convert segments string into JavaScript data
		const rawSegments: unknown = JSON.parse(req.body.segments);

		// Step 4: Validate segment structure
		const segments = parseSegments(rawSegments);

		inputVideo = req.file.path;
		const jobId = randomUUID();
		workDir = `temp/${jobId}`;

		// const outputVideo = `output/highlight_${jobId}.mp4`;
        const outputFileName = `highlight_${jobId}.mp4`;
        const outputVideo = `output/${outputFileName}`;
        const videoUrl = `/highlights/${outputFileName}`;

		console.log(`Received video: ${inputVideo}`);

		console.log(`Received ${segments.length} segments.`);

		// Step 5: Create highlight
		await createHighlight(inputVideo, segments, outputVideo, workDir);

		res.status(201).json({
			status: 'success',
			jobId,
			message: 'Highlight created successfully',
			videoUrl,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';

		console.error('Failed to create highlight:', message);

		res.status(400).json({
			status: 'error',
			message,
		});
	} finally {
		if (inputVideo) {
			await rm(inputVideo, {
				force: true,
			});

			console.log(`Deleted uploaded video: ${inputVideo}`);
		}

		if (workDir) {
			await rm(workDir, {
				recursive: true,
				force: true,
			});

			console.log(`Deleted temporary workspace: ${workDir}`);
		}
	}
});

app.use(
  (
    error: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({
          status: "error",
          message: "Video file is too large."
        });

        return;
      }

      res.status(400).json({
        status: "error",
        message: error.message
      });

      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        status: "error",
        message: error.message
      });

      return;
    }

    res.status(500).json({
      status: "error",
      message: "Unknown server error."
    });
  }
);

app.delete(
  "/api/highlights/:jobId",
  async (req, res) => {
    const { jobId } = req.params;

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(jobId)) {
      res.status(400).json({
        status: "error",
        message: "Invalid highlight ID."
      });

      return;
    }

    const outputVideo = path.join(
      outputDirectory,
      `highlight_${jobId}.mp4`
    );

    try {
      await rm(outputVideo, {
        force: true
      });

      console.log(
        `Deleted highlight: ${outputVideo}`
      );

      res.json({
        status: "success",
        message: "Highlight deleted successfully."
      });

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error";

      res.status(500).json({
        status: "error",
        message
      });
    }
  }
);

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
