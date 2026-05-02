#!/usr/bin/env python3
"""Prepare new posts for API cross-posting.

The source Markdown files use Eleventy front matter. DEV.to and Hashnode should
receive only article Markdown, while Crier still needs metadata for API fields
and registry tracking. This script writes sanitized staging files under /tmp and
prints GitHub Actions outputs for the publish step.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

import yaml


REPO_ROOT = Path(__file__).resolve().parents[1]
POST_PREFIX = "src/posts/"
DEFAULT_STAGE_ROOT = Path("/tmp/flnzba-crosspost")


@dataclass(frozen=True)
class PreparedPost:
    source: Path
    staged: Path
    title: str
    canonical_url: str


def run_git(args: list[str]) -> str:
    completed = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        check=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return completed.stdout


def normalize_path(path: str) -> str:
    return path.strip().replace("\\", "/")


def is_zero_sha(value: str | None) -> bool:
    return bool(value) and set(value) == {"0"}


def changed_files_from_diff(base: str, head: str) -> list[str]:
    output = run_git(["diff", "--name-status", "--diff-filter=AR", base, head, "--", "src/posts"])
    files: list[str] = []
    for line in output.splitlines():
        parts = line.split("\t")
        if not parts:
            continue
        status = parts[0]
        if status.startswith("R") and len(parts) >= 3:
            files.append(parts[2])
        elif len(parts) >= 2:
            files.append(parts[1])
    return files


def changed_files_from_commit(head: str) -> list[str]:
    output = run_git(["diff-tree", "--no-commit-id", "--name-only", "--diff-filter=AR", "-r", head, "--", "src/posts"])
    return output.splitlines()


def get_changed_files(args: list[str]) -> list[str]:
    explicit_files = [normalize_path(arg) for arg in args if arg.strip()]
    if explicit_files:
        return explicit_files

    env_files = os.environ.get("CROSSPOST_FILES", "").strip()
    if env_files:
        return [normalize_path(item) for item in re.split(r"[\n,]", env_files) if item.strip()]

    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if event_path and Path(event_path).exists():
        event = json.loads(Path(event_path).read_text())
        head = event.get("after") or os.environ.get("GITHUB_SHA")
        base = event.get("before")
        if head and base and not is_zero_sha(base):
            return changed_files_from_diff(base, head)
        if head:
            return changed_files_from_commit(head)

    head = os.environ.get("GITHUB_SHA", "HEAD")
    try:
        return changed_files_from_diff(f"{head}~1", head)
    except subprocess.CalledProcessError:
        return changed_files_from_commit(head)


def filter_post_files(paths: list[str]) -> list[Path]:
    seen: set[Path] = set()
    files: list[Path] = []
    for raw_path in paths:
        normalized = normalize_path(raw_path)
        if not normalized.startswith(POST_PREFIX) or not normalized.endswith(".md"):
            continue
        source = (REPO_ROOT / normalized).resolve()
        try:
            source.relative_to(REPO_ROOT)
        except ValueError:
            continue
        if source.name != "index.md" or not source.exists():
            continue
        if source not in seen:
            seen.add(source)
            files.append(source)
    return files


def parse_front_matter(path: Path) -> tuple[dict[str, Any], str]:
    content = path.read_text()
    match = re.match(r"\A---[ \t]*\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|\Z)(.*)\Z", content, re.DOTALL)
    if not match:
        raise ValueError(f"{path.relative_to(REPO_ROOT)} has no YAML front matter")

    data = yaml.safe_load(match.group(1)) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{path.relative_to(REPO_ROOT)} front matter must be a YAML mapping")
    return data, match.group(2)


def bool_is_false(value: Any) -> bool:
    if isinstance(value, bool):
        return value is False
    if isinstance(value, str):
        return value.strip().lower() in {"false", "no", "0"}
    return False


def bool_is_true(value: Any) -> bool:
    if isinstance(value, bool):
        return value is True
    if isinstance(value, str):
        return value.strip().lower() in {"true", "yes", "1"}
    return False


def read_site_base_url() -> str:
    config_path = REPO_ROOT / ".crier" / "config.yaml"
    if config_path.exists():
        config = yaml.safe_load(config_path.read_text()) or {}
        if isinstance(config, dict) and config.get("site_base_url"):
            return str(config["site_base_url"]).rstrip("/")
    return "https://fzeba.com"


def canonical_for(path: Path, data: dict[str, Any], site_base_url: str) -> str:
    configured = data.get("canonical_url")
    if configured:
        return str(configured)
    slug = path.parent.name
    return f"{site_base_url}/posts/{slug}/"


def normalize_tags(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    return []


def strip_one_code_indent(line: str) -> str:
    if line.startswith("\t"):
        return line[1:]
    if line.startswith("    "):
        return line[4:]
    return line


def starts_fence(line: str) -> bool:
    return bool(re.match(r"^[ \t]{0,3}(```|~~~)", line))


def fence_indented_code_blocks(markdown: str) -> str:
    lines = markdown.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    output: list[str] = []
    in_fence = False
    i = 0

    while i < len(lines):
        line = lines[i]
        if starts_fence(line):
            in_fence = not in_fence
            output.append(line)
            i += 1
            continue

        previous_blank = not output or output[-1].strip() == ""
        top_level_indented = line.startswith("    ") and not line.startswith("     ")
        tab_indented = line.startswith("\t")

        if not in_fence and previous_blank and (top_level_indented or tab_indented):
            while output and output[-1] == "":
                output.pop()
            if output:
                output.append("")
            output.append("```")

            while i < len(lines):
                current = lines[i]
                if current.strip() == "":
                    output.append("")
                    i += 1
                    continue
                if current.startswith("    ") or current.startswith("\t"):
                    output.append(strip_one_code_indent(current))
                    i += 1
                    continue
                break

            while output and output[-1] == "":
                output.pop()
            output.append("```")
            if i < len(lines) and lines[i].strip() != "":
                output.append("")
            continue

        output.append(line)
        i += 1

    return "\n".join(output)


def transform_outside_fences(markdown: str, transform) -> str:
    lines = markdown.split("\n")
    chunks: list[str] = []
    pending: list[str] = []
    in_fence = False

    def flush_pending() -> None:
        if pending:
            chunks.append(transform("\n".join(pending)))
            pending.clear()

    for line in lines:
        if starts_fence(line):
            if in_fence:
                chunks.append(line)
                in_fence = False
            else:
                flush_pending()
                chunks.append(line)
                in_fence = True
            continue

        if in_fence:
            chunks.append(line)
        else:
            pending.append(line)

    flush_pending()
    return "\n".join(chunks)


def resolve_markdown_urls(markdown: str, site_base_url: str, canonical_url: str) -> str:
    site_base_url = site_base_url.rstrip("/")
    canonical_base = canonical_url if canonical_url.endswith("/") else f"{canonical_url}/"
    site_origin = f"{urlparse(site_base_url).scheme}://{urlparse(site_base_url).netloc}"

    def resolve(url: str) -> str:
        stripped = url.strip()
        if not stripped or stripped.startswith(("#", "mailto:", "tel:", "data:", "http://", "https://", "//")):
            return url
        if stripped.startswith("/"):
            return f"{site_origin}{stripped}"
        return urljoin(canonical_base, stripped)

    def transform(text: str) -> str:
        def replace_md_link(match: re.Match[str]) -> str:
            prefix, label, target = match.groups()
            if " " in target:
                url, title = target.split(" ", 1)
                return f"{prefix}[{label}]({resolve(url)} {title})"
            return f"{prefix}[{label}]({resolve(target)})"

        def replace_html_attr(match: re.Match[str]) -> str:
            attr, quote, target = match.groups()
            return f"{attr}={quote}{resolve(target)}{quote}"

        text = re.sub(r"(!?)\[([^\]]*)\]\(([^)\s]+(?:\s+\"[^\"]*\")?)\)", replace_md_link, text)
        text = re.sub(r"\b(href|src)=(['\"])([^'\"]+)\2", replace_html_attr, text)
        return text

    return transform_outside_fences(markdown, transform)


def normalize_fence_spacing(markdown: str) -> str:
    lines = markdown.split("\n")
    output: list[str] = []
    in_fence = False
    for index, line in enumerate(lines):
        if starts_fence(line):
            if not in_fence and output and output[-1].strip() != "":
                output.append("")
            output.append(line)
            if in_fence:
                in_fence = False
                next_line = lines[index + 1] if index + 1 < len(lines) else ""
                if next_line.strip():
                    output.append("")
            else:
                in_fence = True
            continue
        output.append(line)
    return "\n".join(output)


def sanitize_body(body: str, site_base_url: str, canonical_url: str) -> str:
    body = body.replace("\r\n", "\n").replace("\r", "\n").strip()
    body = fence_indented_code_blocks(body)
    body = resolve_markdown_urls(body, site_base_url, canonical_url)
    body = normalize_fence_spacing(body)
    return body.strip() + "\n"


def write_staged_post(source: Path, data: dict[str, Any], body: str, stage_content_dir: Path, site_base_url: str) -> PreparedPost | None:
    if bool_is_true(data.get("draft")) or bool_is_false(data.get("published")):
        print(f"Skipping unpublished post: {source.relative_to(REPO_ROOT)}")
        return None

    title = str(data.get("title", "")).strip()
    if not title:
        raise ValueError(f"{source.relative_to(REPO_ROOT)} is missing title")

    canonical_url = canonical_for(source, data, site_base_url)
    description = data.get("description")
    published = not bool_is_false(data.get("published", True))
    tags = normalize_tags(data.get("tags", []))

    metadata: dict[str, Any] = {
        "title": title,
        "canonical_url": canonical_url,
        "published": published,
    }
    if description:
        metadata["description"] = str(description)
    if tags:
        metadata["tags"] = tags
    if data.get("date"):
        metadata["date"] = str(data["date"])
    if data.get("updated"):
        metadata["updated"] = str(data["updated"])

    sanitized = sanitize_body(body, site_base_url, canonical_url)
    if sanitized.lstrip().startswith("---"):
        raise ValueError(f"{source.relative_to(REPO_ROOT)} sanitized body still starts with front matter")

    relative = source.relative_to(REPO_ROOT)
    staged = stage_content_dir / relative
    staged.parent.mkdir(parents=True, exist_ok=True)
    staged.write_text(
        "---\n"
        + yaml.safe_dump(metadata, sort_keys=False, allow_unicode=False)
        + "---\n\n"
        + sanitized,
    )
    return PreparedPost(source=source, staged=staged, title=title, canonical_url=canonical_url)


def write_github_output(values: dict[str, str]) -> None:
    output_path = os.environ.get("GITHUB_OUTPUT")
    if not output_path:
        return
    with open(output_path, "a") as output:
        for key, value in values.items():
            output.write(f"{key}={value}\n")


def main() -> int:
    stage_root = Path(os.environ.get("CROSSPOST_STAGE_ROOT", str(DEFAULT_STAGE_ROOT)))
    stage_content_dir = stage_root / "content"
    manifest_path = stage_root / "manifest.json"

    shutil.rmtree(stage_root, ignore_errors=True)
    stage_content_dir.mkdir(parents=True, exist_ok=True)

    site_base_url = read_site_base_url()
    changed_files = get_changed_files(sys.argv[1:])
    post_files = filter_post_files(changed_files)

    prepared: list[PreparedPost] = []
    for source in post_files:
        data, body = parse_front_matter(source)
        staged = write_staged_post(source, data, body, stage_content_dir, site_base_url)
        if staged:
            prepared.append(staged)

    manifest = {
        "posts": [
            {
                "source": str(item.source.relative_to(REPO_ROOT)),
                "staged": str(item.staged),
                "title": item.title,
                "canonical_url": item.canonical_url,
            }
            for item in prepared
        ]
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")

    has_posts = "true" if prepared else "false"
    write_github_output(
        {
            "has_posts": has_posts,
            "staged_dir": str(stage_content_dir),
            "manifest": str(manifest_path),
        }
    )

    print(f"New or explicitly selected post files: {len(post_files)}")
    print(f"Prepared for cross-posting: {len(prepared)}")
    print(f"Staged directory: {stage_content_dir}")
    print(f"Manifest: {manifest_path}")
    if prepared:
        for item in prepared:
            print(f"- {item.source.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
