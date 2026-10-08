import { randomUUID } from "crypto";
import { rm } from "fs/promises";
import path from "path";

import type { Express } from "express";

import { upload } from "../middleware/upload";

import {
    detectAiSegmentsDetailed,
    renderAiHighlight,
    type AiDetectedSegment,
} from "../services/aiHighlightService";

import type { Segment } from "../types/segment";

type AiJobStatus =
    | "queued"
    | "detecting"
    | "ready"
    | "rendering"
    | "complete"
    | "failed";

interface AiJob {
    id: string;
    status: AiJobStatus;
    message: string;

    inputVideo: string;
    workDir: string;
    outputVideo: string;
    outputFileName: string;

    createdAt: number;

    candidates?: AiDetectedSegment[];
    videoUrl?: string;
    segments?: Segment[];
    error?: string;
}

interface RequestedAiSegment {
    id: string;
    start: string;
    end: string;
}

const aiJobs =
    new Map<string, AiJob>();

const AI_JOB_TTL_MS =
    60 * 60 * 1000;

const AI_JOB_CLEANUP_MS =
    10 * 60 * 1000;

const TIMESTAMP_PATTERN =
    /^\d+:[0-5]\d$/;

async function safeRemoveFile(
    filePath: string,
): Promise<void> {
    try {
        await rm(
            filePath,
            {
                force: true,
            },
        );
    } catch (error) {
        console.error(
            `Failed to delete ${filePath}:`,
            error,
        );
    }
}

async function safeRemoveDirectory(
    directoryPath: string,
): Promise<void> {
    try {
        await rm(
            directoryPath,
            {
                recursive: true,
                force: true,
            },
        );
    } catch (error) {
        console.error(
            `Failed to delete ${directoryPath}:`,
            error,
        );
    }
}

async function cleanupJobWorkspace(
    job: AiJob,
): Promise<void> {
    await Promise.all([
        safeRemoveFile(
            job.inputVideo,
        ),
        safeRemoveDirectory(
            job.workDir,
        ),
    ]);
}

async function cleanupExpiredJobs():
Promise<void> {
    const now =
        Date.now();

    for (
        const [
            jobId,
            job,
        ] of aiJobs
    ) {
        if (
            now - job.createdAt
            < AI_JOB_TTL_MS
        ) {
            continue;
        }

        await cleanupJobWorkspace(
            job,
        );

        aiJobs.delete(
            jobId,
        );
    }
}

function isRequestedAiSegment(
    value: unknown,
): value is RequestedAiSegment {
    if (
        typeof value
        !== "object"
        || value === null
    ) {
        return false;
    }

    const item =
        value as Record<
            string,
            unknown
        >;

    return (
        typeof item.id
            === "string"
        && typeof item.start
            === "string"
        && typeof item.end
            === "string"
    );
}

