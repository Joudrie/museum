#!/bin/sh
# Download the files of an OpenGameArt pack into assets/vendor/<dir>/ and write its SOURCE.txt.
# Usage: tools/fetch_oga.sh <page path> <dir> "<name>" "<author>" "<licence>"
#   e.g. tools/fetch_oga.sh content/lpc-terrains lpc-terrains "[LPC] Terrains" "bluecarrot16, Zabin" "CC-BY-SA 4.0 / 3.0"
# OpenGameArt is plain HTTP with no bot check; itch.io packs are downloaded by hand instead.
set -e
page="$1"; dir="assets/vendor/$2"
mkdir -p "$dir"
curl -fsS -m 30 "https://opengameart.org/$page" |
  grep -o 'https://opengameart.org/sites/default/files/[^"]*\.\(zip\|png\|rar\|7z\|gif\|tar\.gz\|txt\|tmx\|tsx\)' |
  grep -v '/styles/\|/css/\|/js/\|/user-pictures/\|/cc-by\|/cc0\|preview\|screenshot' | sort -u > "$dir/.list"
# a zip holds the whole pack, so take only that when there is one
if grep -q '\.\(zip\|rar\|7z\|tar\.gz\)$' "$dir/.list"; then grep '\.\(zip\|rar\|7z\|tar\.gz\)$' "$dir/.list" > "$dir/.l2"; mv "$dir/.l2" "$dir/.list"; fi
cat "$dir/.list" |
  while read -r u; do curl -fsS -m 120 -o "$dir/$(basename "$u")" "$u" && echo "  got $(basename "$u")"; done
rm -f "$dir/.list"
printf '%s\nhttps://opengameart.org/%s\nAuthor (page): %s\nLicense: %s\n' "$3" "$page" "$4" "$5" > "$dir/SOURCE.txt"
