import {
    useEffect,
    useRef,
    useState,
} from 'react';

import './App.css';


interface Segment {
    start: string;
    end: string;
}

interface AiCandidate {
    id: string;
    start: string;
    end: string;
    events: string[];
    confidence: number;
}

type HighlightMode =
    | 'manual'
    | 'ai';

type ProcessingMode =
    | 'manual'
    | 'ai'
    | null;

type AiJobStatus =
    | 'queued'
    | 'detecting'
    | 'ready'
    | 'rendering'
    | 'complete'
    | 'failed';


function App() {
    const [
        jobId,
        setJobId,
    ] = useState<string | null>(
        null,
    );

    const fileInputRef =
        useRef<HTMLInputElement | null>(
            null,
        );

    const videoRef =
        useRef<HTMLVideoElement | null>(
            null,
        );

    const previewEndRef =
        useRef<number | null>(
            null,
        );

    const [
        isProcessing,
        setIsProcessing,
    ] = useState(false);

    const [
        processingMode,
        setProcessingMode,
    ] = useState<ProcessingMode>(
        null,
    );

    const [
        highlightMode,
        setHighlightMode,
    ] = useState<HighlightMode>(
        'manual',
    );

    const [
        errorMessage,
        setErrorMessage,
    ] = useState<string | null>(
        null,
    );

    const [
        successMessage,
        setSuccessMessage,
    ] = useState<string | null>(
        null,
    );

    const [
        videoFile,
        setVideoFile,
    ] = useState<File | null>(
        null,
    );

    const [
        videoDuration,
        setVideoDuration,
    ] = useState<number | null>(
        null,
    );

    const [
        sourceVideoUrl,
        setSourceVideoUrl,
    ] = useState<string | null>(
        null,
    );

    const [
        selectedVideoPath,
        setSelectedVideoPath,
    ] = useState<string | null>(
        null,
    );

    const [
        selectedVideoName,
        setSelectedVideoName,
    ] = useState<string | null>(
        null,
    );

    const [
        segments,
        setSegments,
    ] = useState<Segment[]>([
        {
            start: '',
            end: '',
        },
    ]);

    const [
        videoUrl,
        setVideoUrl,
    ] = useState<string | null>(
        null,
    );

    const [
        ,
        setAiStatus,
    ] = useState<AiJobStatus | null>(
        null,
    );

    const [
        aiStatusMessage,
        setAiStatusMessage,
    ] = useState('');

    const [
        aiCandidates,
        setAiCandidates,
    ] = useState<AiCandidate[]>([]);

    const [
        selectedAiIds,
        setSelectedAiIds,
    ] = useState<string[]>([]);

    const [
        aiJobId,
        setAiJobId,
    ] = useState<string | null>(
        null,
    );


    useEffect(() => {
        return () => {
            if (
                sourceVideoUrl?.startsWith(
                    'blob:',
                )
            ) {
                URL.revokeObjectURL(
                    sourceVideoUrl,
                );
            }
        };
    }, [sourceVideoUrl]);


    async function
    handleDesktopVideoSelect() {
        setSuccessMessage(null);
        setErrorMessage(null);

        if (!window.electronAPI) {
            return;
        }

        const selectedVideo =
            await window.electronAPI
                .selectVideo();

        if (!selectedVideo) {
            return;
        }

        setSelectedVideoPath(
            selectedVideo.filePath,
        );

        setSelectedVideoName(
            selectedVideo.fileName,
        );

        setSourceVideoUrl(
            selectedVideo.fileUrl,
        );

        resetAiReview();

        setVideoDuration(null);
        setErrorMessage(null);
    }


    function handleVideoChange(
        event:
            React.ChangeEvent<
                HTMLInputElement
            >,
    ) {
        setSuccessMessage(null);
        setErrorMessage(null);

        const file =
            event.target.files?.[0]
            ?? null;

        setVideoFile(
            file,
        );

        setSelectedVideoPath(
            null,
        );

        setSelectedVideoName(
            file?.name ?? null,
        );

        setVideoDuration(
            null,
        );

        resetAiReview();

        if (!file) {
            setSourceVideoUrl(
                null,
            );

            return;
        }

        const objectUrl =
            URL.createObjectURL(
                file,
            );

        setSourceVideoUrl(
            objectUrl,
        );

        const video =
            document.createElement(
                'video',
            );

        video.preload =
            'metadata';

        video.src =
            objectUrl;

        video.onloadedmetadata =
            () => {
                setVideoDuration(
                    video.duration,
                );
            };

        video.onerror =
            () => {
                setErrorMessage(
                    'Could not read '
                    + 'the selected video.',
                );
            };
    }


    function resetAiReview() {
        setAiStatus(null);
        setAiStatusMessage('');
        setAiCandidates([]);
        setSelectedAiIds([]);
        setAiJobId(null);
        previewEndRef.current =
            null;
    }


    function handleSegmentChange(
        index: number,
        field:
            | 'start'
            | 'end',
        value: string,
    ) {
        const updatedSegments =
            [...segments];

        updatedSegments[index] = {
            ...updatedSegments[index],
            [field]: value,
        };

        setSegments(
            updatedSegments,
        );
    }


    function addSegment() {
        setSegments([
            ...segments,
            {
                start: '',
                end: '',
            },
        ]);
    }


    function deleteSegment(
        index: number,
    ) {
        const updatedSegments =
            segments.filter(
                (
                    _,
                    currentIndex,
                ) =>
                    currentIndex
                    !== index,
            );

        setSegments(
            updatedSegments,
        );
    }


    function updateAiCandidateTime(
        id: string,
        field:
            | 'start'
            | 'end',
        value: string,
    ) {
        setAiCandidates(
            (current) =>
                current.map(
                    (candidate) =>
                        candidate.id
                        === id
                            ? {
                                ...candidate,
                                [field]:
                                    value,
                            }
                            : candidate,
                ),
        );
    }


    function previewAiCandidate(
        candidate:
            AiCandidate,
    ) {
        const video =
            videoRef.current;

        if (!video) {
            return;
        }

        const start =
            timeToSeconds(
                candidate.start,
            );

        const end =
            timeToSeconds(
                candidate.end,
            );

        if (
            start === null
            || end === null
            || start >= end
        ) {
            setErrorMessage(
                'Enter valid start '
                + 'and end times '
                + 'before previewing.',
            );

            return;
        }

        setErrorMessage(
            null,
        );

        previewEndRef.current =
            end;

        video.currentTime =
            start;

        void video.play();
    }


    async function
    handleNewHighlight() {
        if (jobId) {
            try {
                const response =
                    await fetch(
                        `/api/highlights/${jobId}`,
                        {
                            method:
                                'DELETE',
                        },
                    );

                if (
                    !response.ok
                ) {
                    const data =
                        await response
                            .json();

                    console.error(
                        'Failed to delete '
                        + 'old highlight:',
                        data.message,
                    );
                }
            } catch (error) {
                console.error(
                    'Failed to delete '
                    + 'old highlight:',
                    error,
                );
            }
        }

        setVideoFile(null);
        setSelectedVideoPath(null);
        setSelectedVideoName(null);
        setVideoDuration(null);

        setSegments([
            {
                start: '',
                end: '',
            },
        ]);

        setVideoUrl(null);
        setJobId(null);
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsProcessing(false);
        setProcessingMode(null);
        setHighlightMode('manual');

        resetAiReview();

        if (
            fileInputRef.current
        ) {
            fileInputRef.current
                .value = '';
        }
    }


    async function
    handleCreateHighlight() {
        if (
            !videoFile
            && !selectedVideoPath
        ) {
            setErrorMessage(
                'Please select '
                + 'a video.',
            );

            return;
        }

        const validationError =
            validateSegments(
                segments,
                videoDuration,
            );

        if (validationError) {
            setErrorMessage(
                validationError,
            );

            return;
        }

        setErrorMessage(null);
        setSuccessMessage(null);

        if (
            window.electronAPI
            && selectedVideoPath
        ) {
            try {
                const outputPath =
                    await window
                        .electronAPI
                        .selectSaveLocation();

                if (!outputPath) {
                    return;
                }

                setIsProcessing(
                    true,
                );

                setProcessingMode(
                    'manual',
                );

                setVideoUrl(
                    null,
                );

                const result =
                    await window
                        .electronAPI
                        .createHighlight(
                            selectedVideoPath,
                            segments,
                            outputPath,
                        );

                setVideoUrl(
                    result.videoUrl,
                );

                setSuccessMessage(
                    'Highlight created '
                    + 'successfully.',
                );

                setJobId(
                    null,
                );
            } catch (error) {
                const message =
                    error
                    instanceof Error
                        ? error.message
                        : 'Failed to create '
                            + 'highlight.';

                setErrorMessage(
                    message,
                );
            } finally {
                setIsProcessing(
                    false,
                );

                setProcessingMode(
                    null,
                );
            }

            return;
        }

        if (!videoFile) {
            setErrorMessage(
                'Please select '
                + 'a video.',
            );

            return;
        }

        const formData =
            new FormData();

        formData.append(
            'video',
            videoFile,
        );

        formData.append(
            'segments',
            JSON.stringify(
                segments,
            ),
        );

        try {
            setIsProcessing(
                true,
            );

            setProcessingMode(
                'manual',
            );

            setVideoUrl(
                null,
            );

            const response =
                await fetch(
                    '/api/highlights',
                    {
                        method:
                            'POST',
                        body:
                            formData,
                    },
                );

            const data =
                await response
                    .json();

            if (!response.ok) {
                throw new Error(
                    data.message
                    || 'Failed to create '
                        + 'highlight.',
                );
            }

            setVideoUrl(
                data.videoUrl,
            );

            setJobId(
                data.jobId,
            );

            setSuccessMessage(
                'Highlight created '
                + 'successfully.',
            );
        } catch (error) {
            const message =
                error
                instanceof Error
                    ? error.message
                    : 'Unknown error';

            setSuccessMessage(
                null,
            );

            setErrorMessage(
                message,
            );
        } finally {
            setIsProcessing(
                false,
            );

            setProcessingMode(
                null,
            );
        }
    }


    async function waitForAiJob(
        targetJobId: string,
        targetStatus:
            | 'ready'
            | 'complete',
    ) {
        while (true) {
            const response =
                await fetch(
                    '/api/ai-highlight/jobs/'
                    + targetJobId,
                );

            const job =
                await response
                    .json();

            if (!response.ok) {
                throw new Error(
                    job.error
                    ?? 'Failed to check '
                        + 'AI job.',
                );
            }

            setAiStatus(
                job.status,
            );

            setAiStatusMessage(
                job.message,
            );

            if (
                job.status
                === targetStatus
            ) {
                return job;
            }

            if (
                job.status
                === 'failed'
            ) {
                throw new Error(
                    job.error
                    ?? 'AI processing '
                        + 'failed.',
                );
            }

            await new Promise(
                (resolve) =>
                    setTimeout(
                        resolve,
                        1000,
                    ),
            );
        }
    }


    async function
    handleAnalyzeAi() {
        if (!videoFile) {
            setErrorMessage(
                'Choose a video '
                + 'in the web app '
                + 'before running AI.',
            );

            return;
        }

        try {
            setIsProcessing(
                true,
            );

            setProcessingMode(
                'ai',
            );

            setErrorMessage(
                null,
            );

            setSuccessMessage(
                null,
            );

            setVideoUrl(
                null,
            );

            resetAiReview();

            setAiStatus(
                'queued',
            );

            setAiStatusMessage(
                'Preparing AI '
                + 'analysis...',
            );

            const formData =
                new FormData();

            formData.append(
                'video',
                videoFile,
            );

            const response =
                await fetch(
                    '/api/ai-highlight/jobs',
                    {
                        method:
                            'POST',
                        body:
                            formData,
                    },
                );

            const data =
                await response
                    .json();

            if (!response.ok) {
                throw new Error(
                    data.error
                    ?? 'Failed to start '
                        + 'AI analysis.',
                );
            }

            setAiJobId(
                data.jobId,
            );

            const job =
                await waitForAiJob(
                    data.jobId,
                    'ready',
                );

            const candidates:
                AiCandidate[] =
                job.candidates
                ?? [];

            setAiCandidates(
                candidates,
            );

            setSelectedAiIds(
                candidates.map(
                    (candidate) =>
                        candidate.id,
                ),
            );

            setSuccessMessage(
                candidates.length > 0
                    ? 'AI analysis complete. '
                        + 'Review the '
                        + 'detected moments.'
                    : 'AI analysis complete. '
                        + 'No highlight '
                        + 'moments were found.',
            );
        } catch (error) {
            const message =
                error
                instanceof Error
                    ? error.message
                    : 'AI analysis failed.';

            setAiStatus(
                'failed',
            );

            setErrorMessage(
                message,
            );
        } finally {
            setIsProcessing(
                false,
            );

            setProcessingMode(
                null,
            );
        }
    }


    async function
    handleRenderAiHighlight() {
        if (!aiJobId) {
            setErrorMessage(
                'Run AI analysis first.',
            );

            return;
        }

        const selectedSegments =
            aiCandidates.filter(
                (candidate) =>
                    selectedAiIds
                        .includes(
                            candidate.id,
                        ),
            );

        if (
            selectedSegments.length
            === 0
        ) {
            setErrorMessage(
                'Select at least '
                + 'one highlight.',
            );

            return;
        }

        const validationError =
            validateSegments(
                selectedSegments.map(
                    (candidate) => ({
                        start:
                            candidate.start,
                        end:
                            candidate.end,
                    }),
                ),
                videoDuration,
            );

        if (validationError) {
            setErrorMessage(
                validationError,
            );

            return;
        }

        try {
            setIsProcessing(
                true,
            );

            setProcessingMode(
                'ai',
            );

            setErrorMessage(
                null,
            );

            setSuccessMessage(
                null,
            );

            const response =
                await fetch(
                    '/api/ai-highlight/jobs/'
                    + aiJobId
                    + '/render',
                    {
                        method:
                            'POST',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body:
                            JSON.stringify({
                                segments:
                                    selectedSegments
                                        .map(
                                            (
                                                candidate,
                                            ) => ({
                                                id:
                                                    candidate.id,
                                                start:
                                                    candidate.start,
                                                end:
                                                    candidate.end,
                                            }),
                                        ),
                            }),
                    },
                );

            const data =
                await response
                    .json();

            if (!response.ok) {
                throw new Error(
                    data.error
                    ?? 'Failed to render '
                        + 'AI highlight.',
                );
            }

            const job =
                await waitForAiJob(
                    aiJobId,
                    'complete',
                );

            setVideoUrl(
                job.videoUrl,
            );

            setSuccessMessage(
                'AI highlight created '
                + 'successfully.',
            );
        } catch (error) {
            const message =
                error
                instanceof Error
                    ? error.message
                    : 'AI highlight '
                        + 'failed.';

            setErrorMessage(
                message,
            );
        } finally {
            setIsProcessing(
                false,
            );

            setProcessingMode(
                null,
            );
        }
    }


    return (
        <main>
            <h1>
                Football Highlight
                Editor
            </h1>

            <p>
                Upload a football video
                and create highlights
                manually or with AI.
            </p>

            <section>
                <h2>
                    1. Upload Video
                </h2>

                {window.electronAPI ? (
                    <button
                        type="button"
                        className=
                            "desktop-file-button"
                        onClick={
                            handleDesktopVideoSelect
                        }
                    >
                        Choose File
                    </button>
                ) : (
                    <input
                        ref={
                            fileInputRef
                        }
                        className=
                            "file-input"
                        type="file"
                        accept="video/*"
                        onChange={
                            handleVideoChange
                        }
                    />
                )}

                {(
                    selectedVideoName
                    || videoFile
                ) && (
                    <div
                        className=
                            "video-info"
                    >
                        <p>
                            <strong>
                                Selected
                                video:
                            </strong>{' '}
                            {
                                selectedVideoName
                                ?? videoFile
                                    ?.name
                            }
                        </p>

                        {
                            videoDuration
                            !== null
                            && (
                                <p>
                                    <strong>
                                        Duration:
                                    </strong>{' '}
                                    {
                                        videoDuration
                                            .toFixed(
                                                2,
                                            )
                                    }
                                    {
                                        ' seconds'
                                    }
                                </p>
                            )
                        }
                    </div>
                )}

                {sourceVideoUrl && (
                    <div
                        className=
                            "source-video-container"
                    >
                        <h3>
                            Original Video
                        </h3>

                        <video
                            ref={
                                videoRef
                            }
                            className=
                                "source-video"
                            src={
                                sourceVideoUrl
                            }
                            controls
                            onLoadedMetadata={
                                (
                                    event,
                                ) => {
                                    setVideoDuration(
                                        event
                                            .currentTarget
                                            .duration,
                                    );
                                }
                            }
                            onTimeUpdate={() => {
                                const video =
                                    videoRef
                                        .current;

                                const previewEnd =
                                    previewEndRef
                                        .current;

                                if (
                                    !video
                                    || previewEnd
                                        === null
                                ) {
                                    return;
                                }

                                if (
                                    video.currentTime
                                    >= previewEnd
                                ) {
                                    video.pause();

                                    previewEndRef
                                        .current =
                                        null;
                                }
                            }}
                        />
                    </div>
                )}
            </section>

            <section>
                <h2>
                    2. Highlight Mode
                </h2>

                <div
                    className=
                        "highlight-mode-selector"
                >
                    <button
                        type="button"
                        disabled={
                            isProcessing
                        }
                        className={
                            highlightMode
                            === 'manual'
                                ? 'active'
                                : ''
                        }
                        onClick={() =>
                            setHighlightMode(
                                'manual',
                            )
                        }
                    >
                        Manual
                    </button>

                    <button
                        type="button"
                        disabled={
                            isProcessing
                        }
                        className={
                            highlightMode
                            === 'ai'
                                ? 'active'
                                : ''
                        }
                        onClick={() =>
                            setHighlightMode(
                                'ai',
                            )
                        }
                    >
                        AI Highlight
                    </button>
                </div>
            </section>

            {highlightMode
            === 'manual' ? (
                <section>
                    <h2>
                        3. Highlight
                        Segments
                    </h2>

                    <div
                        className=
                            "segments-list"
                    >
                        {segments.map(
                            (
                                segment,
                                index,
                            ) => (
                                <div
                                    className=
                                        "segment-row"
                                    key={
                                        index
                                    }
                                >
                                    <span
                                        className=
                                            "segment-label"
                                    >
                                        Segment{' '}
                                        {
                                            index
                                            + 1
                                        }
                                    </span>

                                    <input
                                        className=
                                            "segment-input"
                                        type="text"
                                        placeholder=
                                            "Start (M:SS)"
                                        value={
                                            segment.start
                                        }
                                        onChange={
                                            (
                                                event,
                                            ) =>
                                                handleSegmentChange(
                                                    index,
                                                    'start',
                                                    event
                                                        .target
                                                        .value,
                                                )
                                        }
                                    />

                                    <input
                                        className=
                                            "segment-input"
                                        type="text"
                                        placeholder=
                                            "End (M:SS)"
                                        value={
                                            segment.end
                                        }
                                        onChange={
                                            (
                                                event,
                                            ) =>
                                                handleSegmentChange(
                                                    index,
                                                    'end',
                                                    event
                                                        .target
                                                        .value,
                                                )
                                        }
                                    />

                                    <button
                                        className=
                                            "delete-button"
                                        type="button"
                                        onClick={() =>
                                            deleteSegment(
                                                index,
                                            )
                                        }
                                    >
                                        Delete
                                    </button>
                                </div>
                            ),
                        )}
                    </div>

                    <button
                        className=
                            "add-button"
                        type="button"
                        onClick={
                            addSegment
                        }
                    >
                        + Add Segment
                    </button>
                </section>
            ) : (
                <section>
                    <h2>
                        3. AI Analysis
                    </h2>

                    <p>
                        AI will look for
                        shots, crosses,
                        headers, free
                        kicks, and goals.
                    </p>

                    {aiCandidates
                        .length
                    === 0 && (
                        <button
                            className=
                                "create-button"
                            type="button"
                            disabled={
                                isProcessing
                                || !videoFile
                            }
                            onClick={
                                handleAnalyzeAi
                            }
                        >
                            {
                                processingMode
                                === 'ai'
                                    ? 'Analyzing video...'
                                    : 'Analyze with AI'
                            }
                        </button>
                    )}

                    {
                        processingMode
                        === 'ai'
                        && aiStatusMessage
                        && (
                            <p
                                className=
                                    "processing-message"
                            >
                                {
                                    aiStatusMessage
                                }
                            </p>
                        )
                    }

                    {
                        aiCandidates.length
                        > 0
                        && (
                            <div
                                className=
                                    "ai-candidates"
                            >
                                <h3>
                                    Detected
                                    moments
                                </h3>

                                <p>
                                    Preview,
                                    edit, and
                                    choose the
                                    moments to
                                    keep.
                                </p>

                                {aiCandidates
                                    .map(
                                        (
                                            candidate,
                                        ) => {
                                            const selected =
                                                selectedAiIds
                                                    .includes(
                                                        candidate.id,
                                                    );

                                            return (
                                                <div
                                                    key={
                                                        candidate.id
                                                    }
                                                    className=
                                                        "ai-candidate"
                                                >
                                                    <input
                                                        type=
                                                            "checkbox"
                                                        checked={
                                                            selected
                                                        }
                                                        onChange={() => {
                                                            setSelectedAiIds(
                                                                (
                                                                    current,
                                                                ) =>
                                                                    selected
                                                                        ? current.filter(
                                                                            (
                                                                                id,
                                                                            ) =>
                                                                                id
                                                                                !== candidate.id,
                                                                        )
                                                                        : [
                                                                            ...current,
                                                                            candidate.id,
                                                                        ],
                                                            );
                                                        }}
                                                    />

                                                    <div
                                                        className=
                                                            "ai-candidate-time"
                                                    >
                                                        <input
                                                            type="text"
                                                            value={
                                                                candidate.start
                                                            }
                                                            aria-label=
                                                                "Highlight start time"
                                                            onChange={
                                                                (
                                                                    event,
                                                                ) =>
                                                                    updateAiCandidateTime(
                                                                        candidate.id,
                                                                        'start',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                            }
                                                        />

                                                        <span>
                                                            →
                                                        </span>

                                                        <input
                                                            type="text"
                                                            value={
                                                                candidate.end
                                                            }
                                                            aria-label=
                                                                "Highlight end time"
                                                            onChange={
                                                                (
                                                                    event,
                                                                ) =>
                                                                    updateAiCandidateTime(
                                                                        candidate.id,
                                                                        'end',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                            }
                                                        />
                                                    </div>

                                                    <span>
                                                        {
                                                            candidate.events
                                                                .join(
                                                                    ', ',
                                                                )
                                                        }
                                                    </span>

                                                    <span>
                                                        {
                                                            Math.round(
                                                                candidate.confidence
                                                                * 100,
                                                            )
                                                        }
                                                        %
                                                    </span>

                                                    <button
                                                        type=
                                                            "button"
                                                        onClick={() =>
                                                            previewAiCandidate(
                                                                candidate,
                                                            )
                                                        }
                                                    >
                                                        Preview
                                                    </button>
                                                </div>
                                            );
                                        },
                                    )}

                                <button
                                    className=
                                        "create-button"
                                    type="button"
                                    disabled={
                                        isProcessing
                                        || selectedAiIds
                                            .length
                                            === 0
                                    }
                                    onClick={
                                        handleRenderAiHighlight
                                    }
                                >
                                    {
                                        processingMode
                                        === 'ai'
                                            ? 'Creating highlight...'
                                            : `Create Highlight (${selectedAiIds.length})`
                                    }
                                </button>
                            </div>
                        )
                    }
                </section>
            )}

            {highlightMode
            === 'manual' && (
                <section>
                    <h2>
                        4. Create
                        Highlight
                    </h2>

                    <button
                        className=
                            "create-button"
                        type="button"
                        onClick={
                            handleCreateHighlight
                        }
                        disabled={
                            isProcessing
                        }
                    >
                        {
                            processingMode
                            === 'manual'
                                ? 'Creating Highlight...'
                                : 'Create Highlight'
                        }
                    </button>
                </section>
            )}

            <section>
                {
                    errorMessage
                    && (
                        <p
                            className=
                                "error-message"
                        >
                            Error:{' '}
                            {
                                errorMessage
                            }
                        </p>
                    )
                }

                {
                    successMessage
                    && (
                        <p
                            className=
                                "success-message"
                        >
                            {
                                successMessage
                            }
                        </p>
                    )
                }

                {videoUrl && (
                    <div
                        className=
                            "highlight-result"
                    >
                        <h3>
                            Your Highlight
                        </h3>

                        <video
                            className=
                                "highlight-video"
                            src={
                                videoUrl
                            }
                            controls
                        />

                        <a
                            className=
                                "download-button"
                            href={
                                videoUrl
                            }
                            download
                        >
                            Download
                            Highlight
                        </a>

                        <button
                            className=
                                "new-highlight-button"
                            type="button"
                            onClick={
                                handleNewHighlight
                            }
                        >
                            New Highlight
                        </button>
                    </div>
                )}
            </section>
        </main>
    );
}


function timeToSeconds(
    time: string,
): number | null {
    const parts =
        time.split(':');

    if (
        parts.length !== 2
    ) {
        return null;
    }

    const minutes =
        Number(
            parts[0],
        );

    const seconds =
        Number(
            parts[1],
        );

    if (
        !Number.isInteger(
            minutes,
        )
        || !Number.isInteger(
            seconds,
        )
        || minutes < 0
        || seconds < 0
        || seconds > 59
    ) {
        return null;
    }

    return (
        minutes * 60
        + seconds
    );
}


function validateSegments(
    segments: Segment[],
    videoDuration:
        number | null,
): string | null {
    if (
        segments.length === 0
    ) {
        return (
            'At least one '
            + 'segment is required.'
        );
    }

    if (
        videoDuration === null
    ) {
        return (
            'Could not determine '
            + 'video duration.'
        );
    }

    for (
        let i = 0;
        i < segments.length;
        i++
    ) {
        const segment =
            segments[i];

        const start =
            timeToSeconds(
                segment.start,
            );

        const end =
            timeToSeconds(
                segment.end,
            );

        if (
            start === null
            || end === null
        ) {
            return (
                `Segment ${i + 1}: `
                + 'use the M:SS '
                + 'format.'
            );
        }

        if (
            start >= end
        ) {
            return (
                `Segment ${i + 1}: `
                + 'start time must '
                + 'be before end time.'
            );
        }

        if (
            start
            >= videoDuration
        ) {
            return (
                `Segment ${i + 1}: `
                + 'start time is '
                + 'outside the video.'
            );
        }

        if (
            end
            > videoDuration
        ) {
            return (
                `Segment ${i + 1}: `
                + 'end time exceeds '
                + 'the video duration.'
            );
        }
    }

    return null;
}


export default App;
