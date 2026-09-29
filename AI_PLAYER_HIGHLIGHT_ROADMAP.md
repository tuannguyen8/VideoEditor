# AI Player Highlight Development Roadmap

## Purpose

This document defines the AI development plan for the **Football Highlight Editor**.

The goal is not to create highlights only from goals, shots, crosses, or other dangerous events. The goal is:

> Given a football match video and a selected target player, automatically find the situations in which that player is involved with the ball, convert those situations into video segments, and reuse the existing FFmpeg pipeline to create a player-specific highlight.

This file is intended to be committed to GitHub before AI development begins so the project has a clear technical direction and a checkpoint that can be revisited later.

---

## Product Goal

The current manual web workflow already works:

```text
Upload football video
        ↓
Preview video
        ↓
Enter manual start/end timestamps
        ↓
Validate segments
        ↓
FFmpeg cuts and merges clips
        ↓
Preview/download highlight
```

The AI system should **reuse this existing video-processing pipeline**.

The AI system's job is to decide:

```text
Which parts of the video should become highlight segments?
```

The target workflow is:

```text
Upload football match
        ↓
Detect players
        ↓
Track players over time
        ↓
User selects one target player
        ↓
Detect and track the ball
        ↓
Determine when the target player
is involved in the football situation
        ↓
Find situation start/end
        ↓
Add padding before/after
        ↓
Merge nearby/overlapping situations
        ↓
Generate highlight segments
        ↓
Existing FFmpeg pipeline
        ↓
Player Highlight
```

---

## Definition of Target Player Involvement

For this project, a player is considered involved when the target player performs or closely participates in actions such as:

- receiving the ball
- passing
- shooting
- dribbling
- heading
- tackling
- intercepting
- challenging for the ball
- running very close to the ball during an active play
- otherwise directly participating in a ball-related situation

The player does not have to physically touch the ball in every case.

The core concept will therefore be called:

> **Target Player Involvement**

rather than only:

> Ball Touch Detection

---

## Situation Boundaries

The AI should eventually determine:

```text
Situation start
        ↓
Target player involvement
        ↓
Situation end
```

The first version will add:

```text
5 seconds before the detected situation start
5 seconds after the detected situation end
```

Example:

```text
Detected situation:
01:20 → 01:31

Final highlight segment:
01:15 → 01:36
```

Later, the user should be able to configure these values.

---

# Initial MVP Scope

The first AI MVP will deliberately be small.

## Input

- one football clip
- approximately 1–5 minutes long
- one target player
- target player selected manually by the user

## Initial Target Selection

Preferred MVP approach:

```text
Show a video frame
        ↓
User clicks the target player
        ↓
App identifies the player's bounding box / track
        ↓
AI follows that player
```

This is preferred initially over face recognition.

Optional future information may include:

- jersey number
- team
- shirt color
- reference images
- player name

## Long-Term Target Selection

Eventually:

```text
Upload match
        ↓
AI detects all players
        ↓
AI tracks and groups them
        ↓
App presents available players
        ↓
User selects one player
        ↓
Generate player highlight
```

Future improvements may include team classification, jersey recognition, player re-identification, roster matching, and automatic player naming.

---

# Technology Stack

## Existing Application

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

## AI Stack

### Python
Recommended:

```text
Python 3.11 or 3.12
```

Python will be used for the computer-vision pipeline.

### Ultralytics YOLO

**Initial detector choice: YOLO / Ultralytics**

YOLO will be used first because it supports rapid experimentation with:

- player detection
- ball detection
- tracking integration
- custom model fine-tuning

The rest of the AI pipeline should not be tightly coupled to YOLO.

Concept:

```text
Detector Interface
       ↓
YOLO Detector   ← initial implementation
       ↓
Detections
```

A future detector such as RT-DETRv2 could replace YOLO without rewriting the rest of the system.

**Licensing note:** Ultralytics licensing should be reviewed before distributing a closed-source or commercial version. For the current research/MVP phase, YOLO is selected because development speed is the priority.

### PyTorch
Used for model inference, fine-tuning, tensor operations, and GPU acceleration.

### OpenCV
Used for reading video frames, resizing, preprocessing, visualization, bounding boxes, and frame/time conversion.

