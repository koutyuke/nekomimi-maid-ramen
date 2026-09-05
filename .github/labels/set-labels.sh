#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
file="$script_dir/labels.json"
repo=""
prune=0
dry_run=0

usage() {
  cat <<'EOF'
Usage: set-labels.sh [options]

Sync GitHub labels with a JSON definition file.

Options:
  -f, --file <path>         Label definition JSON (default: labels.json next to this script)
  -R, --repo <owner/repo>   Target repository (default: the current repository)
  -p, --prune               Delete labels that are not defined in the JSON file
  -n, --dry-run             Print the planned operations without applying them
  -h, --help                Show this help
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
  -f | --file)
    file="${2:?--file requires a path}"
    shift 2
    ;;
  -R | --repo)
    repo="${2:?--repo requires owner/repo}"
    shift 2
    ;;
  -p | --prune)
    prune=1
    shift
    ;;
  -n | --dry-run)
    dry_run=1
    shift
    ;;
  -h | --help)
    usage
    exit 0
    ;;
  *)
    echo "unknown argument: $1" >&2
    usage >&2
    exit 2
    ;;
  esac
done

for cmd in gh jq; do
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "required command not found: $cmd" >&2
    exit 1
  }
done

[ -f "$file" ] || {
  echo "label definition not found: $file" >&2
  exit 1
}

gh_label() {
  if [ -n "$repo" ]; then
    gh label "$@" --repo "$repo"
  else
    gh label "$@"
  fi
}

run() {
  if [ "$dry_run" -eq 1 ]; then
    printf 'dry-run:'
    printf ' %q' "$@"
    printf '\n'
    return 0
  fi
  "$@"
}

duplicated=$(jq -r '[.[].name] | group_by(.) | map(select(length > 1) | .[0]) | .[]' "$file")
[ -z "$duplicated" ] || {
  echo "duplicated label names in $file:" >&2
  printf '  %s\n' $duplicated >&2
  exit 1
}

defined=$(jq -r '.[].name' "$file")
existing=$(gh_label list --limit 200 --json name --jq '.[].name')

while IFS=$'\t' read -r name color description; do
  if printf '%s\n' "$existing" | grep -Fxq "$name"; then
    echo "update: $name"
    run gh_label edit "$name" --color "$color" --description "$description"
  else
    echo "create: $name"
    run gh_label create "$name" --color "$color" --description "$description"
  fi
done < <(jq -r '.[] | [.name, (.color | ltrimstr("#")), .description] | @tsv' "$file")

while read -r name; do
  [ -n "$name" ] || continue
  printf '%s\n' "$defined" | grep -Fxq "$name" && continue
  if [ "$prune" -eq 1 ]; then
    echo "delete: $name"
    run gh_label delete "$name" --yes
  else
    echo "undefined (use --prune to delete): $name"
  fi
done < <(printf '%s\n' "$existing")