export function registerAiHighlightRoutes(
    app: Express,
    outputDirectory: string,
): void {
    app.post(
        "/api/ai-highlight/jobs",
        upload.single(
            "video",
        ),
        (
            req,
            res,
        ) => {
            if (!req.file) {
                res
                    .status(400)
                    .json({
                        error:
                            "Video file is required.",
                    });

                return;
            }

            const inputVideo =
                req.file.path;

            const jobId =
                randomUUID();

            const workDir =
                `temp/${jobId}`;

            const outputFileName =
                `highlight_${jobId}.mp4`;

            const outputVideo =
                path.join(
                    outputDirectory,
                    outputFileName,
                );

            const job: AiJob = {
                id:
                    jobId,
                status:
                    "queued",
                message:
                    "Preparing AI analysis...",
                inputVideo,
                workDir,
                outputVideo,
                outputFileName,
                createdAt:
                    Date.now(),
            };

            aiJobs.set(
                jobId,
                job,
            );

            res
                .status(202)
                .json({
                    jobId,
                });

            job.status =
                "detecting";

            job.message =
                "Analyzing video and detecting events...";

            void detectAiSegmentsDetailed(
                inputVideo,
            )
                .then(
                    async (
                        candidates,
                    ) => {
                        job.status =
                            "ready";

                        job.message =
                            candidates.length
                            > 0
                                ? (
                                    "AI analysis complete. "
                                    + "Review the detected moments."
                                )
                                : (
                                    "AI analysis complete. "
                                    + "No strong highlight moments were found."
                                );

                        job.candidates =
                            candidates;

                        if (
                            candidates.length
                            === 0
                        ) {
                            await safeRemoveFile(
                                job.inputVideo,
                            );
                        }
                    },
                )
                .catch(
                    async (
                        error:
                            unknown,
                    ) => {
                        job.status =
                            "failed";

                        job.message =
                            "AI analysis failed.";

                        job.error =
                            error
                            instanceof Error
                                ? error.message
                                : "Unknown error";

                        await cleanupJobWorkspace(
                            job,
                        );
                    },
                );
        },
    );

    app.get(
        "/api/ai-highlight/jobs/:jobId",
        (
            req,
            res,
        ) => {
            const job =
                aiJobs.get(
                    req.params
                        .jobId,
                );

            if (!job) {
                res
                    .status(404)
                    .json({
                        error:
                            "AI job not found.",
                    });

                return;
            }

            res.json({
                id:
                    job.id,
                status:
                    job.status,
                message:
                    job.message,
                candidates:
                    job.candidates,
                videoUrl:
                    job.videoUrl,
                segments:
                    job.segments,
                error:
                    job.error,
            });
        },
    );

    app.post(
        "/api/ai-highlight/jobs/:jobId/render",
        async (
            req,
            res,
        ) => {
            const job =
                aiJobs.get(
                    req.params
                        .jobId,
                );

            if (!job) {
                res
                    .status(404)
                    .json({
                        error:
                            "AI job not found.",
                    });

                return;
            }

            if (
                job.status
                !== "ready"
                || !job.candidates
            ) {
                res
                    .status(409)
                    .json({
                        error:
                            "AI detection is not ready.",
                    });

                return;
            }

            const rawSegments:
                unknown =
                req.body
                    ?.segments;

            if (
                !Array.isArray(
                    rawSegments,
                )
                || rawSegments.length
                    === 0
            ) {
                res
                    .status(400)
                    .json({
                        error:
                            "Select at least one highlight.",
                    });

                return;
            }

            const requested:
                RequestedAiSegment[] =
                [];

            for (
                const value
                of rawSegments
            ) {
                if (
                    !isRequestedAiSegment(
                        value,
                    )
                ) {
                    res
                        .status(400)
                        .json({
                            error:
                                "Invalid AI highlight request.",
                        });

                    return;
                }

                requested.push(
                    value,
                );
            }

            const usedIds =
                new Set<string>();

            const segments:
                Segment[] = [];

            for (
                const item
                of requested
            ) {
                if (
                    usedIds.has(
                        item.id,
                    )
                ) {
                    res
                        .status(400)
                        .json({
                            error:
                                "The same AI candidate cannot be selected twice.",
                        });

                    return;
                }

                const candidate =
                    job.candidates
                        .find(
                            (
                                value,
                            ) =>
                                value.id
                                === item.id,
                        );

                if (!candidate) {
                    res
                        .status(400)
                        .json({
                            error:
                                "Invalid AI highlight candidate.",
                        });

                    return;
                }

                if (
                    !TIMESTAMP_PATTERN
                        .test(
                            item.start,
                        )
                    || !TIMESTAMP_PATTERN
                        .test(
                            item.end,
                        )
                ) {
                    res
                        .status(400)
                        .json({
                            error:
                                `Invalid timestamps for ${item.id}. Use M:SS format.`,
                        });

                    return;
                }

                usedIds.add(
                    item.id,
                );

                segments.push({
                    start:
                        item.start,
                    end:
                        item.end,
                });
            }

            job.status =
                "rendering";

            job.message =
                "Creating final highlight video...";

            res
                .status(202)
                .json({
                    jobId:
                        job.id,
                });

            void renderAiHighlight(
                job.inputVideo,
                job.outputVideo,
                job.workDir,
                segments,
            )
                .then(
                    async (
                        result,
                    ) => {
                        job.status =
                            "complete";

                        job.message =
                            "AI highlight complete.";

                        job.videoUrl =
                            `/highlights/${job.outputFileName}`;

                        job.segments =
                            result.segments;

                        await cleanupJobWorkspace(
                            job,
                        );
                    },
                )
                .catch(
                    async (
                        error:
                            unknown,
                    ) => {
                        job.status =
                            "failed";

                        job.message =
                            "Highlight rendering failed.";

                        job.error =
                            error
                            instanceof Error
                                ? error.message
                                : "Unknown error";

                        await cleanupJobWorkspace(
                            job,
                        );
                    },
                );
        },
    );

    const cleanupTimer =
        setInterval(
            () => {
                void cleanupExpiredJobs();
            },
            AI_JOB_CLEANUP_MS,
        );

    cleanupTimer.unref();
}