### NumPy
Used for coordinates, distances, trajectories, geometry, and numerical calculations.

### ByteTrack

**Initial tracker choice: ByteTrack**

Used for player IDs and object tracking across frames.

A future alternative such as BoT-SORT may be evaluated if stronger re-identification is needed.

---

# Initial Architecture

```text
React Web App
      ↓
Express / Node.js
      ↓
Python AI Pipeline
      │
      ├── YOLO Player Detection
      ├── ByteTrack Player Tracking
      ├── Target Player Selection
      ├── YOLO Ball Detection
      ├── Ball Tracking
      └── Player Involvement Logic
      ↓
Situation Segments
      ↓
Existing Validation
      ↓
Existing FFmpeg Highlight Pipeline
      ↓
Player Highlight
```

---

# Suggested AI Folder Structure

```text
ai/
├── detector.py
├── player_detector.py
├── ball_detector.py
├── tracker.py
├── involvement.py
├── segment_builder.py
├── types.py
├── config.py
├── requirements.txt
├── README.md
├── data/
│   ├── samples/
│   └── annotations/
├── outputs/
└── tests/
```

The AI code should remain separated from `frontend/`, `src/`, and `electron/` so it can be developed and tested independently.

---

# Development Roadmap

## AI-0 — Create AI Branch and Lock MVP Scope

Suggested branch:

```text
feature/ai-player-highlight
```

Commands:

```bash
git checkout main
git pull origin main
git checkout -b feature/ai-player-highlight
git push -u origin feature/ai-player-highlight
```

The first version will:

- use the web version of the app
- process 1–5 minute clips
- track one selected player
- use manual player selection
- detect player/ball involvement
- output highlight segments
- reuse the current FFmpeg pipeline

Not required yet:

- full 90-minute processing
- automatic player naming
- face recognition
- jersey OCR
- automatic roster recognition
- Electron AI integration
- cloud deployment

**Exit criteria:** scope is fixed and AI work starts from a clean branch.

---

## AI-1 — Create Test Clip and Ground Truth

Choose one fixed 1–5 minute football clip.

The clip should contain:

- the target player visible multiple times
- several ball-related situations
- camera movement
- periods where the player is not involved

Manually record the real target-player situations.

Example:

```text
00:18 → 00:27
00:43 → 00:54
01:15 → 01:29
02:04 → 02:13
```

This becomes the initial ground truth.

Later comparisons can report:

```text
Real situations:        10
Correctly detected:      8
Missed:                  2
False positives:         3
```

**Exit criteria:** fixed test video + documented expected involvement intervals.

---

## AI-2 — Player Detection

Pipeline:

```text
Video frame
    ↓
YOLO
    ↓
Player bounding boxes
```

Initial focus:

- detect visible players reliably
- visualize bounding boxes
- save a debug output video

**Exit criteria:** most clearly visible players in the test clip are detected consistently.

---

## AI-3 — Player Tracking

Detection alone gives:

```text
frame 1 → player
frame 2 → player
frame 3 → player
```

Tracking should give:

```text
frame 1 → Player ID 7
frame 2 → Player ID 7
frame 3 → Player ID 7
```

Initial tracker:

```text
ByteTrack
```

**Exit criteria:** player IDs remain reasonably stable during continuous camera sequences.

---

## AI-4 — Target Player Selection

Initial approach:

```text
Show video frame
      ↓
User clicks player
      ↓
Find bounding box containing click
      ↓
Get player's track ID
      ↓
Mark as target player
```

Example:

```text
targetTrackId = 7
```

**Exit criteria:** selected player is followed successfully through most of the test clip.

---

## AI-5 — Target Player Re-identification

Problem:

```text
Player ID 7
   ↓
camera changes / player is hidden
   ↓
track disappears
   ↓
player returns as ID 19
```

Potential identity signals:

- appearance embeddings
- shirt color
- shorts/socks color
- jersey number
- team classification
- reference images

This phase may initially be lightweight and improved later.

**Exit criteria:** target identity survives at least some common tracking interruptions.

---

## AI-6 — Ball Detection

Pipeline:

```text
Frame
 ↓
YOLO ball detector
 ↓
Ball position
```

