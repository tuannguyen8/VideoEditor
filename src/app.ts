import express, { Request, Response, NextFunction } from 'express';

import multer from 'multer';
import { rm } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path';

import { createHighlight } from './services/highlightService';
import { parseSegments } from './validators/segmentInputValidator';
import { upload } from './middleware/upload';

export const app = express();

export const outputDirectory = path.join(__dirname, '../output');

const frontendDirectory = path.join(__dirname, '../frontend/dist');

app.use(express.json());

app.use('/highlights', express.static(outputDirectory));

app.get('/health', (_req, res) => {
	res.json({
		status: 'ok',
		message: 'Video Editor API is running',
	});
});

app.post('/api/highlights', upload.single('video'), async (req, res) => {
	let inputVideo: string | undefined;
	let workDir: string | undefined;
	let statusCode = 201;
	let responseBody: Record<string, unknown> = {};

	try {
		if (!req.file) {
			throw new Error('Video file is required.');
		}

		// Store this immediately so finally can always delete it.
		inputVideo = req.file.path;

		if (!req.body.segments) {
			throw new Error('Segments are required.');
		}

		const rawSegments: unknown = JSON.parse(req.body.segments);

		const segments = parseSegments(rawSegments);

		const jobId = randomUUID();

		workDir = `temp/${jobId}`;

		const outputFileName = `highlight_${jobId}.mp4`;

		const outputVideo = `output/${outputFileName}`;

		const videoUrl = `/highlights/${outputFileName}`;

		console.log(`Received video: ${inputVideo}`);

		console.log(`Received ${segments.length} segments.`);

		await createHighlight(inputVideo, segments, outputVideo, workDir);

		responseBody = {
			status: 'success',
			jobId,
			message: 'Highlight created successfully',
			videoUrl,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';

		console.error('Failed to create highlight:', message);

		statusCode = 400;

		responseBody = {
			status: 'error',
			message,
		};
	} finally {
		if (inputVideo) {
			try {
				await rm(inputVideo, {
					force: true,
				});

				console.log(`Deleted uploaded video: ${inputVideo}`);
			} catch (cleanupError) {
				console.error(
					`Failed to delete uploaded video: ${inputVideo}`,
					cleanupError,
				);
			}
		}

		if (workDir) {
			try {
				await rm(workDir, {
					recursive: true,
					force: true,
				});

				console.log(`Deleted temporary workspace: ${workDir}`);
			} catch (cleanupError) {
				console.error(
					`Failed to delete temporary workspace: ${workDir}`,
					cleanupError,
				);
			}
		}
	}

	res.status(statusCode).json(responseBody);
});

app.delete('/api/highlights/:jobId', async (req, res) => {
	const { jobId } = req.params;

	const uuidPattern =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

	if (!uuidPattern.test(jobId)) {
		res.status(400).json({
			status: 'error',
			message: 'Invalid highlight ID.',
		});

		return;
	}

	const outputVideo = path.join(outputDirectory, `highlight_${jobId}.mp4`);

	try {
		await rm(outputVideo, {
			force: true,
		});

		console.log(`Deleted highlight: ${outputVideo}`);

		res.json({
			status: 'success',
			message: 'Highlight deleted successfully.',
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';

		res.status(500).json({
			status: 'error',
			message,
		});
	}
});

// Serve the production React build
app.use(express.static(frontendDirectory));

// Express error handler
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
	if (error instanceof multer.MulterError) {
		if (error.code === 'LIMIT_FILE_SIZE') {
			res.status(413).json({
				status: 'error',
				message: 'Video file is too large.',
			});

			return;
		}

		res.status(400).json({
			status: 'error',
			message: error.message,
		});

		return;
	}

	if (error instanceof Error) {
		res.status(400).json({
			status: 'error',
			message: error.message,
		});

		return;
	}

	res.status(500).json({
		status: 'error',
		message: 'Unknown server error.',
	});
});
