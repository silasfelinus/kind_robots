#!/usr/bin/env python3
"""container_log_triage.py — read every container's logs so Silas doesn't have to.

Runs on Alexandria (Unraid) as a daily User Script. Reads `docker logs` for all
running containers, keeps only error-ish lines, collapses them into normalized
SIGNATURES, and diffs those against a stored baseline. The output is a few KB of
JSON plus a human summary -- never raw logs.

The problem this solves is triage volume, not access (Silas, 2026-09-03: *"I'm
not searching around the logs of 50-ish containers regularly to find suboptimal
problems. If something is erroring in the logs but not actually breaking the
container, I'm not aware of it."*). He has Netdata and the Unraid GUI, so he
knows when a container BREAKS. What nobody reads is the steady drip of errors
from containers that are still nominally up.

This repo already has the canonical write-up of that failure mode in
check_engine_heartbeat.py: during the 2026-09-02 ComfyUI outage the relay posted
`COMFY ok:false` roughly 1,440 times into a health table and nothing alarmed on
it -- *"The signal was never missing. Nothing alarmed on it."* Fifty containers
is that, multiplied.

WHY A BASELINE IS THE WHOLE POINT
    Without one, every run re-reports the same 40 warnings your containers have
    emitted since 2024, and the report becomes wallpaper within a week. That is
    a documented failure in this repo already -- CLAUDE.md's session-start sweep
    resurfaced retired projects' tasks every session for over a week because
    nothing cross-checked them. So the daily output here is only:

      new      -- signatures never seen before
      spiking  -- known signatures whose rate jumped against their own history
      quiet    -- known signatures that stopped, which is a signal too: either
                  you fixed it, or a job that used to run no longer runs

    Everything else is counted and stored, not reported.

REDACTION IS A HARD REQUIREMENT, NOT A NICETY
    AGENTS.md hard safety rule 15: any command handed to a human must be
    INCAPABLE of printing a secret, because they will paste its output back.
    This script prints log lines from 50 containers, so it is exactly the
    hazard that rule describes. Every retained line goes through redact()
    before it is fingerprinted, stored, or displayed, and samples are truncated
    on top of that. See redact() for the layered defense and its limits.

    Note the deliberate difference from env-var redaction: `docker inspect`
    output is structured, so an allowlist of safe keys works there. Log prose is
    unstructured -- you cannot enumerate what is safe in arbitrary text -- so
    here it is a denylist of known secret shapes PLUS a length/charset net for
    high-entropy blobs PLUS a hard truncation. The net is what catches the
    secret shape nobody predicted.

STATE LIVES IN appdata, NEVER /mnt/user/pc
    AGENTS.md hard safety rule 14. Default state dir is
    /mnt/user/appdata/container-log-triage.

Exit codes follow this repo's check_* convention:
    0  clean      -- ran fine, nothing new to look at
    1  findings   -- new or spiking signatures worth a look
    2  unresolved -- could not run (no docker, no permission); NOT "clean"

Usage:
    # First run: full inventory of every distinct signature, no baseline.
    ./container_log_triage.py --inventory

    # Daily run: triage against the baseline, write the digest.
    ./container_log_triage.py

    # Stop reporting a signature you have looked at and accepted.
    ./container_log_triage.py --ack a1b2c3d4e5f6
    ./container_log_triage.py --mute a1b2c3d4e5f6 --note "known upstream bug"
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import re
import socket
import subprocess
import sys
import urllib.error
import urllib.request
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

EXIT_CLEAN = 0
EXIT_FINDINGS = 1
EXIT_UNRESOLVED = 2

DEFAULT_STATE_DIR = "/mnt/user/appdata/container-log-triage"
DEFAULT_SINCE = "24h"
DEFAULT_TAIL = 20000
DEFAULT_TIMEOUT = 60.0

# Per-container guards. A container that blows through these is reported as
# truncated rather than silently half-read.
MAX_LINES_PER_CONTAINER = 200000
MAX_BYTES_PER_CONTAINER = 64 * 1024 * 1024

# A container yielding more distinct signatures than this means normalization
# failed for its log format, not that it has that many distinct problems.
# Reported instead of poisoning the baseline with thousands of one-off entries.
MAX_SIGNATURES_PER_CONTAINER = 200

HISTORY_DAYS = 21
PRUNE_AFTER_DAYS = 45
MAX_SIGNATURES_STORED = 5000
MAX_REPORTED = 200

# Nothing past this reaches a regex. Bounding the input is the defence that
# survives someone adding a new pattern later without thinking about
# backtracking -- and a log line longer than this carries no extra signature
# value anyway, since the sample is truncated to 200 chars regardless.
MAX_LINE_CHARS = 2000
SAMPLE_MAX_CHARS = 200
SKELETON_MAX_CHARS = 300

# Spike detection needs enough history to have an opinion.
SPIKE_MIN_HISTORY_DAYS = 3
SPIKE_FACTOR = 5.0
SPIKE_MIN_COUNT = 20
QUIET_MIN_BASELINE = 10

STATUS_NEW = "new"
STATUS_ACK = "acknowledged"
STATUS_MUTED = "muted"

# Publishing. The digest is committed into Conductor beside the other
# home-server state files (RENDER-BOX-STATUS, ENGINE-HEARTBEAT-STATE.json),
# which is the established pattern for "host state an agent needs to read".
# The default path is exactly what scripts/check_container_log_drift.py already
# looks for, so publishing closes the loop with no configuration on either end.
PUBLISH_REPO = "silasfelinus/conductor"
PUBLISH_PATH = "ops/home-server/CONTAINER-LOG-DIGEST.json"
PUBLISH_BRANCH = "main"
PUBLISH_ATTEMPTS = 3

# Hard safety rule 14: credentials live under the checkout's .secrets/, never
# on /mnt/user/pc.
DEFAULT_SECRETS_DIR = "/mnt/user/appdata/kind_robots/.secrets"
TOKEN_FILENAME = "conductor-publish-token"
TOKEN_ENV_VARS = ("CONDUCTOR_PUBLISH_TOKEN", "GITHUB_TOKEN", "GH_TOKEN")


# --------------------------------------------------------------------------
# Line selection
# --------------------------------------------------------------------------

INCLUDE_RE = re.compile(
    r"""
      \b(?:error|errors|errno)\b
    | \b(?:warn|warning|warnings)\b
    | \b(?:fatal|critical|severe)\b
    | \b(?:exception|traceback|stacktrace|panic|segfault)\b
    | \bcore\ dumped\b
    | \b(?:fail|failed|failing|failure|failures)\b
    | \b(?:denied|refused|unauthorized|forbidden|rejected)\b
    | \b(?:timeout|timed\ out)\b
    | \bdeadline\ exceeded\b
    | \bdeprecat\w*
    | \b(?:retrying|retries)\b
    | \b(?:unable\ to|cannot|could\ not|couldn't|can't)\b
    | \bout\ of\ memory\b
    | \bno\ space\ left\b
    | \boom[-_ ]?kill\w*
    """,
    re.IGNORECASE | re.VERBOSE,
)

# Lines that match INCLUDE_RE but are actually reporting the ABSENCE of a
# problem. Kept deliberately small -- the baseline is the real noise control,
# and an over-eager exclude list hides real errors.
EXCLUDE_RE = re.compile(
    r"""
      \b(?:0|no|zero)\ (?:errors?|warnings?|failures?)\b
    | \b(?:errors?|warnings?|failures?)\s*[=:]\s*(?:0|\[\]|\{\}|none|null|false)\b
    | \berror_log\b
    | \berror_reporting\b
    | \blog[-_]?level\s*[=:]\s*\w+
    """,
    re.IGNORECASE | re.VERBOSE,
)

# An explicit level beats keyword guessing, and on this host it is not close.
# Silas's 2026-09-03 inventory: `[Info] ... for Term: [Critical Role Vox Machina
# Origins]` scored FATAL, `Scanning Panic (2021)` scored FATAL, and `Skipping
# refresh of series: Trial & Error` scored ERROR -- all INFO lines promoted by a
# word inside a MEDIA TITLE. A library full of films called Fail Safe, Panic and
# Trial & Error is adversarial input to a keyword classifier, and no keyword list
# survives it. Most of these containers already state their level; believe them.
#
# Formats seen across his ~50 containers, in one pass.
LEVEL_PATTERNS = (
    # [Info], [Warn], and Apache's [php:warn] / [authz_core:error]
    re.compile(r"\[(?:[a-z_]+:)?(trace|debug|info|notice|warn|warning|error|crit|critical|fatal|alert|emerg)\]", re.I),
    # Serilog/Jellyfin [WRN] [ERR]
    re.compile(r"\[(TRC|DBG|INF|WRN|ERR|FTL)\]"),
    # logfmt: level=error   (netdata, authelia, go.d)
    re.compile(r"\blevel=(trace|debug|info|notice|warn|warning|error|critical|fatal|panic|dpanic)\b", re.I),
    # JSON: "level":"error"  (podgrab)
    re.compile(r"\"level\"\s*:\s*\"(trace|debug|info|notice|warn|warning|error|critical|fatal|panic|dpanic)\"", re.I),
    # sabnzbd ::INFO::
    re.compile(r"::(TRACE|DEBUG|INFO|NOTICE|WARNING|WARN|ERROR|CRITICAL|FATAL)::"),
    # tautulli " - WARNING :: " and bazarr " :  ERROR (series:203)"
    re.compile(r"[-:]\s+(TRACE|DEBUG|INFO|NOTICE|WARNING|WARN|ERROR|CRITICAL|FATAL)\s+(?:::|\()"),
    # python logging "WARNING:webrtc_input:" (calibre)
    re.compile(r"\b(TRACE|DEBUG|INFO|NOTICE|WARNING|WARN|ERROR|CRITICAL|FATAL):[a-z_]+:", re.I),
    # leading bare level: "WARN  2026-.." (yac), "ERROR    Error:" (flaresolverr)
    re.compile(r"^\s*(TRACE|DEBUG|INFO|NOTICE|WARNING|WARN|ERROR|CRITICAL|FATAL)\b", re.I),
    # "[2026-09-03 19:50:08.917] WARNING (verification) ..." -- ownfoil
    re.compile(r"\]\s+(TRACE|DEBUG|INFO|NOTICE|WARNING|WARN|ERROR|CRITICAL|FATAL)\s", re.I),
)

# Levels whose own author considered them unremarkable. Dropped outright unless
# --include-info. This is the single biggest noise reduction available: it takes
# out the 355 `[debug][Watchlist Sync]` lines, every `[Info] DiskScanService`
# media title, and sabnzbd's `::INFO::` chatter.
QUIET_LEVELS = {"trace", "debug", "info", "notice", "trc", "dbg", "inf"}

LEVEL_SEVERITY = {
    "warn": "warn", "warning": "warn", "wrn": "warn",
    "error": "error", "err": "error",
    "crit": "fatal", "critical": "fatal", "fatal": "fatal", "ftl": "fatal",
    "panic": "fatal", "dpanic": "fatal", "alert": "fatal", "emerg": "fatal",
}


def detect_level(text):
    """The line's own stated level, lowercased, or None if it does not state one."""
    for pattern in LEVEL_PATTERNS:
        match = pattern.search(text)
        if match:
            return match.group(1).lower()
    return None


