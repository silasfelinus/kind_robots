"""Tests for container_log_triage's pure analysis path.

The redaction tests are the load-bearing ones. AGENTS.md hard safety rule 15
says a command handed to a human must be INCAPABLE of printing a secret, and
this script prints log lines from ~50 containers straight into a terminal whose
output Silas will paste back. Three prior incidents in this repo (conductor/
t-116, t-128, and the 2026-08-25 session that printed a live production
password) came from knowing that rule and writing the unredacted command anyway.
So: every secret shape gets a test, and the catch-all net gets one too.
"""

import importlib.util
import os
from datetime import datetime, timezone

# The module under test is a standalone file that Alexandria runs directly off
# this checkout -- `scripts/` here IS `/mnt/user/appdata/kind_robots/scripts/`
# on the box, refreshed by the auto-deploy pull every five minutes. It is not
# importable by name, so these tests reach it by path.
#
# They live in this repo rather than Conductor because the script does: a
# redaction bug is a hard-safety-rule failure (AGENTS.md 15) and the tests have
# to run in the same CI that gates the file being deployed. Tests one repo away
# from the code they guard are tests that stop running.
_MODULE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "scripts", "container_log_triage.py",
)
_spec = importlib.util.spec_from_file_location("container_log_triage", _MODULE_PATH)
triage = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(triage)

analyze = triage.analyze
classify_severity = triage.classify_severity
fingerprint = triage.fingerprint
parse_docker_timestamp = triage.parse_docker_timestamp
reconcile = triage.reconcile
redact = triage.redact
skeletonize = triage.skeletonize

NOW = datetime(2026, 9, 3, 12, 0, 0, tzinfo=timezone.utc)


# --------------------------------------------------------------------------
# Redaction
# --------------------------------------------------------------------------

def fake(*parts):
    """Assemble a throwaway credential value at runtime.

    Nothing in this file is a real credential, but a secret scanner cannot know
    that: GitGuardian runs on every PR in this repo and flagged four of these
    fixtures as hardcoded secrets when they were written as plain literals
    (PR #3576). That is correct behavior for a scanner, and the wrong fix is an
    ignore rule -- excluding this file would also blind it to a real secret
    landing here later. Joining fragments at runtime keeps every tested shape
    byte-for-byte exact while leaving no secret-shaped literal in the source.
    """
    return "".join(parts)


def assert_scrubbed(line, secret):
    cleaned = redact(line)
    assert secret not in cleaned, "leaked {!r} from {!r} -> {!r}".format(secret, line, cleaned)
    return cleaned


def test_redacts_key_value_pairs():
    secret = fake("hunter2", "swordfish")
    assert_scrubbed("db connect failed password={}".format(secret), secret)
    api = fake("sk-", "abcdef123456")
    assert_scrubbed("auth error: api_key={}".format(api), api)
    token = fake("abc123", "def456")
    assert_scrubbed('{{"token": "{}"}}'.format(token), token)
    client = fake("s3cr3t", "-value")
    assert_scrubbed("client_secret: '{}'".format(client), client)
    simple = fake("let", "mein")
    assert_scrubbed("ERROR passwd={}".format(simple), simple)


def test_redacts_bearer_and_jwt():
    bearer = fake("abcdefgh", "ijklmnop")
    assert_scrubbed("401 denied Authorization: Bearer {}".format(bearer), bearer)
    # Split on the dots as well as within each segment: the three-part dotted
    # structure is what a JWT detector keys on.
    jwt = ".".join([
        fake("eyJhbGciOiJI", "UzI1NiJ9"),
        fake("eyJzdWIiOiIx", "MjM0NTY3ODkwIn0"),
        fake("dBjftJeZ4CVPmB", "92K27uhbUJU1p1r"),
    ])
    assert_scrubbed("token rejected {}".format(jwt), jwt)


def test_redacts_url_userinfo_and_query():
    dbpass = fake("tiger", "123")
    assert_scrubbed("mysql://kindrobot:{}@alexandria/db timed out".format(dbpass), dbpass)
    param = fake("ZXCVBNM", "12345")
    assert_scrubbed("GET /cb?access_key={} failed".format(param), param)


