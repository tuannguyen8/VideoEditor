import { useRef, useState } from 'react';
import './App.css';
interface Segment {
	start: string;
	end: string;
}

function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

	const [isProcessing, setIsProcessing] = useState(false);

	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const [videoFile, setVideoFile] = useState<File | null>(null);

	const [videoDuration, setVideoDuration] = useState<number | null>(null);

	const [segments, setSegments] = useState<Segment[]>([
		{
			start: '',
			end: '',
		},
	]);

	const [videoUrl, setVideoUrl] = useState<string | null>(null);

	function handleVideoChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0] ?? null;

		setVideoFile(file);
		setVideoDuration(null);

		if (!file) {
			return;
		}

		const objectUrl = URL.createObjectURL(file);

		const video = document.createElement('video');

		video.preload = 'metadata';

		video.onloadedmetadata = () => {
			setVideoDuration(video.duration);

			URL.revokeObjectURL(objectUrl);
		};

		video.src = objectUrl;
	}

	function handleSegmentChange(
		index: number,
		field: 'start' | 'end',
		value: string,
	) {
		const updatedSegments = [...segments];

		updatedSegments[index] = {
			...updatedSegments[index],
			[field]: value,
		};

		setSegments(updatedSegments);
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

	function deleteSegment(index: number) {
		const updatedSegments = segments.filter(
			(_, currentIndex) => currentIndex !== index,
		);

		setSegments(updatedSegments);
	}

  function handleNewHighlight() {
    setVideoFile(null);
    setVideoDuration(null);

    setSegments([
      {
        start: '',
        end: '',
      },
    ]);

    setVideoUrl(null);
    setErrorMessage(null);
    setIsProcessing(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

	async function handleCreateHighlight() {
		if (!videoFile) {
			setErrorMessage('Please select a video first.');
			return;
		}

		// const validationError = validateSegments(segments);
		const validationError = validateSegments(segments, videoDuration);

		if (validationError) {
			setErrorMessage(validationError);
			return;
		}

		const formData = new FormData();

		formData.append('video', videoFile);

		formData.append('segments', JSON.stringify(segments));

		try {
			setIsProcessing(true);

			setErrorMessage(null);

			setVideoUrl(null);

			const response = await fetch('/api/highlights', {
				method: 'POST',
				body: formData,
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Failed to create highlight.');
			}

			setVideoUrl(data.videoUrl);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';

			setErrorMessage(message);
		} finally {
			setIsProcessing(false);
		}
	}

	return (
		<main>
			<h1>Football Highlight Editor</h1>

			<p>
				Upload a football video and choose the segments you want to include in
				your highlight.
			</p>

      <section>
        <h2>1. Upload Video</h2>

        <input
          ref={fileInputRef}
          className="file-input"
          type="file"
          accept="video/*"
          onChange={handleVideoChange}
        />

        {videoFile && (
          <div className="video-info">
            <p>
              <strong>Selected video:</strong> {videoFile.name}
            </p>

            {videoDuration !== null && (
              <p>
                <strong>Duration:</strong>{" "}
                {videoDuration.toFixed(2)} seconds
              </p>
            )}
          </div>
        )}
      </section>

			<section>
				<h2>2. Highlight Segments</h2>

				<div className="segments-list">
					{segments.map((segment, index) => (
						<div className="segment-row" key={index}>
							<span className="segment-label">Segment {index + 1}</span>

							<input
								className="segment-input"
								type="text"
								placeholder="Start (M:SS)"
								value={segment.start}
								onChange={(event) =>
									handleSegmentChange(index, 'start', event.target.value)
								}
							/>

							<input
								className="segment-input"
								type="text"
								placeholder="End (M:SS)"
								value={segment.end}
								onChange={(event) =>
									handleSegmentChange(index, 'end', event.target.value)
								}
							/>

							<button
								className="delete-button"
								type="button"
								onClick={() => deleteSegment(index)}
							>
								Delete
							</button>
						</div>
					))}
				</div>

				<button className="add-button" type="button" onClick={addSegment}>
					+ Add Segment
				</button>
			</section>

      <section>
        <h2>3. Create Highlight</h2>

        <button
          className="create-button"
          type="button"
          onClick={handleCreateHighlight}
          disabled={isProcessing}
        >
          {isProcessing
            ? "Creating Highlight..."
            : "Create Highlight"}
        </button>

        {errorMessage && (
          <p className="error-message">
            Error: {errorMessage}
          </p>
        )}

        {videoUrl && (
          <div className="highlight-result">
            <h3>Your Highlight</h3>

            <video
              className="highlight-video"
              src={videoUrl}
              controls
            />
    
            <a
              className="download-button"
              href={videoUrl}
              download
            >
              Download Highlight
            </a>

            <button
              className="new-highlight-button"
              type="button"
              onClick={handleNewHighlight}
            >
              New Highlight
            </button>

          </div>
        )}
      </section>


		</main>
	);
}

function timeToSeconds(time: string): number | null {
	const parts = time.split(':');

	if (parts.length !== 2) {
		return null;
	}

	const minutes = Number(parts[0]);
	const seconds = Number(parts[1]);

	if (
		!Number.isInteger(minutes) ||
		!Number.isInteger(seconds) ||
		minutes < 0 ||
		seconds < 0 ||
		seconds > 59
	) {
		return null;
	}

	return minutes * 60 + seconds;
}

function validateSegments(
	segments: Segment[],
	videoDuration: number | null,
): string | null {
	if (segments.length === 0) {
		return 'At least one segment is required.';
	}

	if (videoDuration === null) {
		return 'Could not determine video duration.';
	}

	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i];

		const start = timeToSeconds(segment.start);

		const end = timeToSeconds(segment.end);

		if (start === null || end === null) {
			return `Segment ${i + 1}: use the M:SS format.`;
		}

		if (start >= end) {
			return `Segment ${i + 1}: start time must be before end time.`;
		}

		if (start >= videoDuration) {
			return `Segment ${i + 1}: start time is outside the video.`;
		}

		if (end > videoDuration) {
			return `Segment ${i + 1}: end time exceeds the video duration.`;
		}
	}

	return null;
}

export default App;