Ball detection is expected to be harder because the ball is small, fast, blurred, frequently occluded, and sometimes visually similar to the background.

**Exit criteria:** the ball is detected in a useful percentage of clear frames in the test clip.

---

## AI-7 — Ball Tracking

Example:

```text
Frame 101 → detected
Frame 102 → detected
Frame 103 → missing
Frame 104 → missing
Frame 105 → detected
```

Tracking/interpolation should help create:

```text
● → ● → ? → ? → ●
```

Pixel-perfect tracking is not required. We need enough continuity to reason about player involvement.

**Exit criteria:** ball movement is reasonably continuous through the main situations.

---

## AI-8 — Target Player Involvement Detection

Inputs:

```text
Target player position
Ball position
Ball trajectory
Player movement
Nearby players
Time
```

Initial logic may use heuristics.

Examples:

### Receiving
```text
Ball approaches target
       ↓
Ball-player distance decreases
       ↓
Ball remains near target
```

### Passing
```text
Ball near target
       ↓
Ball rapidly moves away
```

### Dribbling
```text
Target moves
+
Ball remains nearby over time
```

### Shooting
```text
Ball near target
       ↓
Ball leaves rapidly
```

### Heading
```text
Ball approaches upper body/head area
```

### Tackle / Interception
```text
Opponent has nearby ball
       ↓
Target approaches
       ↓
Ball trajectory / possession changes
```

### Running Near the Ball
A controlled proximity rule may count involvement when player-ball distance stays below a threshold for a meaningful amount of time.

**Exit criteria:** involvement intervals resemble the manually created ground truth.

---

## AI-9 — Situation Start and End Detection

Instead of only:

```text
Target involved at 01:23
```

determine:

```text
Situation starts: 01:18
Situation ends:   01:31
```

Then add padding:

```text
Final segment:
01:13 → 01:36
```

**Exit criteria:** output consists of complete, watchable football situations.

---

## AI-10 — Merge Nearby and Overlapping Situations

Example:

```text
Situation A:
01:00 → 01:12

Situation B:
01:14 → 01:21
```

After padding:

```text
00:55 → 01:17
01:09 → 01:26
```

Merge into:

```text
00:55 → 01:26
```

Algorithm:

```text
sort
 ↓
check overlap / small gap
 ↓
merge
```

**Exit criteria:** no unnecessary duplicate or fragmented highlight clips.

---

## AI-11 — Connect AI Segments to Existing FFmpeg Pipeline

AI output:

```json
[
  {
    "start": "0:18",
    "end": "0:34"
  },
  {
    "start": "1:08",
    "end": "1:36"
  }
]
```

Then:

```text
AI Segments
      ↓
Existing validateSegments()
      ↓
Existing createHighlight()
      ↓
FFmpeg
      ↓
Final Player Highlight
```

Do not create a second video cutting/merging system.

**Exit criteria:** one 1–5 minute clip can go from video → selected player → AI analysis → segments → final MP4.

This is the first major **AI MVP milestone**.

---

## AI-12 — Web UI Integration

Possible interface:

```text
Upload Video

Target Player
[Select Player]

[Analyze Video]

Detected Player Situations

✓ 0:18 → 0:34
✓ 0:43 → 0:59
✓ 1:08 → 1:36

[Create Highlight]
```

The user should still be able to:

- review AI suggestions
- delete incorrect segments
- edit start/end times
- manually add segments

The AI assists the user rather than removing control.

**Exit criteria:** AI highlight creation works through the existing web UI.

---

## AI-13 — Evaluation

Compare AI output against the AI-1 ground truth.

Track:

- correct situations
- missed situations
- false positives
- precision
- recall
- processing time
- tracking failures

Example:

```text
Ground truth situations: 12
Correct detections:       10
Missed:                    2
False positives:           3
```

**Exit criteria:** performance is measurable instead of judged only by visual impression.

---

## AI-14 — Scale to Longer Clips

Only after 1–5 minute clips work reliably.

Progression:

```text
1–5 minutes
   ↓
10–20 minutes
   ↓
45 minutes
   ↓
90+ minutes
```

Monitor:

- memory usage
- processing time
- player ID loss
- ball detection quality
- camera cuts
- false positives

---

## AI-15 — Full Match Processing