def test_redacts_pem_block():
    # The armor markers are assembled as well as the body. Beyond GitGuardian,
    # this repo runs its own secret grep in CI ("Static checks" in ci.yml) that
    # matches `BEGIN <TYPE> PRIVATE KEY` as a literal, and a PEM header in a
    # test fixture trips it exactly like a real key would.
    head = "-----{}-----".format(fake("BEGIN ", "RSA ", "PRIVATE", " KEY"))
    foot = "-----{}-----".format(fake("END ", "RSA ", "PRIVATE", " KEY"))
    body = fake("MIIEowIBAAK", "CAQEA")
    pem = "{}\n{}\n{}".format(head, body, foot)
    assert_scrubbed("cert error {}".format(pem), body)


def test_redacts_high_entropy_blob_the_denylist_would_miss():
    # The net: an unlabelled 40-char credential with no giveaway key name. This
    # is the case a pure denylist cannot catch, and the reason the net exists.
    blob = fake("aB3dEf7hIj0lMn5pQr8t", "Uv1xYz4bCd6fGh9jKl2m")
    assert_scrubbed("upstream rejected {} unauthorized".format(blob), blob)


def test_redacts_email():
    assert_scrubbed("login failed for silasfelinus@gmail.com", "silasfelinus@gmail.com")


def test_redacts_keyword_that_is_not_on_a_word_boundary():
    """Found by adversarial testing, not by review: `\bpassword\b` never matches
    inside PGPASSWORD, because G->P is not a word boundary. The first version of
    this script leaked a live-looking value on exactly that shape, so the key
    name is now matched as a suffix of the identifier."""
    pg = fake("Tr0ub4", "dor&3")
    assert_scrubbed("PGPASSWORD={} psql connect failed".format(pg), pg)
    root = fake("rootpw", "999")
    assert_scrubbed("MYSQL_ROOT_PASSWORD={} denied".format(root), root)
    pwd = fake("letmein", "22")
    assert_scrubbed("error DB_PWD={}".format(pwd), pwd)
    header = fake("qqqwwweee", "111")
    assert_scrubbed("failed X-Auth-Token: {}".format(header), header)


def test_redacts_url_with_empty_username():
    """redis://:password@host — the userinfo pattern required a non-empty
    username and let this common shape straight through."""
    secret = fake("mypassword", "123")
    assert_scrubbed("timeout on redis://:{}@cache:6379".format(secret), secret)


def test_suffix_matching_does_not_eat_ordinary_words():
    # The suffix rule must not fire on `pass` inside `passed`, or every log line
    # reporting a successful check would come back redacted.
    assert redact("all 12 tests passed=true") == "all 12 tests passed=true"
    assert "REDACTED" not in redact("ERROR upstream refused connection after 3 retries")


def test_redaction_keeps_the_line_useful():
    secret = fake("hunt", "er2")
    cleaned = redact("ERROR db connect failed password={} host=alexandria port=3306".format(secret))
    assert "db connect failed" in cleaned
    assert "alexandria" in cleaned
    assert secret not in cleaned


def test_ordinary_lines_survive_untouched():
    line = "WARN cache miss for user profile, falling back to origin"
    assert redact(line) == line


# --------------------------------------------------------------------------
# Skeletonization
# --------------------------------------------------------------------------

def test_variable_parts_collapse_to_one_signature():
    a = skeletonize("connection to 192.168.7.172:3306 failed after 1500ms")
    b = skeletonize("connection to 10.0.0.9:5432 failed after 87ms")
    assert a == b


def test_uuid_and_hex_collapse():
    a = skeletonize("job 550e8400-e29b-41d4-a716-446655440000 failed")
    b = skeletonize("job 6ba7b810-9dad-11d1-80b4-00c04fd430c8 failed")
    assert a == b


def test_quoted_payloads_collapse():
    a = skeletonize('failed to load model "flux2-dev.safetensors"')
    b = skeletonize('failed to load model "sdxl-turbo.safetensors"')
    assert a == b


def test_paths_collapse():
    a = skeletonize("cannot read /mnt/user/appdata/plex/cache.db")
    b = skeletonize("cannot read /mnt/user/appdata/sonarr/other.db")
    assert a == b


def test_genuinely_different_errors_stay_distinct():
    a = skeletonize("connection refused")
    b = skeletonize("permission denied")
    assert a != b


