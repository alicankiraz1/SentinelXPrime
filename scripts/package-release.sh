#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
archive_name="${1:-SentinelXPrime}"
archive_name="$(node "$repo_root/scripts/check-archive-name.mjs" "$archive_name")"
node "$repo_root/scripts/check-package-root.mjs" "$repo_root"
node "$repo_root/scripts/check-release-surface.mjs" "$repo_root"
dist_dir="$repo_root/dist"
staging_root="$(mktemp -d "${TMPDIR:-/tmp}/sentinelx-prime-release.XXXXXX")"
staging_dir="$staging_root/$archive_name"
archive_path="$dist_dir/$archive_name.zip"

cleanup() {
  rm -rf "$staging_root"
}

copy_release_surface() {
  node "$repo_root/scripts/copy-release-surface.mjs" "$repo_root" "$staging_dir"
}

trap cleanup EXIT

mkdir -p "$dist_dir" "$staging_dir"
rm -f "$archive_path"

export COPYFILE_DISABLE=1

copy_release_surface

find "$staging_root" \( -name '.DS_Store' -o -name '._*' \) -delete
node "$repo_root/scripts/write-release-manifest.mjs" "$repo_root" "$staging_dir"

if command -v ditto >/dev/null 2>&1; then
  ditto -c -k --norsrc --keepParent "$staging_dir" "$archive_path"
else
  (
    cd "$staging_root"
    zip -qr "$archive_path" "$archive_name" -x '*/__MACOSX/*' '*/._*' '*/.DS_Store'
  )
fi

printf '%s\n' "$archive_path"
