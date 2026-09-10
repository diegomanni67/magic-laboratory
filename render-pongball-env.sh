# Render build helper for the stable Pongball URL.
# The static site's historic build command contains an expiring artifact URL;
# this shell function swaps only that download for the current build artifact.
curl() {
  local output=''
  while [ "$#" -gt 0 ]; do
    if [ "$1" = '-o' ]; then
      shift
      output="$1"
    fi
    shift || true
  done
  if [ -z "$output" ] || [ -z "${FRESH_PONGBALL_ARTIFACT_URL:-}" ]; then
    return 2
  fi
  /usr/bin/curl -fL "$FRESH_PONGBALL_ARTIFACT_URL" -o "$output"
}
