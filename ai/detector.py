import argparse
import json
from pathlib import Path

import opensportslib
from opensportslib.apis import LocalizationModel


# --------------------------------------------------
# Paths
# --------------------------------------------------

AI_DIR = Path(__file__).resolve().parent
CACHE_DIR = AI_DIR / "cache"
RUNTIME_DIR = AI_DIR / "runtime"


# --------------------------------------------------
# Model configuration
# --------------------------------------------------

MODEL_ID = "OpenSportsLab/OSL-loc-snbas-2025-e2e"

CLASSES = [
    "PASS",
    "DRIVE",
    "HEADER",
    "HIGH PASS",
    "OUT",
    "CROSS",
    "THROW IN",
    "SHOT",
    "BALL PLAYER BLOCK",
    "PLAYER SUCCESSFUL TACKLE",
    "FREE KICK",
    "GOAL",
]


# --------------------------------------------------
# Highlight configuration
# --------------------------------------------------

HIGHLIGHT_LABELS = {
    "GOAL",
    "SHOT",
    "CROSS",
    "HEADER",
    "FREE KICK",
}

MIN_CONFIDENCE = 0.5

# Seconds before and after each detected event
HIGHLIGHT_WINDOWS = {
    "SHOT": (8, 6),
    "CROSS": (6, 8),
    "HEADER": (6, 6),
    "GOAL": (10, 12),
    "FREE KICK": (7, 7),
}


# --------------------------------------------------
# Time helpers
# --------------------------------------------------

def seconds_to_timestamp(seconds: float) -> str:
    seconds = max(0, int(seconds))

    minutes = seconds // 60
    remaining_seconds = seconds % 60

    return f"{minutes}:{remaining_seconds:02d}"


# --------------------------------------------------
# Prediction cache
# --------------------------------------------------

def get_cache_path(video_path: Path) -> Path:
    return (
        CACHE_DIR
        / f"{video_path.stem}_predictions.json"
    )


def save_predictions(
    predictions: dict,
    video_path: Path,
) -> Path:
    CACHE_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    cache_path = get_cache_path(
        video_path
    )

    with open(
        cache_path,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            predictions,
            file,
            indent=2,
        )

    return cache_path


def load_predictions(
    video_path: Path,
) -> dict | None:
    cache_path = get_cache_path(
        video_path
    )

    if not cache_path.exists():
        return None

    with open(
        cache_path,
        "r",
        encoding="utf-8",
    ) as file:
        return json.load(file)


# --------------------------------------------------
# Prediction filtering
# --------------------------------------------------

def get_highlight_candidates(
    predictions: dict,
) -> list[dict]:

    candidates = []

    for video in predictions.get(
        "data",
        [],
    ):
        for event in video.get(
            "events",
            [],
        ):
            label = event.get("label")

            confidence = event.get(
                "confidence",
                0,
            )

            if (
                label in HIGHLIGHT_LABELS
                and confidence >= MIN_CONFIDENCE
            ):
                candidates.append(event)

    candidates.sort(
        key=lambda event: event[
            "position_ms"
        ]
    )

    return candidates


# --------------------------------------------------
# Convert events into highlight windows
# --------------------------------------------------

def candidates_to_segments(
    candidates: list[dict],
) -> list[dict]:

    segments = []

    for event in candidates:
        label = event["label"]

        before, after = (
            HIGHLIGHT_WINDOWS[label]
        )

        event_seconds = (
            event["position_ms"]
            / 1000
        )

        start_seconds = max(
            0,
            event_seconds - before,
        )

        end_seconds = (
            event_seconds + after
        )

        segments.append(
            {
                "start_seconds": start_seconds,
                "end_seconds": end_seconds,
                "start": seconds_to_timestamp(
                    start_seconds
                ),
                "end": seconds_to_timestamp(
                    end_seconds
                ),
                "event": label,
                "confidence": round(
                    event["confidence"],
                    3,
                ),
            }
        )

    return segments


# --------------------------------------------------
# Merge overlapping highlight windows
# --------------------------------------------------

def merge_overlapping_segments(
    segments: list[dict],
) -> list[dict]:

    if not segments:
        return []

    sorted_segments = sorted(
        segments,
        key=lambda segment: segment[
            "start_seconds"
        ],
    )

    merged = []

    current = (
        sorted_segments[0].copy()
    )

    current["events"] = [
        current["event"]
    ]

    for segment in sorted_segments[1:]:

        # If the next segment starts before
        # the current one ends, they overlap.
        if (
            segment["start_seconds"]
            <= current["end_seconds"]
        ):
            current[
                "end_seconds"
            ] = max(
                current["end_seconds"],
                segment["end_seconds"],
            )

            current["end"] = (
                seconds_to_timestamp(
                    current["end_seconds"]
                )
            )

            if (
                segment["event"]
                not in current["events"]
            ):
                current["events"].append(
                    segment["event"]
                )

            current["confidence"] = max(
                current["confidence"],
                segment["confidence"],
            )

        else:
            merged.append(current)

            current = segment.copy()

            current["events"] = [
                current["event"]
            ]

    merged.append(current)

    return merged


