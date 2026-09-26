#!/bin/sh
# Build pages and mirror the site to the preview scratchpad
cd "$(dirname "$0")/.." && python3 _src/build.py && rsync -a --delete --exclude _src --exclude _clients --exclude _shot.html ./ /private/tmp/claude-501/-Users-newuser-Desktop-Claude/448c3d4a-b861-4bad-8b97-6c193997d017/scratchpad/tt/