def test_timestamps_do_not_split_a_signature():
    a = skeletonize("2026-09-03T04:00:01Z backup failed")
    b = skeletonize("2026-09-04T05:12:44Z backup failed")
    assert a == b


def test_fingerprint_is_per_container():
    skeleton = skeletonize("connection refused")
    assert fingerprint("plex", skeleton) != fingerprint("sonarr", skeleton)
    assert fingerprint("plex", skeleton) == fingerprint("plex", skeleton)


# --------------------------------------------------------------------------
# Selection and severity
# --------------------------------------------------------------------------

def test_analyze_keeps_only_error_ish_lines():
    records = [
        ("plex", NOW, "INFO everything is fine"),
        ("plex", NOW, "ERROR database is locked"),
        ("plex", NOW, "200 GET /web/index.html"),
    ]
    signatures, matched, _ = analyze(records, NOW)
    assert matched == 1
    assert len(signatures) == 1


def test_analyze_drops_absence_of_errors():
    records = [
        ("radarr", NOW, "scan complete with 0 errors"),
        ("radarr", NOW, "health check: errors=0"),
    ]
    signatures, matched, _ = analyze(records, NOW)
    assert matched == 0
    assert signatures == {}


def test_analyze_counts_repeats_as_one_signature():
    records = [("nginx", NOW, "upstream timed out after {}ms".format(n)) for n in range(50)]
    signatures, matched, _ = analyze(records, NOW)
    assert matched == 50
    assert len(signatures) == 1
    assert list(signatures.values())[0]["count"] == 50


def test_analyze_redacts_before_storing_the_sample():
    secret = fake("hunter2", "swordfish")
    records = [("db", NOW, "FATAL auth failed password={}".format(secret))]
    signatures, _, _ = analyze(records, NOW)
    entry = list(signatures.values())[0]
    assert secret not in entry["sample"]
    assert secret not in entry["skeleton"]


def test_severity_picks_the_worst_class():
    assert classify_severity("FATAL panic in worker") == "fatal"
    assert classify_severity("ERROR could not connect") == "error"
    assert classify_severity("WARN deprecated option") == "warn"


# --------------------------------------------------------------------------
# Baseline reconciliation
# --------------------------------------------------------------------------

def build_state(counts, status="acknowledged"):
    skeleton = skeletonize("upstream timed out")
    finger = fingerprint("nginx", skeleton)
    return finger, {
        "version": 1,
        "signatures": {
            finger: {
                "container": "nginx",
                "skeleton": skeleton,
                "sample": "upstream timed out",
                "severity": "error",
                "first_seen": "2026-08-01T00:00:00+00:00",
                "last_seen": "2026-09-02T00:00:00+00:00",
                "status": status,
                "note": "",
                "history": [
                    {"date": "2026-08-{:02d}".format(20 + i), "count": c}
                    for i, c in enumerate(counts)
                ],
            }
        },
    }


def today_signatures(count):
    skeleton = skeletonize("upstream timed out")
    finger = fingerprint("nginx", skeleton)
    return {
        finger: {
            "fingerprint": finger,
            "container": "nginx",
            "skeleton": skeleton,
            "sample": "upstream timed out",
            "severity": "error",
            "count": count,
            "first_seen": NOW.isoformat(),
            "last_seen": NOW.isoformat(),
        }
    }


def test_unknown_signature_is_new():
    state = {"version": 1, "signatures": {}}
    new_items, spiking, quiet = reconcile(state, today_signatures(3), NOW)
    assert len(new_items) == 1
    assert not spiking and not quiet


def test_known_steady_signature_is_silent():
    _, state = build_state([10, 12, 11, 9])
    new_items, spiking, quiet = reconcile(state, today_signatures(11), NOW)
    assert not new_items and not spiking and not quiet


def test_rate_spike_is_reported():
    _, state = build_state([10, 12, 11, 9])
    new_items, spiking, quiet = reconcile(state, today_signatures(4000), NOW)
    assert len(spiking) == 1
    assert spiking[0]["count"] == 4000


def test_muted_signature_never_reports_even_when_spiking():
    _, state = build_state([10, 12, 11, 9], status="muted")
    new_items, spiking, quiet = reconcile(state, today_signatures(4000), NOW)
    assert not spiking and not new_items