SEVERITY_PATTERNS = (
    ("fatal", re.compile(r"\b(?:fatal|critical|severe|panic|segfault)\b|\bcore\ dumped\b", re.I | re.X)),
    ("error", re.compile(r"\b(?:error|errors|errno|exception|traceback|failed|failure)\b", re.I)),
    ("warn", re.compile(r"\b(?:warn|warning|warnings|deprecat\w*)\b", re.I)),
)


def classify_severity(text):
    """Highest-severity class the line matches; 'other' if none do."""
    for name, pattern in SEVERITY_PATTERNS:
        if pattern.search(text):
            return name
    return "other"


# --------------------------------------------------------------------------
# Redaction — see the module docstring and AGENTS.md hard rule 15
# --------------------------------------------------------------------------

ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]")

# A secret's key name is matched as a SUFFIX of the identifier, not as a whole
# word: `\bpassword\b` never matches inside `PGPASSWORD` (there is no word
# boundary between G and P), which leaked a live value in testing. Requiring the
# keyword to sit at the END of the key -- immediately before the separator --
# catches PGPASSWORD, MYSQL_ROOT_PASSWORD, X-Api-Key and auth_token, while still
# rejecting `passed=true`, where `pass` is followed by more of the same word.
SECRET_KEY_WORDS = (
    r"password|passwd|passphrase|pwd|secret|token|api[-_]?key|apikey|"
    r"auth|authorization|credentials?|session[-_]?id|session|cookie|signature|"
    r"private[-_]?key|access[-_]?key|refresh[-_]?token|bearer|salt|nonce"
)
# The leading lookbehind is load-bearing for performance, not correctness.
# Without it the greedy prefix restarts at EVERY position inside a long token,
# backtracking through every keyword alternative each time -- measured at 3.6s
# per pattern on a single 6000-char token, quadratic in line length. With it,
# a mid-token position is rejected in O(1) and the prefix only runs once per
# token. Same matches, ~4000x faster on hostile input.
KEY_PREFIX = r"(?<![A-Za-z0-9_.\-])[\"']?[A-Za-z0-9_.\-]*"

