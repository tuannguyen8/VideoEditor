import { spawn } from "child_process";
import { mkdir, readFile } from "fs/promises";
import path from "path";

import { createHighlight } from "./highlightService";
import { Segment } from "../types/segment";

interface AiSegment {
    start: string;
    end: string;
    events: string[];
    confidence: number;
}

interface AiDetectionResult {
    video: string;
    segments: AiSegment[];
}

export interface AiDetectedSegment {
    id: string;
    start: string;
    end: string;
    events: string[];
    confidence: number;
}

export interface AiHighlightResult {
    outputPath: string;
    segments: Segment[];
}

const AI_ENVIRONMENT = "videoeditor-ai";

function getPythonCommand(
    detectorPath: string,
    inputVideo: string,
): {
    command: string;
    args: string[];
} {
    const condaPrefix = process.env.CONDA_PREFIX;

    if (condaPrefix) {
        const pythonPath =
            process.platform === "win32"
                ? path.join(condaPrefix, "python.exe")
                : path.join(condaPrefix, "bin", "python");

        return {
            command: pythonPath,
            args: [
                detectorPath,
                inputVideo,
            ],
        };
    }

    const condaExecutable =
        process.env.CONDA_EXE ?? "conda";

    return {
        command: condaExecutable,
        args: [
            "run",
            "--no-capture-output",
            "-n",
            AI_ENVIRONMENT,
            "python",
            detectorPath,
            inputVideo,
        ],
    };
}

function runDetector(
    inputVideo: string,
): Promise<void> {
    const projectRoot = process.cwd();

    const detectorPath = path.join(
        projectRoot,
        "ai",
        "detector.py",
    );

    const {
        command,
        args,
    } = getPythonCommand(
        detectorPath,
        inputVideo,
    );

    return new Promise(
        (
            resolve,
            reject,
        ) => {
            const child = spawn(
                command,
                args,
                {
                    cwd: projectRoot,
                    stdio: "inherit",
                },
            );

            child.on(
                "error",
                (error) => {
                    reject(
                        new Error(
                            "Failed to start AI detector: "
                            + error.message,
                        ),
                    );
                },
            );

            child.on(
                "close",
                (code) => {
                    if (code === 0) {
                        resolve();
                        return;
                    }

                    reject(
                        new Error(
                            "AI detector exited with code "
                            + String(code),
                        ),
                    );
                },
            );
        },
    );
}

async function readAiResult(
    inputVideo: string,
): Promise<AiDetectionResult> {
    const projectRoot = process.cwd();

    const videoName = path.parse(
        inputVideo,
    ).name;

    const resultPath = path.join(
        projectRoot,
        "ai",
        "output",
        `${videoName}_segments.json`,
    );

    const contents = await readFile(
        resultPath,
        "utf-8",
    );

    const result = JSON.parse(
        contents,
    ) as AiDetectionResult;

    if (!Array.isArray(result.segments)) {
        throw new Error(
            "AI detector returned an invalid segment result.",
        );
    }

    return result;
}

export async function detectAiSegmentsDetailed(
    inputVideo: string,
): Promise<AiDetectedSegment[]> {
    await runDetector(
        inputVideo,
    );

    const result = await readAiResult(
        inputVideo,
    );

    return result.segments.map(
        (
            segment,
            index,
        ) => ({
            id: `segment-${index}`,
            start: segment.start,
            end: segment.end,
            events: segment.events,
            confidence: segment.confidence,
        }),
    );
}

export async function renderAiHighlight(
    inputVideo: string,
    outputPath: string,
    workDir: string,
    segments: Segment[],
): Promise<AiHighlightResult> {
    if (segments.length === 0) {
        throw new Error(
            "No highlight segments were selected.",
        );
    }

    await mkdir(
        path.dirname(outputPath),
        {
            recursive: true,
        },
    );

    await createHighlight(
        inputVideo,
        segments,
        outputPath,
        workDir,
    );

    return {
        outputPath,
        segments,
    };
}