def test_signature_going_quiet_is_reported():
    _, state = build_state([40, 38, 42, 39])
    new_items, spiking, quiet = reconcile(state, {}, NOW)
    assert len(quiet) == 1
    assert quiet[0]["baseline"] >= 10


def test_no_spike_without_enough_history():
    _, state = build_state([10])
    new_items, spiking, quiet = reconcile(state, today_signatures(5000), NOW)
    assert not spiking


def test_history_is_bounded():
    _, state = build_state([5] * 40)
    reconcile(state, today_signatures(5), NOW)
    entry = list(state["signatures"].values())[0]
    assert len(entry["history"]) <= 21


# --------------------------------------------------------------------------
# Docker timestamp parsing
# --------------------------------------------------------------------------

def test_parses_rfc3339_nano():
    parsed = parse_docker_timestamp("2026-09-03T21:14:02.123456789Z")
    assert parsed.year == 2026 and parsed.hour == 21 and parsed.tzinfo is not None


def test_parses_offset_timestamp():
    parsed = parse_docker_timestamp("2026-09-03T21:14:02.123-07:00")
    assert parsed.tzinfo is not None


def test_bad_timestamp_returns_none():
    assert parse_docker_timestamp("not-a-timestamp") is None


# --------------------------------------------------------------------------
# Publishing
# --------------------------------------------------------------------------

read_publish_token = triage.read_publish_token
publish_digest = triage.publish_digest


def test_token_comes_from_env_first(tmp_path, monkeypatch):
    monkeypatch.setenv("CONDUCTOR_PUBLISH_TOKEN", "from-env")
    assert read_publish_token(str(tmp_path)) == "from-env"


def test_token_read_from_secrets_file(tmp_path, monkeypatch):
    for name in triage.TOKEN_ENV_VARS:
        monkeypatch.delenv(name, raising=False)
    path = tmp_path / triage.TOKEN_FILENAME
    path.write_text("plain-token-value\n", encoding="utf-8")
    assert read_publish_token(str(tmp_path)) == "plain-token-value"


def test_token_file_accepts_key_equals_value_and_strips_quotes(tmp_path, monkeypatch):
    """AGENTS.md rule 14: a credential that fell through from a .env with its
    quotes still attached broke a production migration on 2026-08-25 and
    surfaced four steps later as what looked like a TLS error."""
    for name in triage.TOKEN_ENV_VARS:
        monkeypatch.delenv(name, raising=False)
    path = tmp_path / triage.TOKEN_FILENAME
    path.write_text('# comment\nCONDUCTOR_PUBLISH_TOKEN="quoted-token"\n', encoding="utf-8")
    assert read_publish_token(str(tmp_path)) == "quoted-token"


def test_missing_token_returns_none(tmp_path, monkeypatch):
    for name in triage.TOKEN_ENV_VARS:
        monkeypatch.delenv(name, raising=False)
    assert read_publish_token(str(tmp_path)) is None


def http_error(code):
    import urllib.error
    return urllib.error.HTTPError("https://api.github.com", code, "err", {}, None)


def test_publish_creates_the_file_when_absent(monkeypatch):
    calls = []

    def fake(url, token, method="GET", payload=None, timeout=30.0):
        calls.append((method, payload))
        if method == "GET":
            raise http_error(404)
        return {"commit": {"sha": "abc123def456"}}

    monkeypatch.setattr(triage, "_github_request", fake)
    ok, detail = publish_digest({"host": "alexandria"}, "tok", "o/r", "p.json", "main", NOW)
    assert ok
    assert "abc123def" in detail
    # No sha on a create, and the commit must not spend a CI run.
    put = [payload for method, payload in calls if method == "PUT"][0]
    assert "sha" not in put
    assert "[skip ci]" in put["message"]


def test_publish_updates_with_existing_sha(monkeypatch):
    seen = {}

    def fake(url, token, method="GET", payload=None, timeout=30.0):
        if method == "GET":
            return {"sha": "oldsha123"}
        seen["payload"] = payload
        return {"commit": {"sha": "newsha456"}}

    monkeypatch.setattr(triage, "_github_request", fake)
    ok, _ = publish_digest({"host": "alexandria"}, "tok", "o/r", "p.json", "main", NOW)
    assert ok
    assert seen["payload"]["sha"] == "oldsha123"