# Matched, then filtered in Python. The first version expressed the
# "mixed letters and digits" test as two lookaheads --
# `(?=[^\s]*[0-9])(?=[^\s]*[A-Za-z])` -- which re-scans the rest of the token
# at every position, making redact() quadratic in line length. Measured on real
# shapes: 3k chars 1.7s, 6k chars 6.7s, 12k chars 23.8s. A single long line (a
# stack trace, a base64 payload, the `guid IN (...)` SQL that podgrab actually
# logs) would have stalled the nightly run for minutes on one container.
# CodeQL flagged it as polynomial ReDoS on uncontrolled data and was right:
# every input here is arbitrary text written by 50 containers.
BLOB_RE = re.compile(r"(?<![A-Za-z0-9+/=_-])[A-Za-z0-9+/=_-]{32,}")


def _redact_blob(match):
    text = match.group(0)
    has_digit = has_alpha = False
    for char in text:
        if char.isdigit():
            has_digit = True
        elif char.isalpha():
            has_alpha = True
        if has_digit and has_alpha:
            return "<REDACTED-BLOB>"
    return text


REDACTIONS = (
    # PEM blocks first -- they contain everything else.
    (re.compile(r"-----BEGIN[^-]{0,60}-----.*?-----END[^-]{0,60}-----", re.S), "<REDACTED-KEY>"),
    # JWTs.
    (re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*"), "<REDACTED-JWT>"),
    # Authorization headers / bearer tokens.
    (re.compile(r"\b(bearer|basic|token)\s+[A-Za-z0-9._~+/=-]{8,}", re.I), r"\1 <REDACTED>"),
    # URL userinfo: scheme://user:pass@host
    (re.compile(r"(://[^\s:/@]{0,64}):[^\s@/]{1,256}@"), r"\1:<REDACTED>@"),
    # key="value" / 'value'
    (re.compile(r"(" + KEY_PREFIX + r"(?:" + SECRET_KEY_WORDS + r")[\"']?\s*[:=]\s*)([\"'])[^\"']{1,512}\2", re.I),
     r"\1\2<REDACTED>\2"),
    # key=bareword (stop at whitespace, comma, semicolon, closing bracket)
    (re.compile(r"(" + KEY_PREFIX + r"(?:" + SECRET_KEY_WORDS + r")[\"']?\s*[:=]\s*)([^\s,;\}\)\]\"']{1,512})", re.I),
     r"\1<REDACTED>"),
    # Sensitive query parameters.
    (re.compile(r"([?&][A-Za-z0-9_.\-]*(?:" + SECRET_KEY_WORDS + r")=)[^&\s]{1,512}", re.I), r"\1<REDACTED>"),
    # Email addresses (PII, and Silas's own address appears in app logs).
    (re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"), "<EMAIL>"),
    # The safety net: any long high-entropy blob. This is what catches the
    # secret shape nobody predicted. It also eats sha256 digests and container
    # IDs, which is fine -- skeletonize() would have replaced those anyway.
    (BLOB_RE, _redact_blob),
)


def redact(text):
    """Strip anything that looks like a credential from a log line.

    Layered on purpose, because no single layer is trustworthy on arbitrary
    text: known secret shapes (PEM, JWT, bearer), key=value pairs whose KEY
    names a secret, URL userinfo and query params, then a catch-all for long
    high-entropy blobs. Callers must ALSO truncate (see SAMPLE_MAX_CHARS) so a
    missed pattern is bounded rather than unbounded.

    This is not a proof of safety -- it is defense in depth against a class of
    mistake that has already happened three times in this repo (conductor/t-116,
    t-128, and the 2026-08-25 session that printed a live production password).
    """
    text = text[:MAX_LINE_CHARS]
    for pattern, replacement in REDACTIONS:
        text = pattern.sub(replacement, text)
    return text


# --------------------------------------------------------------------------
# Skeletonization — collapse a line to its shape so repeats collapse together
# --------------------------------------------------------------------------

_MONTHS = r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
_DAYS = r"(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)"

SKELETON_STEPS = (
    # Word-form timestamps first, before the numeric rules below chew them up
    # piecemeal. Apache's error log stamps every line `[Sat Sep 05 05:35:07.291452
    # 2026]`; the generic rules turned that into `[sat sep <num> <ts> <num>]`,
    # which keeps the WEEKDAY, so one scoopspress PHP warning earned a fresh
    # fingerprint every day and was reported as `new` on 2026-09-03, 09-04 and
    # 09-05 in turn -- never once as spiking or quiet, and never against a
    # baseline. Same shape covers the CLF access-log form `[05/Sep/2026:05:35:07
    # +0000]` and the syslog form `Sep  5 05:35:07`.
    (re.compile(r"\b" + _DAYS + r" " + _MONTHS + r" +\d{1,2} \d{2}:\d{2}:\d{2}(?:[.,]\d+)? \d{4}\b"), "<TS>"),
    (re.compile(r"\b\d{1,2}/" + _MONTHS + r"/\d{4}:\d{2}:\d{2}:\d{2}(?: [+-]\d{4})?\b"), "<TS>"),
    (re.compile(r"\b" + _MONTHS + r" +\d{1,2} \d{2}:\d{2}:\d{2}(?:[.,]\d+)?\b"), "<TS>"),
    (re.compile(r"\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?"), "<TS>"),
    (re.compile(r"\b\d{2}:\d{2}:\d{2}(?:[.,]\d+)?\b"), "<TS>"),
    (re.compile(r"\b\d{4}-\d{2}-\d{2}\b"), "<DATE>"),
    (re.compile(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b"), "<UUID>"),
    (re.compile(r"\b(?:[0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}\b"), "<MAC>"),
    (re.compile(r"\b\d{1,3}(?:\.\d{1,3}){3}(?::\d{1,5})?\b"), "<IP>"),
    (re.compile(r"\b(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}\b"), "<IP>"),
    (re.compile(r"\b[a-zA-Z][a-zA-Z0-9+.-]*://\S+"), "<URL>"),
    (re.compile(r"(?<![\w/])/(?:[\w.@+-]+/)+[\w.@+-]*"), "<PATH>"),
    # Silas's media library is entirely spaces and parentheses --
    # /pc/movies/comedy/hot property (2016)/hot property (2016) {imdb-..}.mp4 --
    # so the tight rule above stops at the first space and every filename became
    # its own signature: 51 for bazarr where there were ~6 real problems, 43 for
    # radarr, 33 for sonarr. Once a <PATH> marker exists, absorb the spacey
    # remainder of the path with it.
    #
    # This deliberately swallows any trailing clause too, which is the right
    # trade here: `cannot update series <PATH> because of (IntegrityError)`
    # collapses to one row per root cause instead of one per title, and the
    # untruncated reason is still on the stored sample line.
    (re.compile(r"<PATH>\S*(?:[ \t][^\s/][^\t]*)?$"), "<PATH>"),
    (re.compile(r"\b0x[0-9a-fA-F]+\b"), "<HEX>"),
    (re.compile(r"\b[0-9a-fA-F]{8,}\b"), "<HEX>"),
    (re.compile(r"\"[^\"]{0,512}\""), "<STR>"),
    # The lookbehind stops an English contraction from opening a string.
    # Sonarr logs `Couldn't add release '<name>' from Indexer ...`; without it
    # the apostrophe in "Couldn't" matched first, consuming `'t add release '`
    # and leaving every release NAME bare and distinct. That alone gave sonarr
    # 104 signatures on 2026-09-04 where about ten were real -- 75 of them one
    # per episode of the same show.
    (re.compile(r"(?<![A-Za-z])'[^']{0,512}'"), "<STR>"),
    (re.compile(r"\b\d+(?:\.\d+)?(?:ns|us|ms|s|m|h|d|b|kb|mb|gb|tb|kib|mib|gib|%)\b", re.I), "<NUM>"),
    (re.compile(r"\b\d+(?:\.\d+)?\b"), "<NUM>"),
    (re.compile(r"\s+"), " "),
)


def skeletonize(text):
    """Reduce a line to its shape: variable parts replaced by typed placeholders.

    Order matters and is load-bearing. URLs before paths (a URL contains
    slashes), UUID before hex (a UUID is hex with dashes), IP before number,
    quoted strings before bare numbers. Getting the order wrong does not crash
    -- it silently splits one signature into hundreds, which shows up as a
    cardinality warning rather than a traceback.
    """
    for pattern, replacement in SKELETON_STEPS:
        text = pattern.sub(replacement, text)
    return text.strip().lower()[:SKELETON_MAX_CHARS]


def fingerprint(container, skeleton):
    """Stable id for one signature.

    Keyed on container NAME, not id: the same error in two containers is two
    different problems, and Unraid's DockerMan names are stable across the
    container recreation that a Force Update does (which changes the id).
    """
    digest = hashlib.sha1("{}\x00{}".format(container, skeleton).encode("utf-8", "replace"))
    return digest.hexdigest()[:12]


# --------------------------------------------------------------------------
# Docker I/O — kept apart from analysis so the risky logic stays testable
# --------------------------------------------------------------------------

DOCKER_TS_RE = re.compile(
    r"^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))\s(.*)$", re.S
)


def parse_docker_timestamp(value):
    """Parse docker's RFC3339Nano prefix. Python can't take 9-digit fractions."""
    text = value.replace("Z", "+00:00")
    if "." in text:
        head, _, tail = text.partition(".")
        digits = ""
        rest = ""
        for index, char in enumerate(tail):
            if char.isdigit():
                digits += char
            else:
                rest = tail[index:]
                break
        text = "{}.{}{}".format(head, (digits + "000000")[:6], rest)
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def run_docker(args, timeout=30.0):
    proc = subprocess.run(
        ["docker"] + args,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=timeout,
    )
    if proc.returncode != 0:
        message = proc.stderr.decode("utf-8", "replace").strip()
        raise RuntimeError(message or "docker {} exited {}".format(args[0], proc.returncode))
    return proc.stdout.decode("utf-8", "replace")


def list_containers(include_stopped=False):
    args = ["ps", "--no-trunc", "--format", "{{.ID}}\t{{.Names}}\t{{.Image}}"]
    if include_stopped:
        args.insert(1, "--all")
    containers = []
    for line in run_docker(args).splitlines():
        parts = line.split("\t")
        if len(parts) >= 2 and parts[0].strip():
            containers.append(
                {"id": parts[0].strip(), "name": parts[1].strip(),
                 "image": parts[2].strip() if len(parts) > 2 else ""}
            )
    return containers


def iter_container_lines(container_id, since, tail, timeout, status):
    """Stream `docker logs` line by line, filling `status` as it goes.

    Streamed rather than buffered so one runaway container cannot exhaust
    memory: a chatty container on a 50-container host can hold far more than
    the useful window.

    Container stderr is merged into stdout on purpose -- that is where most
    containers put their errors, and dropping it would defeat the whole script.
    The cost is that docker's OWN failure text ("configured logging driver does
    not support reading") arrives on the same stream and is indistinguishable
    from container output. So the exit code is the arbiter: a nonzero exit means
    everything read was docker complaining, not logs, and the caller must
    discard it. Truncation kills the process deliberately, so its exit code is
    meaningless and is not checked.
    """
    proc = subprocess.Popen(
        ["docker", "logs", "--timestamps", "--since", since, "--tail", str(tail), container_id],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    lines = 0
    total_bytes = 0
    tail_lines = deque(maxlen=3)
    deadline = datetime.now(timezone.utc) + timedelta(seconds=timeout)
    try:
        for raw in proc.stdout:
            lines += 1
            total_bytes += len(raw)
            if lines > MAX_LINES_PER_CONTAINER or total_bytes > MAX_BYTES_PER_CONTAINER:
                status["truncated"] = True
                break
            if lines % 2000 == 0 and datetime.now(timezone.utc) > deadline:
                status["truncated"] = True
                break
            text = raw.decode("utf-8", "replace").rstrip("\n")
            tail_lines.append(text)
            yield text
    finally:
        try:
            proc.stdout.close()
        except Exception:
            pass
        if proc.poll() is None:
            proc.kill()
        proc.wait()

    if not status["truncated"] and proc.returncode:
        raise RuntimeError(
            (tail_lines[-1] if tail_lines else "") or
            "docker logs exited {}".format(proc.returncode)
        )


def collect(containers, since, tail, timeout, exclude_names, stats):
    """Yield (container, timestamp, body) records, recording scan stats.

    A generator rather than a list so peak memory is one container's worth of
    lines instead of all fifty: analyze() consumes each batch as it is produced.
    Buffering per container is what makes the failure case clean -- a container
    docker cannot read is dropped whole, so its error text never reaches the
    baseline as a bogus signature.
    """
    for container in containers:
        name = container["name"]
        if name in exclude_names:
            continue

        status = {"truncated": False}
        buffered = []
        try:
            for raw in iter_container_lines(container["id"], since, tail, timeout, status):
                match = DOCKER_TS_RE.match(raw)
                if match:
                    buffered.append((name, parse_docker_timestamp(match.group(1)), match.group(2)))
                else:
                    buffered.append((name, None, raw))
        except FileNotFoundError:
            raise
        except Exception as error:  # noqa: BLE001 - one bad container must not stop the sweep
            # Expected for containers whose template sets --log-driver none, or
            # any driver docker cannot read back. Recorded, never fatal.
            stats["failed"].append({"container": name, "error": str(error)[:200]})
            continue

        stats["scanned"] += 1
        stats["lines_read"] += len(buffered)
        if status["truncated"]:
            stats["truncated"].append(name)
        for record in buffered:
            yield record


# --------------------------------------------------------------------------
# Analysis — pure, no docker, unit-testable
# --------------------------------------------------------------------------

def analyze(records, now, include_info=False):
    """Fold raw (container, ts, line) records into signatures.

    Every retained line is redacted BEFORE it is fingerprinted or sampled, so a
    secret never reaches the baseline file, the digest, or stdout.
    """
    signatures = {}
    per_container_counts = defaultdict(int)
    matched = 0

    for name, stamp, body in records:
        clean = ANSI_RE.sub("", body[:MAX_LINE_CHARS]).strip()
        if not clean:
            continue

        level = detect_level(clean)
        if level is not None:
            # The line states its own level: believe it, in both directions.
            # Keyword matching is only a fallback for lines that say nothing.
            if level in QUIET_LEVELS and not include_info:
                continue
            if level in QUIET_LEVELS and not INCLUDE_RE.search(clean):
                continue
        else:
            if not INCLUDE_RE.search(clean):
                continue
            if EXCLUDE_RE.search(clean):
                continue

        matched += 1
        safe = redact(clean)
        skeleton = skeletonize(safe)
        if not skeleton:
            continue
        finger = fingerprint(name, skeleton)

        when = (stamp or now).isoformat()
        entry = signatures.get(finger)
        if entry is None:
            per_container_counts[name] += 1
            signatures[finger] = {
                "fingerprint": finger,
                "container": name,
                "skeleton": skeleton,
                "sample": safe[:SAMPLE_MAX_CHARS],
                "severity": LEVEL_SEVERITY.get(level) or classify_severity(safe),
                "count": 1,
                "first_seen": when,
                "last_seen": when,
            }
        else:
            entry["count"] += 1
            if when < entry["first_seen"]:
                entry["first_seen"] = when
            if when > entry["last_seen"]:
                entry["last_seen"] = when

    noisy = sorted(
        [name for name, total in per_container_counts.items() if total > MAX_SIGNATURES_PER_CONTAINER]
    )
    return signatures, matched, noisy


# --------------------------------------------------------------------------
# Baseline
# --------------------------------------------------------------------------

def load_state(path):
    if not os.path.exists(path):
        return {"version": 1, "signatures": {}}
    try:
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
    except (ValueError, OSError) as error:
        raise RuntimeError("baseline at {} is unreadable: {}".format(path, error))
    data.setdefault("signatures", {})
    return data


def save_state(path, state, now):
    state["version"] = 1
    state["updated_at"] = now.isoformat()
    directory = os.path.dirname(path)
    if directory:
        os.makedirs(directory, exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as handle:
        json.dump(state, handle, indent=2, sort_keys=True)
        handle.write("\n")
    os.replace(tmp, path)


def median(values):
    if not values:
        return 0.0
    ordered = sorted(values)
    middle = len(ordered) // 2
    if len(ordered) % 2:
        return float(ordered[middle])
    return (ordered[middle - 1] + ordered[middle]) / 2.0


def baseline_rate(entry, today):
    history = [point["count"] for point in entry.get("history", []) if point.get("date") != today]
    if len(history) < SPIKE_MIN_HISTORY_DAYS:
        return None
    return median(history)


def reconcile(state, signatures, now):
    """Diff today's signatures against the baseline; return the report buckets."""
    today = now.date().isoformat()
    known = state["signatures"]

    new_items = []
    spiking = []
    quiet = []

    for finger, found in signatures.items():
        entry = known.get(finger)
        if entry is None:
            record = {
                "container": found["container"],
                "skeleton": found["skeleton"],
                "sample": found["sample"],
                "severity": found["severity"],
                "first_seen": found["first_seen"],
                "last_seen": found["last_seen"],
                "status": STATUS_NEW,
                "note": "",
                "history": [],
            }
            known[finger] = entry = record
            new_items.append(dict(found, baseline=None, status=STATUS_NEW))
        else:
            prior = baseline_rate(entry, today)
            entry["last_seen"] = found["last_seen"]
            entry["sample"] = found["sample"]
            entry["severity"] = found["severity"]
            if (
                entry.get("status") != STATUS_MUTED
                and prior is not None
                and found["count"] >= SPIKE_MIN_COUNT
                and found["count"] >= max(prior * SPIKE_FACTOR, prior + SPIKE_MIN_COUNT)
            ):
                spiking.append(dict(found, baseline=prior, status=entry.get("status", STATUS_NEW)))

        history = [point for point in entry.get("history", []) if point.get("date") != today]
        history.append({"date": today, "count": found["count"]})
        entry["history"] = history[-HISTORY_DAYS:]

    # Signatures with a real habit that went silent today. Sometimes that means
    # you fixed it. Sometimes it means the job that logged it stopped running,
    # which is the more interesting case and the one nothing else would tell you.
    for finger, entry in known.items():
        if finger in signatures or entry.get("status") == STATUS_MUTED:
            continue
        prior = baseline_rate(entry, today)
        recent = [point for point in entry.get("history", []) if point.get("date") == today]
        if prior is not None and prior >= QUIET_MIN_BASELINE and not recent:
            quiet.append(
                {
                    "fingerprint": finger,
                    "container": entry.get("container", "?"),
                    "skeleton": entry.get("skeleton", ""),
                    "sample": entry.get("sample", ""),
                    "severity": entry.get("severity", "other"),
                    "count": 0,
                    "baseline": prior,
                    "status": entry.get("status", STATUS_NEW),
                }
            )
        entry["history"] = ([point for point in entry.get("history", []) if point.get("date") != today]
                            + [{"date": today, "count": 0}])[-HISTORY_DAYS:]

    reportable = [item for item in new_items if known[item["fingerprint"]].get("status") != STATUS_MUTED]
    return reportable, spiking, quiet


def prune(state, now):
    """Drop signatures nothing has seen in a long time; keep mutes forever."""
    cutoff = (now - timedelta(days=PRUNE_AFTER_DAYS)).isoformat()
    keep = {}
    for finger, entry in state["signatures"].items():
        if entry.get("status") == STATUS_MUTED:
            keep[finger] = entry
            continue
        if entry.get("last_seen", "") >= cutoff:
            keep[finger] = entry
    if len(keep) > MAX_SIGNATURES_STORED:
        ordered = sorted(keep.items(), key=lambda pair: pair[1].get("last_seen", ""), reverse=True)
        keep = dict(ordered[:MAX_SIGNATURES_STORED])
    dropped = len(state["signatures"]) - len(keep)
    state["signatures"] = keep
    return dropped


# --------------------------------------------------------------------------
# Publishing — commit the digest into Conductor over HTTPS
# --------------------------------------------------------------------------

def read_publish_token(secrets_dir):
    """Find the publish token, or None. NEVER returns it in an error string.

    Env first (so a wrapper can inject one), then a mode-600 file under
    .secrets/. The file may hold a bare token or a KEY=value line; both are
    accepted, and surrounding quotes are stripped.

    That quote-stripping is not cosmetic. AGENTS.md rule 14 records a
    production migration that broke on 2026-08-25 because a credential fell
    through from a `.env` with its quotes still attached and failed four steps
    later as what looked like a TLS error. Same class of bug, so it is handled
    here rather than discovered at 2am.
    """
    for name in TOKEN_ENV_VARS:
        value = os.environ.get(name, "").strip()
        if value:
            return value

    path = os.path.join(secrets_dir, TOKEN_FILENAME)
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as handle:
            raw = handle.read().strip()
    except OSError:
        return None

    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # Only strip a genuine KEY=value prefix. Matching on an env-var-shaped
        # key (upper snake case) rather than "contains =" matters: GitHub
        # tokens are lower case and can themselves contain '=', so a looser
        # test would silently truncate a valid token to its own tail.
        if re.match(r"^[A-Z][A-Z0-9_]*\s*=", line):
            line = line.split("=", 1)[1].strip()
        return line.strip("\"'")
    return None


GITHUB_API = "https://api.github.com"
REPO_RE = re.compile(r"^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$")
REPO_PATH_RE = re.compile(r"^[A-Za-z0-9._/-]+$")


def validate_publish_target(repo, path):
    """Reject anything that could steer the request somewhere unintended.

    `repo` and `path` reach a URL that carries the publish token, and both come
    from the command line. Neither can escape api.github.com as written, but
    validating them keeps it that way if the URL is ever built differently, and
    a token is not a thing to leave one refactor away from a new host. Also
    blocks `..` traversal in the repo path.
    """
    if not REPO_RE.match(repo or ""):
        return "publish repo must be owner/name, got something else"
    if not path or not REPO_PATH_RE.match(path) or ".." in path or path.startswith("/"):
        return "publish path must be a plain repo-relative path"
    return None


def _github_request(url, token, method="GET", payload=None, timeout=30.0):
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(url, data=data, method=method)
    request.add_header("Authorization", "Bearer {}".format(token))
    request.add_header("Accept", "application/vnd.github+json")
    request.add_header("X-GitHub-Api-Version", "2022-11-28")
    request.add_header("User-Agent", "conductor-container-log-triage")
    if data is not None:
        request.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = response.read().decode("utf-8", "replace")
    return json.loads(body) if body else {}


def publish_digest(digest, token, repo, path, branch, now):
    """Commit the digest to GitHub via the Contents API. Returns (ok, message).

    The Contents API rather than a git clone on the array, deliberately: no
    checkout to keep in sync on Unraid, no git credential helper, no merge race
    against the workflows that also commit to main, and no pack transfer for a
    few KB of JSON. It still lands as an ordinary commit, so `git log -p` on
    this file is the whole point and works exactly as it would otherwise.

    Committed with [skip ci] -- this runs daily and must not spend a full CI
    suite on a state file, matching the repo's other auto-generated commits.

    The returned message NEVER contains the token (hard safety rule 15): the
    caller prints it, and Silas pastes that output back.
    """
    invalid = validate_publish_target(repo, path)
    if invalid:
        return False, invalid
    api = "{}/repos/{}/contents/{}".format(GITHUB_API, repo, path)
    content = json.dumps(digest, indent=2, sort_keys=True) + "\n"
    encoded = base64.b64encode(content.encode("utf-8")).decode("ascii")
    message = "chore(logs): container log digest {} {} [skip ci]".format(
        digest.get("host", "host"), now.date().isoformat()
    )

    last_error = "unknown error"
    for attempt in range(1, PUBLISH_ATTEMPTS + 1):
        sha = None
        try:
            existing = _github_request("{}?ref={}".format(api, branch), token)
            sha = existing.get("sha")
        except urllib.error.HTTPError as error:
            if error.code != 404:
                # 401/403 are terminal: a bad or unscoped token will not fix
                # itself on retry, and hammering it is how tokens get blocked.
                if error.code in (401, 403):
                    return False, "GitHub rejected the token (HTTP {}) — check that it has Contents: write on {}".format(error.code, repo)
                last_error = "HTTP {} reading the current file".format(error.code)
                continue
        except (urllib.error.URLError, OSError, ValueError) as error:
            last_error = "could not reach GitHub: {}".format(error)
            continue

        payload = {"message": message, "content": encoded, "branch": branch}
        if sha:
            payload["sha"] = sha
        try:
            result = _github_request(api, token, method="PUT", payload=payload)
        except urllib.error.HTTPError as error:
            if error.code in (401, 403):
                return False, "GitHub rejected the token (HTTP {}) — check that it has Contents: write on {}".format(error.code, repo)
            if error.code in (409, 422) and attempt < PUBLISH_ATTEMPTS:
                # Someone else committed between our read and our write. Re-read
                # the sha and try again rather than clobbering blindly.
                last_error = "conflict on write (HTTP {}), retrying".format(error.code)
                continue
            last_error = "HTTP {} writing the digest".format(error.code)
            continue
        except (urllib.error.URLError, OSError, ValueError) as error:
            last_error = "could not reach GitHub: {}".format(error)
            continue

        commit = (result.get("commit") or {}).get("sha", "")
        return True, "published to {}:{} as {}".format(repo, path, commit[:9] or "a new commit")

    return False, "publish failed after {} attempts: {}".format(PUBLISH_ATTEMPTS, last_error)


# --------------------------------------------------------------------------
# Output
# --------------------------------------------------------------------------

def build_digest(now, host, since, scan, new_items, spiking, quiet, signatures):
    def trim(items):
        return [
            {
                "fingerprint": item["fingerprint"],
                "container": item["container"],
                "severity": item["severity"],
                "count": item["count"],
                "baseline": item.get("baseline"),
                "sample": item["sample"],
                "skeleton": item["skeleton"],
            }
            for item in items[:MAX_REPORTED]
        ]

    ranked = sorted(signatures.values(), key=lambda item: item["count"], reverse=True)
    return {
        "version": 1,
        "generated_at": now.isoformat(),
        "host": host,
        "window": since,
        "scan": scan,
        "new": trim(sorted(new_items, key=lambda item: item["count"], reverse=True)),
        "spiking": trim(sorted(spiking, key=lambda item: item["count"], reverse=True)),
        "quiet": trim(sorted(quiet, key=lambda item: item.get("baseline") or 0, reverse=True)),
        "top": trim(ranked[:25]),
    }


def render_text(digest):
    lines = []
    scan = digest["scan"]
    lines.append(
        "container log triage — {} — window {}".format(digest["host"], digest["window"])
    )
    lines.append(
        "scanned {}/{} containers, {} lines read, {} matched, {} distinct signatures".format(
            scan["containers_scanned"], scan["containers_total"],
            scan["lines_read"], scan["lines_matched"], scan["signatures_total"],
        )
    )
    if scan["containers_failed"]:
        lines.append("unreadable: " + ", ".join(
            "{} ({})".format(item["container"], item["error"][:60])
            for item in scan["containers_failed"]
        ))
    if scan["truncated"]:
        lines.append("truncated (hit the per-container cap): " + ", ".join(scan["truncated"]))
    if scan["high_cardinality"]:
        lines.append(
            "HIGH CARDINALITY (normalization is not collapsing these; tune skeletonize): "
            + ", ".join(scan["high_cardinality"])
        )

    for title, key in (("NEW", "new"), ("SPIKING", "spiking"), ("WENT QUIET", "quiet")):
        items = digest[key]
        if not items:
            continue
        lines.append("")
        lines.append("{} ({})".format(title, len(items)))
        for item in items:
            if key == "spiking":
                detail = "{}x today vs {:.0f}/day baseline".format(item["count"], item["baseline"] or 0)
            elif key == "quiet":
                detail = "0 today vs {:.0f}/day baseline".format(item["baseline"] or 0)
            else:
                detail = "{}x".format(item["count"])
            lines.append("  [{}] {} · {} · {}".format(
                item["fingerprint"], item["container"], item["severity"], detail))
            lines.append("      {}".format(item["sample"]))
    if not (digest["new"] or digest["spiking"] or digest["quiet"]):
        lines.append("")
        lines.append("nothing new. all signatures are known and steady.")
    return "\n".join(lines)


def render_inventory(signatures, scan):
    lines = ["container log inventory — every distinct signature, ranked",
             "{} containers scanned, {} lines matched, {} distinct signatures".format(
                 scan["containers_scanned"], scan["lines_matched"], scan["signatures_total"])]
    by_container = defaultdict(list)
    for entry in signatures.values():
        by_container[entry["container"]].append(entry)
    for name in sorted(by_container, key=lambda key: -sum(e["count"] for e in by_container[key])):
        entries = sorted(by_container[name], key=lambda item: item["count"], reverse=True)
        lines.append("")
        lines.append("{} — {} signatures, {} lines".format(
            name, len(entries), sum(item["count"] for item in entries)))
        for entry in entries:
            lines.append("  [{}] {:>6}x {} · {}".format(
                entry["fingerprint"], entry["count"], entry["severity"], entry["sample"]))
    return "\n".join(lines)


# --------------------------------------------------------------------------

def manage_status(state, fingers, status, note, state_path, now):
    missing = [finger for finger in fingers if finger not in state["signatures"]]
    for finger in fingers:
        entry = state["signatures"].get(finger)
        if entry is None:
            continue
        entry["status"] = status
        if note:
            entry["note"] = note
    save_state(state_path, state, now)
    changed = len(fingers) - len(missing)
    print("{} {} signature(s)".format(status, changed))
    if missing:
        print("not found in the baseline: " + ", ".join(missing), file=sys.stderr)
        return EXIT_UNRESOLVED
    return EXIT_CLEAN


def main(argv=None):
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--state-dir", default=os.environ.get("TRIAGE_STATE_DIR", DEFAULT_STATE_DIR))
    parser.add_argument("--since", default=DEFAULT_SINCE, help="docker logs --since value")
    parser.add_argument("--tail", type=int, default=DEFAULT_TAIL)
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT,
                        help="per-container read budget in seconds")
    parser.add_argument("--all", action="store_true", help="include stopped containers")
    parser.add_argument("--exclude", action="append", default=[],
                        help="container name to skip (repeatable)")
    parser.add_argument("--inventory", action="store_true",
                        help="first-run mode: rank every signature, ignore and do not write the baseline")
    parser.add_argument("--json", action="store_true", help="print the digest JSON on stdout")
    parser.add_argument("--no-samples", action="store_true",
                        help="omit sample lines entirely; keep only skeletons")
    parser.add_argument(
        "--publish",
        action="store_true",
        help="commit the digest into Conductor so the sweep and daily digest can read it",
    )
    parser.add_argument(
        "--include-info",
        action="store_true",
        help="keep lines whose own level is info/debug/notice (default: drop them)",
    )
    parser.add_argument("--publish-repo", default=PUBLISH_REPO)
    parser.add_argument("--publish-path", default=PUBLISH_PATH)
    parser.add_argument("--publish-branch", default=PUBLISH_BRANCH)
    parser.add_argument(
        "--secrets-dir",
        default=os.environ.get("SECRETS_DIR", DEFAULT_SECRETS_DIR),
        help="directory holding {} (hard rule 14: never under /mnt/user/pc)".format(TOKEN_FILENAME),
    )
    parser.add_argument("--ack", action="append", default=[], metavar="FP")
    parser.add_argument("--mute", action="append", default=[], metavar="FP")
    parser.add_argument("--unmute", action="append", default=[], metavar="FP")
    parser.add_argument("--note", default="", help="note to attach with --ack/--mute")
    args = parser.parse_args(argv)

    now = datetime.now(timezone.utc)
    state_path = os.path.join(args.state_dir, "known.json")
    digest_path = os.path.join(args.state_dir, "digest.json")
    text_path = os.path.join(args.state_dir, "digest.txt")

    try:
        state = load_state(state_path)
    except RuntimeError as error:
        print("container log triage UNRESOLVED: {}".format(error), file=sys.stderr)
        return EXIT_UNRESOLVED

    if args.ack or args.mute or args.unmute:
        if args.ack:
            return manage_status(state, args.ack, STATUS_ACK, args.note, state_path, now)
        if args.mute:
            return manage_status(state, args.mute, STATUS_MUTED, args.note, state_path, now)
        return manage_status(state, args.unmute, STATUS_ACK, args.note, state_path, now)

    try:
        containers = list_containers(include_stopped=args.all)
    except FileNotFoundError:
        print("container log triage UNRESOLVED: docker CLI not found on PATH", file=sys.stderr)
        return EXIT_UNRESOLVED
    except (RuntimeError, subprocess.TimeoutExpired) as error:
        print("container log triage UNRESOLVED: cannot list containers: {}".format(error),
              file=sys.stderr)
        return EXIT_UNRESOLVED

    if not containers:
        print("container log triage UNRESOLVED: docker reported no containers", file=sys.stderr)
        return EXIT_UNRESOLVED

    exclude = set(args.exclude)
    stats = {"failed": [], "truncated": [], "scanned": 0, "lines_read": 0}
    signatures, matched, noisy = analyze(
        collect(containers, args.since, args.tail, args.timeout, exclude, stats),
        now, include_info=args.include_info,
    )

    if args.no_samples:
        for entry in signatures.values():
            entry["sample"] = ""

    scan = {
        "containers_total": len(containers),
        "containers_scanned": stats["scanned"],
        "containers_failed": stats["failed"],
        "truncated": sorted(set(stats["truncated"])),
        "high_cardinality": noisy,
        "lines_read": stats["lines_read"],
        "lines_matched": matched,
        "signatures_total": len(signatures),
    }

    if args.inventory:
        print(render_inventory(signatures, scan))
        return EXIT_CLEAN

    new_items, spiking, quiet = reconcile(state, signatures, now)
    prune(state, now)
    save_state(state_path, state, now)

    digest = build_digest(now, socket.gethostname(), args.since, scan,
                          new_items, spiking, quiet, signatures)

    os.makedirs(args.state_dir, exist_ok=True)
    with open(digest_path, "w", encoding="utf-8") as handle:
        json.dump(digest, handle, indent=2, sort_keys=True)
        handle.write("\n")
    text = render_text(digest)
    with open(text_path, "w", encoding="utf-8") as handle:
        handle.write(text + "\n")

    print(json.dumps(digest, indent=2, sort_keys=True) if args.json else text)

    published_ok = True
    if args.publish:
        token = read_publish_token(args.secrets_dir)
        if not token:
            published_ok = False
            print(
                "publish skipped: no token in {} or {}".format(
                    os.path.join(args.secrets_dir, TOKEN_FILENAME),
                    "/".join(TOKEN_ENV_VARS),
                ),
                file=sys.stderr,
            )
        else:
            published_ok, detail = publish_digest(
                digest, token, args.publish_repo, args.publish_path,
                args.publish_branch, now,
            )
            print(detail, file=sys.stdout if published_ok else sys.stderr)

    # A digest nobody can read is not a clean run, and it outranks findings:
    # if the file never reached the repo then nobody sees those findings
    # anyway. Without this the User Script goes green while the sweep quietly
    # falls back to the last published copy and ages into a staleness warning
    # days later -- the failure this whole pipeline exists to prevent,
    # reproduced one layer up.
    if not published_ok:
        return EXIT_UNRESOLVED
    if digest["new"] or digest["spiking"]:
        return EXIT_FINDINGS
    return EXIT_CLEAN


if __name__ == "__main__":
    sys.exit(main())
