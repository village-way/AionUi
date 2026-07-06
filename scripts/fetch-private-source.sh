#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '[fetch-private-source] %s\n' "$*"
}

die() {
  printf '[fetch-private-source] ERROR: %s\n' "$*" >&2
  exit 1
}

redact_url() {
  local value="$1"
  if [ -n "${SOURCE_TOKEN:-}" ]; then
    value="${value//$SOURCE_TOKEN/[token]}"
  fi
  printf '%s\n' "$value" | sed -E 's#https://[^/@]+@github\.com/#https://[token]@github.com/#g'
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

SOURCE_REPO_URL="${AIONUI_SOURCE_REPO_URL:-https://github.com/village-way/zhanlu-work.git}"
SOURCE_REF="${AIONUI_SOURCE_REF:-${GITHUB_REF_NAME:-}}"
SOURCE_DIR="${AIONUI_SOURCE_DIR:-${WORKSPACE_ROOT}/.source-repo}"
SOURCE_TOKEN="${AIONUI_SOURCE_TOKEN:-}"

[ -n "$SOURCE_REF" ] || die 'AIONUI_SOURCE_REF or GITHUB_REF_NAME is required'
command -v git >/dev/null 2>&1 || die 'git is required'
command -v tar >/dev/null 2>&1 || die 'tar is required'

if [ -n "$SOURCE_TOKEN" ] && [ -n "${GITHUB_ACTIONS:-}" ]; then
  printf '::add-mask::%s\n' "$SOURCE_TOKEN"
fi

AUTH_REPO_URL="$SOURCE_REPO_URL"
if [[ "$SOURCE_REPO_URL" == https://github.com/* ]] && [ -n "$SOURCE_TOKEN" ]; then
  AUTH_REPO_URL="https://x-access-token:${SOURCE_TOKEN}@${SOURCE_REPO_URL#https://}"
fi

if [[ "${AIONUI_FORCE_CLONE:-}" == "1" || "${AIONUI_FORCE_CLONE:-}" == "true" ]]; then
  rm -rf "$SOURCE_DIR"
fi

mkdir -p "$(dirname "$SOURCE_DIR")"

if [ -d "$SOURCE_DIR/.git" ]; then
  log "Updating existing source checkout at $SOURCE_DIR"
  git -C "$SOURCE_DIR" remote set-url origin "$AUTH_REPO_URL" >/dev/null
else
  log "Initializing source checkout at $SOURCE_DIR"
  rm -rf "$SOURCE_DIR"
  mkdir -p "$SOURCE_DIR"
  git -C "$SOURCE_DIR" init -q
  git -C "$SOURCE_DIR" remote add origin "$AUTH_REPO_URL"
fi

git config --global --add safe.directory "$SOURCE_DIR" >/dev/null 2>&1 || true

log "Fetching $(redact_url "$SOURCE_REPO_URL") ref '$SOURCE_REF'"
export GIT_TERMINAL_PROMPT=0

fetch_source_ref() {
  git -C "$SOURCE_DIR" fetch --force --depth 1 origin "$SOURCE_REF" && return 0
  git -C "$SOURCE_DIR" fetch --force --depth 1 origin "refs/heads/${SOURCE_REF}:refs/remotes/origin/${SOURCE_REF}" && return 0
  git -C "$SOURCE_DIR" fetch --force --depth 1 origin "refs/tags/${SOURCE_REF}:refs/tags/${SOURCE_REF}" && return 0
  return 1
}

fetch_source_ref || die "failed to fetch source ref '$SOURCE_REF'"
git -C "$SOURCE_DIR" checkout --detach -q FETCH_HEAD
git -C "$SOURCE_DIR" reset --hard -q FETCH_HEAD

if [[ "$SOURCE_REPO_URL" == https://github.com/* ]]; then
  git -C "$SOURCE_DIR" remote set-url origin "$SOURCE_REPO_URL" >/dev/null
fi

SOURCE_COMMIT="$(git -C "$SOURCE_DIR" rev-parse HEAD)"
log "Fetched private source commit ${SOURCE_COMMIT}"

log "Materializing private source into $WORKSPACE_ROOT"
(
  cd "$SOURCE_DIR"
  tar \
    --exclude='./.git' \
    --exclude='./.source-repo' \
    --exclude='./.github/workflows' \
    --exclude='./scripts/fetch-private-source.sh' \
    -cf - .
) | (
  cd "$WORKSPACE_ROOT"
  tar -xf -
)

REQUIRED_PATHS=(
  'package.json'
  'bun.lock'
  'packages/desktop/electron-builder.yml'
  'scripts/build-with-builder.js'
)

missing=0
for required_path in "${REQUIRED_PATHS[@]}"; do
  if [ ! -e "${WORKSPACE_ROOT}/${required_path}" ]; then
    printf '[fetch-private-source] ERROR: required path missing after materialization: %s\n' "$required_path" >&2
    missing=1
  fi
done

[ "$missing" -eq 0 ] || exit 1

if [ -n "${GITHUB_ENV:-}" ]; then
  {
    printf 'AIONUI_SOURCE_REF=%s\n' "$SOURCE_REF"
    printf 'AIONUI_SOURCE_COMMIT=%s\n' "$SOURCE_COMMIT"
  } >> "$GITHUB_ENV"
fi

log 'Private source materialized successfully'
