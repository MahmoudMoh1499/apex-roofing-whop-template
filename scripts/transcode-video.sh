#!/usr/bin/env bash
set -e

SOURCE_WEBM=$(ls -t recordings/full-run/*.webm | head -n 1)
TARGET_MP4="submission/demo-video.mp4"

if [ -z "$SOURCE_WEBM" ] || [ ! -f "$SOURCE_WEBM" ]; then
  echo "Error: Source recording not found in recordings/full-run/"
  exit 1
fi

echo "Source recording: $SOURCE_WEBM"
echo "Target output:    $TARGET_MP4"

# Probe duration of webm
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$SOURCE_WEBM")
echo "Source duration:  ${DURATION}s"

# Transcode to pristine 1080p H.264 MP4 with synchronized AAC audio track
ffmpeg -y \
  -i "$SOURCE_WEBM" \
  -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 \
  -c:v libx264 \
  -preset medium \
  -crf 20 \
  -pix_fmt yuv420p \
  -c:a aac \
  -b:a 128k \
  -shortest \
  -movflags +faststart \
  "$TARGET_MP4"

echo "=== Transcoding Complete ==="
ls -lh "$TARGET_MP4"
ffprobe -hide_banner "$TARGET_MP4"