def test_publish_retries_a_write_conflict(monkeypatch):
    attempts = {"put": 0}

    def fake(url, token, method="GET", payload=None, timeout=30.0):
        if method == "GET":
            return {"sha": "sha-{}".format(attempts["put"])}
        attempts["put"] += 1
        if attempts["put"] == 1:
            raise http_error(409)
        return {"commit": {"sha": "settled99"}}

    monkeypatch.setattr(triage, "_github_request", fake)
    ok, detail = publish_digest({"host": "a"}, "tok", "o/r", "p.json", "main", NOW)
    assert ok and attempts["put"] == 2


def test_publish_does_not_retry_a_rejected_token(monkeypatch):
    attempts = {"n": 0}

    def fake(url, token, method="GET", payload=None, timeout=30.0):
        attempts["n"] += 1
        raise http_error(403)

    monkeypatch.setattr(triage, "_github_request", fake)
    ok, detail = publish_digest({"host": "a"}, "tok", "o/r", "p.json", "main", NOW)
    assert not ok
    # Terminal: hammering a bad token is how tokens get blocked.
    assert attempts["n"] == 1
    assert "Contents: write" in detail


def test_publish_failure_message_never_contains_the_token(monkeypatch):
    secret = fake("super", "secret-token-value")

    def boom(url, token, method="GET", payload=None, timeout=30.0):
        raise http_error(500)

    monkeypatch.setattr(triage, "_github_request", boom)
    ok, detail = publish_digest({"host": "a"}, secret, "o/r", "p.json", "main", NOW)
    assert not ok
    assert secret not in detail


def test_publish_gives_up_after_the_attempt_budget(monkeypatch):
    attempts = {"n": 0}

    def flaky(url, token, method="GET", payload=None, timeout=30.0):
        attempts["n"] += 1
        raise http_error(500)

    monkeypatch.setattr(triage, "_github_request", flaky)
    ok, _ = publish_digest({"host": "a"}, "tok", "o/r", "p.json", "main", NOW)
    assert not ok
    assert attempts["n"] == triage.PUBLISH_ATTEMPTS


def test_token_file_does_not_truncate_a_token_containing_equals(tmp_path, monkeypatch):
    """A looser "contains =" test would cut this token down to its own tail.
    GitHub tokens are lower case and may contain '=', so only an env-var-shaped
    upper-snake-case key counts as a KEY=value prefix."""
    for name in triage.TOKEN_ENV_VARS:
        monkeypatch.delenv(name, raising=False)
    token = fake("github_pat_11ABCDE", "=xyz==")
    path = tmp_path / triage.TOKEN_FILENAME
    path.write_text(token + "\n", encoding="utf-8")
    assert read_publish_token(str(tmp_path)) == token


# --------------------------------------------------------------------------
# Backtracking — every input here is arbitrary text written by 50 containers
# --------------------------------------------------------------------------

def test_redact_is_linear_on_a_hostile_line():
    """CodeQL caught this as polynomial ReDoS on uncontrolled data, correctly.

    The key=value patterns let a greedy prefix restart at every position inside
    a long token, backtracking through every keyword alternative each time.
    Measured before the fix: 3k chars 1.7s, 6k chars 6.7s, 12k chars 23.8s. One
    long line -- a stack trace, a base64 payload, the `guid IN (...)` SQL that
    podgrab really does log -- would have stalled the nightly run for minutes.

    The bound is deliberately loose (1000x the fixed timing) so this asserts the
    complexity class rather than the speed of whatever runner it lands on. The
    quadratic version would blow it by an order of magnitude.
    """
    import time

    line = "ERROR " + "aB3" * 20000  # 60k chars, one unbroken token
    start = time.time()
    redact(line)
    assert time.time() - start < 2.0


def test_redact_is_linear_on_a_long_quoted_list():
    """The shape podgrab logs verbatim: hundreds of quoted mixed-case ids."""
    import time

    line = "SELECT * WHERE guid IN (" + ",".join('"%s"' % ("a1b2c3d4" * 5) for _ in range(500)) + ")"
    start = time.time()
    redact(line)
    assert time.time() - start < 2.0


