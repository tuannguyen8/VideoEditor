import { useState } from 'react';

interface Segment {
	start: string;
	end: string;
}

function App() {
	const [videoFile, setVideoFile] = useState<File | null>(null);

	const [segments, setSegments] = useState<Segment[]>([
		{
			start: '',
			end: '',
		},
	]);

  const [videoUrl, setVideoUrl] =
  useState<string | null>(null);

	function handleVideoChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0] ?? null;

		setVideoFile(file);
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

  async function handleCreateHighlight() {
    if (!videoFile) {
      console.log("No video selected");
      return;
    }

    const formData = new FormData();

    formData.append(
      "video",
      videoFile
    );

    formData.append(
      "segments",
      JSON.stringify(segments)
    );

  try {
    const response = await fetch(
      "/api/highlights",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    console.log("Response:", data);

    if (data.status === "success") {
      setVideoUrl(data.videoUrl);
    }

  } catch (error) {
    console.error(
      "Failed to create highlight:",
      error
    );
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

				<input type="file" accept="video/*" onChange={handleVideoChange} />

				{videoFile && <p>Selected video: {videoFile.name}</p>}
			</section>

			<section>
				<h2>2. Highlight Segments</h2>

				{segments.map((segment, index) => (
					<div key={index}>
						<span>Segment {index + 1}</span>

						<input
							type="text"
							placeholder="Start (M:SS)"
							value={segment.start}
							onChange={(event) =>
								handleSegmentChange(index, 'start', event.target.value)
							}
						/>

						<input
							type="text"
							placeholder="End (M:SS)"
							value={segment.end}
							onChange={(event) =>
								handleSegmentChange(index, 'end', event.target.value)
							}
						/>

						<button type="button" onClick={() => deleteSegment(index)}>
							Delete
						</button>
					</div>
				))}

				<button type="button" onClick={addSegment}>
					Add Segment
				</button>
			</section>

			<section>
				<h2>3. Create Highlight</h2>

				<button
					type="button"
					onClick={handleCreateHighlight}
				>
					Create Highlight
				</button>

        {videoUrl && (
          <div>
            <h3>Your Highlight</h3>

            <video
              src={videoUrl}
              controls
              width="720"
            />
          </div>
        )}
        
			</section>
		</main>
	);
}

export default App;