# --------------------------------------------------
# OpenSportsLib manifest
# --------------------------------------------------

def create_manifest(
    video_path: Path,
    manifest_path: Path,
) -> None:

    manifest = {
        "version": "2.0",
        "task": "action_spotting",
        "dataset_name": "videoeditor-ai",
        "labels": {
            "action": {
                "type": "single_label",
                "labels": CLASSES,
            }
        },
        "data": [
            {
                "id": video_path.stem,
                "inputs": [
                    {
                        "type": "video",
                        "path": video_path.name,
                    }
                ],
                "events": [],
            }
        ],
    }

    manifest_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with open(
        manifest_path,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            manifest,
            file,
            indent=2,
        )


# --------------------------------------------------
# AI inference
# --------------------------------------------------

def detect(
    video_path: Path,
) -> dict:

    if not video_path.exists():
        raise FileNotFoundError(
            f"Video not found: "
            f"{video_path}"
        )

    package_root = Path(
        opensportslib.__file__
    ).parent

    config_path = (
        package_root
        / "configs"
        / "localization"
        / "video_ocv.yaml"
    )

    if not config_path.exists():
        raise FileNotFoundError(
            "OpenSportsLib config "
            f"not found: {config_path}"
        )

    manifest_path = (
        RUNTIME_DIR
        / "input.json"
    )

    create_manifest(
        video_path=video_path,
        manifest_path=manifest_path,
    )

    print(
        f"Video: {video_path}"
    )

    print(
        f"Config: {config_path}"
    )

    print(
        f"Model: {MODEL_ID}"
    )

    print(
        "Loading AI model..."
    )

    model = LocalizationModel(
        config=str(config_path),
        weights=None,
    )

    # macOS compatibility:
    # Avoid PyTorch multiprocessing
    # serialization problems.
    model.config.DATA.common.splits.test.dataloader.num_workers = 0

    model.config.DATA.common.splits.test.dataloader.pin_memory = False

    model.config.DATA.common.splits.test.source_path = str(
        video_path.parent.resolve()
    )

    model.load_weights(
        weights=MODEL_ID,
    )

    print(
        "Running action detection..."
    )

    predictions = model.infer(
        test_set=str(
            manifest_path.resolve()
        ),
        use_wandb=False,
    )

    return predictions


# --------------------------------------------------
# Main
# --------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Detect soccer events "
            "and generate highlight segments."
        )
    )

    parser.add_argument(
        "video",
        help="Path to the football video",
    )

    args = parser.parse_args()

    video_path = Path(
        args.video
    ).resolve()

    if not video_path.exists():
        raise FileNotFoundError(
            f"Video not found: "
            f"{video_path}"
        )

    # ----------------------------------------------
    # Load cached predictions if available
    # ----------------------------------------------

    predictions = load_predictions(
        video_path
    )

    if predictions is None:
        print(
            "No cached predictions found."
        )

        predictions = detect(
            video_path
        )

        cache_path = save_predictions(
            predictions,
            video_path,
        )

        print(
            "\nPredictions saved to: "
            f"{cache_path}"
        )

    else:
        print(
            "Using cached AI predictions."
        )

    # ----------------------------------------------
    # Find important events
    # ----------------------------------------------

    candidates = (
        get_highlight_candidates(
            predictions
        )
    )

    if not candidates:
        print(
            "\nNo strong highlight "
            "candidates found."
        )
        return

    print(
        "\nHighlight candidates:"
    )

    for event in candidates:
        print(
            f"{event['gameTime']} | "
            f"{event['label']:<10} | "
            "confidence: "
            f"{event['confidence']:.3f}"
        )

    # ----------------------------------------------
    # Generate highlight windows
    # ----------------------------------------------

    segments = (
        candidates_to_segments(
            candidates
        )
    )

    print(
        "\nGenerated highlight segments:"
    )

    for segment in segments:
        print(
            f"{segment['start']} -> "
            f"{segment['end']} | "
            f"{segment['event']} | "
            f"{segment['confidence']}"
        )

    # ----------------------------------------------
    # Merge overlapping highlight windows
    # ----------------------------------------------

    merged_segments = (
        merge_overlapping_segments(
            segments
        )
    )

    print(
        "\nMerged highlight segments:"
    )

    for segment in merged_segments:
        print(
            f"{segment['start']} -> "
            f"{segment['end']} | "
            f"{', '.join(segment['events'])} | "
            "max confidence: "
            f"{segment['confidence']}"
        )


if __name__ == "__main__":
    main()