def test_long_lines_are_bounded_before_any_regex_runs():
    assert len(redact("x" * 50000)) <= triage.MAX_LINE_CHARS


def test_analyze_truncates_before_fingerprinting():
    records = [("chatty", NOW, "ERROR " + "z" * 50000)]
    signatures, matched, _ = analyze(records, NOW)
    assert matched == 1
    entry = list(signatures.values())[0]
    assert len(entry["sample"]) <= triage.SAMPLE_MAX_CHARS


# --------------------------------------------------------------------------
# Stated log level beats keyword guessing
# --------------------------------------------------------------------------

detect_level = triage.detect_level


def kept(line, container="x", include_info=False):
    signatures, _, _ = analyze([(container, NOW, line)], NOW, include_info=include_info)
    return list(signatures.values())[0] if signatures else None


def test_media_titles_no_longer_read_as_errors():
    """From Silas's 2026-09-03 inventory. A library full of films called Fail
    Safe, Panic and Trial & Error is adversarial input to a keyword classifier:
    these are all INFO lines that scored fatal/error on a word in a TITLE."""
    for line in (
        "[Info] ReleaseSearchService: Searching indexer(s): [NZBgeek] for Term: [Critical Role]",
        "[Info] DiskScanService: Scanning Panic (2021)",
        "[Info] RefreshSeriesService: Skipping refresh of series: Trial & Error",
        "[Info] DiskScanService: Scanning disk for Fail Safe",
        "[Info] RefreshSeriesService: Skipping refresh of series: Komi Can't Communicate",
    ):
        assert kept(line) is None, line


def test_debug_and_info_chatter_is_dropped():
    assert kept("2026-09-03T12:10:00Z [debug][Watchlist Sync]: Failed to create media request") is None
    assert kept("2026-09-03 16:52:08,215::INFO::[newsunpack:1714] Cannot Quick-check missing file") is None


def test_include_info_restores_them():
    line = "2026-09-03 16:52:08,215::INFO::[decoder:184] CRC Error in abc"
    assert kept(line) is None
    assert kept(line, include_info=True) is not None


def test_stated_level_sets_severity():
    cases = (
        ("[Error] DownloadMonitoringService: Couldn't process tracked download", "error"),
        ("[Warn] HttpClient: HTTP Error - Res: 510.NotExtended", "warn"),
        ('level=error msg="check failed: error on pinging the mysql database"', "error"),
        ("2026-09-03 04:17:47 - ERROR :: CP Server Thread-7 : PlexTV called, but no token", "error"),
        ("[Thu Sep 03 2026] [php:error] [pid 1063] PHP Fatal error: undefined function", "error"),
        ("WARN  2026-09-03T00:56:48 StaticFileController: detected forbidden characters", "warn"),
        ('{"level":"error","ts":1788400943,"msg":"Error getting response"}', "error"),
        ("[05:37:16] [WRN] [63] WebSocketConnection: error receiving data", "warn"),
    )
    for line, expected in cases:
        entry = kept(line)
        assert entry is not None, line
        assert entry["severity"] == expected, (line, entry["severity"])


def test_lines_without_a_stated_level_still_use_keywords():
    assert kept("Thu Sep  3 00:03:39 2026 RESOLVE: Cannot resolve host address") is not None
    assert kept("upstream connection refused") is not None
    assert kept("everything is completely fine") is None


def test_detect_level_returns_none_when_unstated():
    assert detect_level("RESOLVE: Cannot resolve host address") is None


# --------------------------------------------------------------------------
# Paths with spaces
# --------------------------------------------------------------------------

def bazarr(path):
    return ("subtitles", NOW,
            "2026-09-03 04:45:58 - root (149f) :  ERROR (video_analyzer:325) - "
            "BAZARR ffprobe cannot analyze this video file " + path)


def test_media_paths_with_spaces_collapse_to_one_signature():
    """The whole library uses spaces, so the tight path rule stopped at the
    first one and every filename became its own signature -- 51 for bazarr
    where there were about six real problems."""
    records = [bazarr(p) for p in (
        "/pc/tv/anime/vampire knight/s02/vampire knight (2008) - s02e06 [bluray-1080p remux].mkv",
        "/pc/movies/comedy/hot property (2016)/hot property (2016) {imdb-tt3515318}-rarbg.mp4",
        "/pc/movies/horror/alone in the dark (1982)/alone in the dark.mkv",
        "/pc/movies/fantasy/beowulf (1999)/beowulf (1999).mkv",
    )]
    signatures, _, _ = analyze(records, NOW)
    assert len(signatures) == 1
    assert list(signatures.values())[0]["count"] == 4


