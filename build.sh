#!/bin/sh
# Wraps src/game.html (the game: markup, styles, script) into a standalone index.html.
set -e
cd "$(dirname "$0")"
{
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body style="margin:0">\n'
  cat src/game.html
  printf '</body>\n</html>\n'
} > index.html
