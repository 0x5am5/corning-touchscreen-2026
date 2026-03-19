#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -lt 2 ] || [ "$#" -gt 4 ]; then
  echo "Usage: $0 <input> <output> [crf] [preset]" >&2
  exit 1
fi

input_path=$1
output_path=$2
crf=${3:-18}
preset=${4:-slow}

fps_raw=$(
  ffprobe \
    -v error \
    -select_streams v:0 \
    -show_entries stream=avg_frame_rate \
    -of default=nokey=1:noprint_wrappers=1 \
    "$input_path"
)

gop_size=$(
  awk -F/ '
    NF == 2 && $2 != 0 {
      value = $1 / $2;
      if (value < 1) {
        value = 25;
      }
      printf "%d\n", value + 0.5;
      next;
    }
    NF == 1 && $1 > 0 {
      printf "%d\n", $1 + 0.5;
      next;
    }
    {
      print 25;
    }
  ' <<<"$fps_raw"
)

ffmpeg \
  -y \
  -i "$input_path" \
  -an \
  -c:v libx264 \
  -preset "$preset" \
  -crf "$crf" \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -g "$gop_size" \
  -keyint_min "$gop_size" \
  -sc_threshold 0 \
  "$output_path"