def test_a_trailing_clause_after_the_path_collapses_too():
    records = [
        ("subtitles", NOW,
         "2026-09-02 17:00:47 - root (149f) :  ERROR (series:203) - BAZARR cannot update "
         "series /pc/tv/unsorted/" + title + " because of (sqlite3.IntegrityError) UNIQUE constraint")
        for title in ("blade runner 2099 (2026)", "earth abides (2024)",
                      "song of the samurai (2026)", "the secret lives of animals (2024)")
    ]
    signatures, _, _ = analyze(records, NOW)
    assert len(signatures) == 1


def test_distinct_errors_still_stay_distinct():
    records = [
        ("radarr", NOW, "[Error] VideoFileInfoReader: Unable to parse media info from: /pc/a b/c.mkv"),
        ("radarr", NOW, "[Error] Sabnzbd: Downloading nzb for movie 'X' failed"),
        ("radarr", NOW, "[Warn] Torznab: API Request Limit reached for LimeTorrents"),
    ]
    signatures, _, _ = analyze(records, NOW)
    assert len(signatures) == 3


# --------------------------------------------------------------------------
# Publish target validation
# --------------------------------------------------------------------------

def test_publish_target_accepts_the_real_one():
    assert triage.validate_publish_target(
        "silasfelinus/conductor", "ops/home-server/CONTAINER-LOG-DIGEST.json") is None


def test_publish_target_rejects_traversal_and_odd_repos():
    for repo, path in (
        ("silasfelinus/conductor", "../../etc/passwd"),
        ("silasfelinus/conductor", "/absolute/path.json"),
        ("not-a-repo", "ops/x.json"),
        ("evil.com/a/b", "ops/x.json"),
        ("silasfelinus/conductor", ""),
    ):
        assert triage.validate_publish_target(repo, path) is not None, (repo, path)


def test_publish_refuses_an_invalid_target_without_calling_github(monkeypatch):
    called = {"n": 0}

    def fake(*args, **kwargs):
        called["n"] += 1
        return {}

    monkeypatch.setattr(triage, "_github_request", fake)
    ok, detail = publish_digest({"host": "a"}, "tok", "silasfelinus/conductor",
                                "../../../etc/passwd", "main", NOW)
    assert not ok and called["n"] == 0


def test_an_english_contraction_does_not_open_a_quoted_string():
    """From the 2026-09-04 tuned run: sonarr showed 104 signatures where about
    ten were real, 75 of them one per episode of the same show. The apostrophe
    in `Couldn't` matched before the real opening quote, consuming
    `'t add release '` and leaving every release NAME bare and distinct."""
    def line(ep):
        return ("[Warn] ProcessDownloadDecisions: Couldn't add release "
                "'[nekotan] Hajime no Ippo S01E%02d v2 (BD Remux 1080p) [Dual Audio]' "
                "from Indexer NzbPlanet (Prowlarr) to download queue." % ep)
    assert len({skeletonize(line(i)) for i in range(1, 76)}) == 1


def test_contraction_fix_keeps_distinct_warnings_apart():
    distinct = {
        skeletonize("[Warn] ProcessDownloadDecisions: Couldn't add release 'X' from Indexer"),
        skeletonize("[Warn] Newznab: Indexer Nzb.su rss sync didn't cover the period"),
        skeletonize("[Error] Sabnzbd: Downloading nzb for episode 'X' failed"),
    }
    assert len(distinct) == 3


def test_bracketed_timestamp_then_level_is_detected():
    """ownfoil: `[2026-09-03 19:50:08.917] WARNING (verification) ...`. Its 3,999
    retries scored `error` off the word "failed" while the line says WARNING."""
    line = ("[2026-09-03 19:50:08.917] WARNING (verification) worker-2 "
            "Verification of a title failed: read returned empty 0x1762c000")
    assert detect_level(line) == "warning"
    entry = kept(line)
    assert entry is not None and entry["severity"] == "warn"
