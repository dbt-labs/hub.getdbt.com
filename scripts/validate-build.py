#!/usr/bin/env python3
"""Validate the built hub site's API output.

Usage:
    # Validate a local build directory (default: build/)
    python3 scripts/validate-build.py

    # Validate a specific build directory
    python3 scripts/validate-build.py /path/to/build

    # Validate a live URL
    python3 scripts/validate-build.py https://hub.getdbt.com
"""

import json
import sys
import os
from pathlib import Path

MIN_PACKAGE_COUNT = 100
REQUIRED_PACKAGE_FIELDS = {"name", "namespace", "versions", "latest"}
REQUIRED_VERSION_FIELDS = {"id", "name", "version"}


def load_json_file(path):
    with open(path) as f:
        return json.load(f)


def load_json_url(url):
    from urllib.request import urlopen, Request

    req = Request(url, headers={"User-Agent": "hub-validate"})
    with urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def validate_packages_index(data, source):
    """Validate the packages.json index."""
    errors = []

    if not isinstance(data, dict):
        errors.append(f"packages.json: expected JSON object, got {type(data).__name__}")
        return errors

    if len(data) < MIN_PACKAGE_COUNT:
        errors.append(
            f"packages.json: expected at least {MIN_PACKAGE_COUNT} packages, got {len(data)}"
        )

    for pkg_name, pkg in data.items():
        if not isinstance(pkg, dict):
            errors.append(f"packages.json[{pkg_name!r}]: expected object, got {type(pkg).__name__}")
            continue

        missing = REQUIRED_PACKAGE_FIELDS - set(pkg.keys())
        if missing:
            errors.append(f"packages.json[{pkg_name!r}]: missing fields: {missing}")
            continue

        if "/" not in pkg_name:
            errors.append(f"packages.json[{pkg_name!r}]: key should be 'org/name' format")

        if not isinstance(pkg["versions"], dict) or len(pkg["versions"]) == 0:
            errors.append(f"packages.json[{pkg_name!r}]: versions should be a non-empty object")

    return errors


def validate_package_file(data, source):
    """Validate an individual package JSON file."""
    errors = []

    if not isinstance(data, dict):
        errors.append(f"{source}: expected JSON object, got {type(data).__name__}")
        return errors

    missing = REQUIRED_PACKAGE_FIELDS - set(data.keys())
    if missing:
        errors.append(f"{source}: missing fields: {missing}")
        return errors

    if not isinstance(data["versions"], dict):
        errors.append(f"{source}: versions should be an object")
        return errors

    for ver_name, ver in data["versions"].items():
        if not isinstance(ver, dict):
            errors.append(f"{source} version {ver_name}: expected object")
            continue
        missing_ver = REQUIRED_VERSION_FIELDS - set(ver.keys())
        if missing_ver:
            errors.append(f"{source} version {ver_name}: missing fields: {missing_ver}")

    return errors


def validate_from_directory(build_dir):
    """Validate a local build directory."""
    build_path = Path(build_dir)
    errors = []

    # 1. Validate packages.json
    packages_path = build_path / "api" / "v1" / "packages.json"
    if not packages_path.exists():
        errors.append(f"{packages_path} not found")
        return errors

    try:
        data = load_json_file(packages_path)
    except json.JSONDecodeError as e:
        errors.append(f"{packages_path}: invalid JSON: {e}")
        return errors

    errors.extend(validate_packages_index(data, str(packages_path)))

    # 2. Validate individual package files
    # Build layout: build/api/v1/{org}/{name}.json (package)
    #               build/api/v1/{org}/{name}/{version}.json (version)
    # Package files are direct children of org dirs (depth 1 under v1/{org}/)
    api_dir = build_path / "api" / "v1"
    package_files = sorted(api_dir.glob("*/*.json"))
    package_files = [f for f in package_files if f.name != "packages.json"]

    for pkg_file in package_files[:20]:
        try:
            pkg_data = load_json_file(pkg_file)
        except json.JSONDecodeError as e:
            errors.append(f"{pkg_file}: invalid JSON: {e}")
            continue
        errors.extend(validate_package_file(pkg_data, str(pkg_file)))

    return errors


def validate_from_url(base_url):
    """Validate a live deployment via index.json and individual package endpoints."""
    import random

    base_url = base_url.rstrip("/")
    errors = []

    # 1. Fetch and validate index.json (array of "org/name" strings)
    index_url = f"{base_url}/api/v1/index.json"
    try:
        index_data = load_json_url(index_url)
    except Exception as e:
        errors.append(f"Failed to fetch {index_url}: {e}")
        return errors

    if not isinstance(index_data, list):
        errors.append(f"index.json: expected JSON array, got {type(index_data).__name__}")
        return errors

    if len(index_data) < MIN_PACKAGE_COUNT:
        errors.append(
            f"index.json: expected at least {MIN_PACKAGE_COUNT} packages, got {len(index_data)}"
        )
        return errors

    print(f"  index.json: {len(index_data)} packages")

    # Validate entries are "org/name" strings
    for entry in index_data:
        if not isinstance(entry, str) or "/" not in entry:
            errors.append(f"index.json: entry {entry!r} is not in 'org/name' format")

    # 2. Spot-check individual package endpoints
    sample = random.sample(index_data, min(10, len(index_data)))
    for pkg_name in sample:
        pkg_url = f"{base_url}/api/v1/{pkg_name}.json"
        try:
            pkg_data = load_json_url(pkg_url)
        except Exception as e:
            errors.append(f"Failed to fetch {pkg_url}: {e}")
            continue
        errors.extend(validate_package_file(pkg_data, pkg_url))

    return errors


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "build"

    if target.startswith("http://") or target.startswith("https://"):
        print(f"Validating URL: {target}")
        errors = validate_from_url(target)
    else:
        print(f"Validating build directory: {target}")
        errors = validate_from_directory(target)

    if errors:
        print(f"\nFAIL: {len(errors)} error(s):")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("OK: all validations passed")


if __name__ == "__main__":
    main()
