# Source this:  source scripts/ffmpeg-env.sh [remotion-project-dir]
# Exposes $FF and $FFPROBE.
#
# Uses ffmpeg from your PATH if you have one (e.g. `brew install ffmpeg`).
# Otherwise falls back to the ffmpeg that Remotion bundles inside
# node_modules/@remotion/compositor-<platform>. That build:
#   - needs its own folder on the library path (set below),
#   - has NO rawvideo muxer: always write raw frames with
#     `-c:v rawvideo -f image2pipe` (works with every ffmpeg, so the skill uses it everywhere),
#   - has almost no filters (scale works; select, tile, EQ and loudnorm summaries do not),
#     which is why the analysis tools in this folder are plain Node.
if command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; then
  export FF="$(command -v ffmpeg)" FFPROBE="$(command -v ffprobe)"
else
  _p="${1:-$PWD}"
  _d="$(ls -d "$_p"/node_modules/@remotion/compositor-* 2>/dev/null | head -1)"
  if [ -z "$_d" ]; then
    echo "No ffmpeg on PATH and no Remotion compositor under $_p/node_modules. Install ffmpeg or pass your Remotion project folder." >&2
    return 1 2>/dev/null || exit 1
  fi
  _d="$(cd "$_d" && pwd -P)"
  export DYLD_LIBRARY_PATH="$_d" LD_LIBRARY_PATH="$_d"
  export FF="$_d/ffmpeg" FFPROBE="$_d/ffprobe"
fi
echo "FF=$FF"