Possible future requirements:

- chunk processing
- caching
- batch inference
- GPU optimization
- resumable analysis
- persistent tracking metadata

Not required for the initial MVP.

---

## AI-16 — Automatic Player Discovery

Long-term target:

```text
Upload full match
       ↓
AI detects all players
       ↓
AI tracks players
       ↓
AI groups players by team
       ↓
App shows player choices
       ↓
User selects player
       ↓
Generate highlight
```

Possible later improvements:

- jersey number recognition
- team color recognition
- roster matching
- face recognition where useful
- automatic player names

---

# Hardware and Cost Plan

## Initial Cost

Expected initial cost:

```text
approximately $0
```

Start with:

- current computer
- pretrained models
- short video clips
- CPU or any existing GPU

Do not buy hardware before proving the pipeline works.

## GPU Strategy

GPU is useful for faster inference, fine-tuning, repeated experiments, and full-match processing, but is not required for the first experiments.

Recommended strategy:

```text
Start locally
    ↓
Measure performance
    ↓
If too slow:
rent cloud GPU temporarily
    ↓
Only consider buying hardware
after sustained GPU usage is proven
```

## Hardware Purchase

Do not purchase a GPU specifically for the project at the start.

If frequent local training becomes necessary later, a modern NVIDIA GPU with approximately 12–24 GB VRAM would be useful.

Storage also matters because football videos, extracted frames, annotations, and model checkpoints can consume significant disk space.

---

# Dataset Strategy

Initially:

- use a small number of manually selected clips
- create ground truth manually
- use pretrained YOLO models where possible
- avoid training from scratch

If player or ball detection is insufficient later:

```text
Collect football frames
      ↓
Annotate players / ball
      ↓
Build custom dataset
      ↓
Fine-tune YOLO
```

---

# Testing Strategy

Build and verify each component independently:

```text
Player Detection
      ↓
Player Tracking
      ↓
Target Selection
      ↓
Ball Detection
      ↓
Ball Tracking
      ↓
Involvement Detection
      ↓
Segment Generation
      ↓
FFmpeg Integration
```

Do not try to build the full AI pipeline in one step.

---

# Git Strategy

Dedicated branch:

```text
feature/ai-player-highlight
```

Suggested milestone commits:

```text
feat: add YOLO player detection
feat: add player tracking
feat: add target player selection
feat: add ball detection
feat: add ball tracking
feat: add player involvement detection
feat: generate AI highlight segments
feat: connect AI segments to FFmpeg pipeline
feat: add AI highlight workflow to web UI
```

Before major commits:

```bash
npm test
npm run build
```

Python tests should be added as the AI package grows.

---

# Definition of AI MVP Success

The first AI MVP is successful when:

1. User provides a 1–5 minute football clip.
2. User selects one target player.
3. The system tracks that player.
4. The system detects/tracks the football.
5. The system identifies several situations where the player is involved.
6. The system determines useful start/end times.
7. Five seconds are added before and after each situation.
8. Nearby/overlapping situations are merged.
9. The existing FFmpeg pipeline creates the final highlight.
10. The resulting highlight contains most of the target player's meaningful involvement from the test clip.

---

# Current Priorities

## Build Now

```text
AI-0  Branch and scope
AI-1  Test clip + ground truth
AI-2  Player detection
AI-3  Player tracking
AI-4  Target player selection
AI-6  Ball detection
AI-7  Ball tracking
AI-8  Involvement detection
AI-9  Situation boundaries
AI-10 Segment merging
AI-11 FFmpeg integration
AI-12 Web UI
```

## Build Later

```text
Re-identification improvements
Full-match processing
Automatic team classification
Jersey OCR
Automatic player discovery
Automatic player naming
Electron AI integration
Cloud processing
Advanced GPU optimization
```

---

# Immediate Next Step

After committing this document:

```text
1. Create feature/ai-player-highlight from main
2. Verify the web application still builds and tests successfully
3. Create the initial ai/ Python workspace
4. Choose one fixed 1–5 minute football test clip
5. Manually record target-player involvement as ground truth
6. Begin AI-2: YOLO player detection
```

The project should remain focused on proving the end-to-end player-highlight concept before adding advanced player identification or full-match scale.
