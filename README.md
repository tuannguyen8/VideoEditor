# Video Highlight Editor

A video editing application for creating football highlights from selected sections of a match.

## About

Video Highlight Editor allows users to upload a football video, preview the original footage, enter one or more timestamp ranges, and generate a single highlight video from those selected segments.

The application uses FFmpeg to cut and merge video segments using stream copy, prioritizing fast processing and preserving the original video quality.

The current version is a web-based MVP. A desktop version using Electron is planned as the next major stage of development.

## Current Features

- Upload a football match video
- Preview the original video in the browser
- Add multiple highlight segments
- Enter custom start and end timestamps
- Validate timestamp ranges before processing
- Cut video segments with FFmpeg
- Merge multiple segments into one highlight video
- Preserve video quality using FFmpeg stream copy
- Preview the generated highlight
- Download the final highlight video
- Automatically clean up uploaded and temporary files
- Automatically remove expired highlight files
- Validate uploaded video file types
- Handle invalid segment data and upload errors
- Automated backend and API tests

## Tech Stack

### Frontend

- React
- TypeScript
- Vite

### Backend

- Node.js
- Express
- TypeScript

### Video Processing

- FFmpeg
- ffprobe

### Testing

- Vitest
- Supertest

## Requirements

Before running the project, make sure the following are installed:

- Node.js
- npm
- FFmpeg
- ffprobe

FFmpeg and ffprobe must be available from the command line.

You can verify them with:

```bash
node --version
npm --version
ffmpeg -version
ffprobe -version
```

## Installation

Clone the repository:

```bash
git clone https://github.com/tuannguyen8/VideoEditor.git
```

Move into the project directory:

```bash
cd VideoEditor
```

Install backend dependencies:

```bash
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

## Environment Setup

Create a local `.env` file based on `.env.example`.

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Or create `.env` manually and copy the values from `.env.example`.

Example:

```env
PORT=3000
HIGHLIGHT_TTL_MINUTES=60
CLEANUP_INTERVAL_MINUTES=10
MAX_UPLOAD_MB=4096
```

### Environment Variables

`PORT`

The port used by the Express server.

Example:

```env
PORT=3000
```

`HIGHLIGHT_TTL_MINUTES`

The amount of time a generated highlight can remain in the output directory before automatic cleanup.

Example:

```env
HIGHLIGHT_TTL_MINUTES=60
```

`CLEANUP_INTERVAL_MINUTES`

How often the server checks for expired highlight files.

Example:

```env
CLEANUP_INTERVAL_MINUTES=10
```

`MAX_UPLOAD_MB`

Maximum video upload size in megabytes for the current web version.

Example:

```env
MAX_UPLOAD_MB=4096
```

The `.env` file is ignored by Git and should not be committed.

## Development

The application currently consists of a React frontend and an Express backend.

### Start the Backend

From the project root:

```bash
npm run build:backend
npm start
```

The backend runs by default at:

```text
http://localhost:3000
```

### Start the Frontend Development Server

Open another terminal:

```bash
cd frontend
npm run dev
```

The Vite development server normally runs at:

```text
http://localhost:5173
```

During development, Vite proxies API and highlight requests to the Express backend.

## Production Build

Build both the backend and frontend:

```bash
npm run build
```

Then start the application:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

In production mode, Express serves the compiled React frontend, so a separate Vite development server is not required.

## Running Tests

Run the automated test suite:

```bash
npm test
```

The tests currently cover areas including:

- Timestamp conversion
- Segment validation
- Segment input validation
- API health checks
- Invalid upload handling
- Missing video handling
- Missing segment handling
- Invalid JSON handling
- Uploaded-file cleanup
- Expired highlight cleanup

## How to Use

1. Start the application.
2. Open the application in your browser.
3. Select a football video from your computer.
4. Preview the original video.
5. Enter the start and end timestamps for each highlight segment.
6. Add additional segments if needed.
7. Click **Create Highlight**.
8. Wait for FFmpeg to process and merge the selected segments.
9. Preview the generated highlight.
10. Download the final video.

## Timestamp Format

The current version uses:

```text
M:SS
```

Examples:

```text
0:20
5:35
45:10
93:30
```

Minutes are not limited to `59`.

For example:

```text
93:30
```

means:

```text
1 hour, 33 minutes, 30 seconds
```

Support for `H:MM:SS`, such as:

```text
1:33:30
```

may be added later.

## Video Processing

The application currently uses FFmpeg stream copy:

```text
-c copy
```

This avoids re-encoding the video and provides two major advantages:

- Faster processing
- Preservation of the original video quality

Because stream copy depends on video keyframes, segment boundaries may not always be frame-perfect.

For the current use case, processing speed and original video quality are prioritized over exact frame-level cutting.

## Project Structure

A simplified project structure looks like:

```text
VideoEditor/
├── frontend/
│   ├── src/
│   └── dist/
│
├── src/
│   ├── config/
│   ├── middleware/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── validators/
│   ├── app.ts
│   └── server.ts
│
├── tests/
├── input/
├── output/
├── temp/
├── .env.example
├── package.json
└── README.md
```

The `input`, `output`, and `temp` directories contain runtime video data and are not intended to be committed to Git.

## Current Limitations

The current web MVP has several known limitations:

- Timestamp input currently supports `M:SS`, not `H:MM:SS`.
- Large videos must currently be uploaded through the browser to the Express backend.
- The backend temporarily stores uploaded videos while processing.
- Stream-copy cuts may start or end slightly away from the requested timestamp because of video keyframes.
- FFmpeg must currently be installed separately on the user's machine.

These limitations are acceptable for the current MVP and may be improved in later development stages.

## Roadmap

### Desktop Application

The next major goal is to convert the project into a desktop application using Electron.

The desktop version is expected to:

- Reuse the existing React interface
- Allow users to select local video files
- Access the original video directly from its file path
- Avoid uploading and copying multi-gigabyte videos through HTTP
- Process videos locally using FFmpeg
- Save generated highlights directly to the user's computer
- Eventually package the application as a Windows executable

### Future Improvements

Possible future improvements include:

- Support for `H:MM:SS` timestamps
- Improved segment editing UX
- Improved error reporting
- Additional video format compatibility
- Desktop FFmpeg packaging
- Progress indication while processing large videos
- Automatic highlight generation
- Player detection and tracking
- Jersey number or player recognition
- Automatic identification of moments involving a selected player

## Project Status

The manual highlight editing workflow is currently functional as a web MVP.

The next development stage will focus on converting the application into a desktop application while keeping the existing video-processing functionality stable.