#!/usr/bin/env python3
"""Check that changed registry records stay inside the package they describe.

The crawler that opens these pull requests writes a package's records at a
path built from values the package's own repository controls, and the
pull requests merge without human review. This script is the gate on that:
it refuses any change whose location and contents disagree, so a record
cannot be filed under a package that does not own it.

Reads `git diff --name-status` lines on stdin and exits non-zero on the
first kind of violation it finds:

    git diff --name-status origin/main...HEAD | python3 scripts/validate_package_records.py

Pass --registry-only to also require that every changed path is a package
record, which is what makes a pull request eligible for auto-merge.
"""

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

PACKAGES_ROOT = "data/packages"

# a namespace or package directory is one literal path segment; dots are
# excluded so that "." and ".." cannot be spelled at all
SEGMENT = re.compile(r"[A-Za-z0-9_-]+")

# version filenames carry dots and dashes, but must still begin with an
# alphanumeric, so no filename can be a relative-path component
VERSION = re.compile(r"[0-9A-Za-z][0-9A-Za-z.+-]*")

# where a release may be downloaded from, and which path segment of each
# names the owning GitHub organisation
TARBALL_HOSTS = {
    "codeload.github.com": 0,
    "github.com": 0,
    "raw.githubusercontent.com": 0,
    "public.cdn.getdbt.com": 2,  # /package-hub/dbt-packages/<org>/<repo>/...
}


class Violation(Exception):
    """A change that must not be merged without a human looking at it"""


def url_owner(url: str) -> str:
    """Return the GitHub org a package URL belongs to, or '' if unknown"""
    parsed = urlparse(url)
    owner_index = TARBALL_HOSTS.get(parsed.netloc)
    if owner_index is None:
        raise Violation(f"unrecognised download host {parsed.netloc!r} in {url}")

    segments = parsed.path.strip("/").split("/")
    if len(segments) <= owner_index:
        raise Violation(f"cannot read an owner out of {url}")
    return segments[owner_index]


def check_urls(record: dict, namespace: str, where: str, warnings: list) -> None:
    """Every URL in a record must point at the namespace that owns it"""
    downloads = record.get("downloads") or {}
    source = record.get("_source") or {}

    urls = [downloads.get("tarball"), source.get("url"), source.get("readme")]
    mirror = downloads.get("hub") or {}
    urls.append(mirror.get("tarball"))

    for url in [u for u in urls if u]:
        owner = url_owner(url)
        if owner.lower() != namespace.lower():
            raise Violation(
                f"{where}: URL belongs to {owner!r}, not to {namespace!r}: {url}"
            )

    # The mirror is meant to be the same bytes as the source tarball, but
    # GitHub builds codeload archives on demand and they are not reproducible
    # byte for byte, so a mismatch is worth surfacing rather than refusing.
    if mirror and mirror.get("sha1") != downloads.get("sha1"):
        warnings.append(f"{where}: the hub mirror's sha1 differs from the tarball's")


def split_record_path(path: str) -> tuple[str, str, str]:
    """Split a registry path, rejecting any shape the crawler never writes

    Returns (namespace, package, version), where version is '' for an
    index.json.
    """
    parts = Path(path).parts
    if parts[:2] != ("data", "packages"):
        raise Violation(f"{path}: not a package record")

    rest = parts[2:]
    if len(rest) == 3 and rest[2] == "index.json":
        namespace, package, version = rest[0], rest[1], ""
    elif len(rest) == 4 and rest[2] == "versions" and rest[3].endswith(".json"):
        namespace, package, version = rest[0], rest[1], rest[3][: -len(".json")]
    else:
        raise Violation(
            f"{path}: expected <namespace>/<package>/index.json or "
            f"<namespace>/<package>/versions/<version>.json"
        )

    for label, segment in (("namespace", namespace), ("package", package)):
        if not SEGMENT.fullmatch(segment):
            raise Violation(f"{path}: {label} {segment!r} is not a plain directory name")
    if version and not VERSION.fullmatch(version):
        raise Violation(f"{path}: version {version!r} is not a plain version")

    return namespace, package, version


def check_record(path: str, repo_root: Path, warnings: list) -> None:
    """A record must agree with the directory it is filed under"""
    namespace, package, version = split_record_path(path)

    full_path = repo_root / path
    try:
        record = json.loads(full_path.read_text())
    except json.JSONDecodeError as e:
        raise Violation(f"{path}: not valid JSON: {e}")
    except OSError as e:
        raise Violation(f"{path}: cannot be read: {e}")

    if not isinstance(record, dict):
        raise Violation(f"{path}: expected a JSON object")

    if record.get("name") != package:
        raise Violation(
            f"{path}: record names package {record.get('name')!r}, "
            f"but is filed under {package!r}"
        )

    if version:
        if record.get("version") != version:
            raise Violation(
                f"{path}: record is version {record.get('version')!r}, "
                f"but is filed as {version!r}"
            )
        expected_id = f"{namespace}/{package}/{version}"
        if record.get("id") != expected_id:
            raise Violation(
                f"{path}: record id {record.get('id')!r} should be {expected_id!r}"
            )
        check_urls(record, namespace, path, warnings)
    else:
        if record.get("namespace") != namespace:
            raise Violation(
                f"{path}: index claims namespace {record.get('namespace')!r}, "
                f"but is filed under {namespace!r}"
            )


def parse_diff(lines: list[str]) -> list[tuple[str, str]]:
    """Turn `git diff --name-status` output into (status, path) pairs"""
    changes = []
    for line in lines:
        line = line.rstrip("\n")
        if not line:
            continue
        fields = line.split("\t")
        if len(fields) < 2:
            raise Violation(f"cannot parse diff line: {line!r}")
        # a rename reports both paths; the destination is what now exists
        changes.append((fields[0], fields[-1]))
    return changes


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--registry-only",
        action="store_true",
        help="require every changed path to be a package record",
    )
    parser.add_argument(
        "--repo-root", default=".", help="root of the checked-out repository"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="ignore stdin and check every record in the repository",
    )
    args = parser.parse_args()
    repo_root = Path(args.repo_root)
    warnings: list[str] = []

    try:
        if args.all:
            changes = [
                ("M", str(p.relative_to(repo_root)))
                for p in sorted((repo_root / PACKAGES_ROOT).rglob("*.json"))
            ]
        else:
            changes = parse_diff(sys.stdin.readlines())

        records = []
        for status, path in changes:
            is_record = path.startswith(PACKAGES_ROOT + "/")

            if not is_record:
                if args.registry_only:
                    raise Violation(
                        f"{path}: not a package record, so this change cannot "
                        f"be merged without review"
                    )
                continue

            # the crawler only ever adds a version or rewrites an index
            if status not in ("A", "M"):
                raise Violation(
                    f"{path}: records may only be added or modified, got status "
                    f"{status!r}"
                )
            records.append(path)

        for path in records:
            check_record(path, repo_root, warnings)

    except Violation as e:
        print(f"REFUSED: {e}", file=sys.stderr)
        return 1

    for warning in warnings:
        print(f"warning: {warning}")
    print(f"ok: {len(records)} package record(s) checked")
    return 0


if __name__ == "__main__":
    sys.exit(main())
