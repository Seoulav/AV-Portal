#!/usr/bin/env python3
"""Render and lint AV Portal Port Maps for human comparison with photographs.

The PNGs are review aids. A clean lint result never means a marker is correct.
"""

import argparse
import json
import math
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "beta/site/detail/data"
IMAGES = ROOT / "beta/site/detail/images"
OUTPUT = ROOT / ".portmap-audit"
BLUE = "#007AFF"


def font(size=16):
    for name in ("malgun.ttf", "C:/Windows/Fonts/malgun.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


def products():
    for path in sorted(DATA.glob("*.json")):
        product = json.loads(path.read_text(encoding="utf-8"))
        if product.get("portMap", {}).get("items"):
            yield path.stem, product


def coordinate_signature(mapping):
    fields = ("n", "side", "x1", "x2", "y", "y1", "y2", "x")
    return json.dumps([{key: item.get(key) for key in fields} for item in mapping["items"]], sort_keys=True)


def image_for(product):
    mapping = product["portMap"]
    image = next((item for item in product.get("images", []) if item.get("role") == mapping["image"]), None)
    if image is None:
        raise ValueError(f"{product.get('slug', 'product')}: missing {mapping['image']} image")
    return IMAGES / image["file"]


def coord(item):
    if item.get("side") in ("left", "right"):
        return item["y1"], item["y2"], item.get("x"), "vertical"
    return item["x1"], item["x2"], item.get("y"), "horizontal"


def lint(mapping, actual_size):
    width, height = mapping["measuredImage"]["width"], mapping["measuredImage"]["height"]
    crop = mapping.get("crop", {})
    issues = []

    def add(code, item, other=None):
        entry = {"code": code, "n": item["n"]}
        if other is not None:
            entry["other"] = other["n"]
        issues.append(entry)

    for item in mapping["items"]:
        a, b, level, direction = coord(item)
        limit = height if direction == "vertical" else width
        if a < 0 or b > limit or level is not None and (level < 0 or level > (width if direction == "vertical" else height)):
            add("OUT_OF_IMAGE", item)
        if b < a:
            add("INVERTED", item)
        elif b == a:
            add("ZERO_WIDTH", item)
        if direction == "vertical" and (a < crop.get("top", 0) or b > height - crop.get("bottom", 0)):
            add("OUT_OF_CROP", item)
        if direction == "horizontal" and level is not None and not crop.get("top", 0) <= level <= height - crop.get("bottom", 0):
            add("OUT_OF_CROP", item)
    if (width, height) != actual_size:
        issues.append({"code": "IMAGE_SIZE_MISMATCH", "expected": [width, height], "actual": list(actual_size)})
    items = mapping["items"]
    for index, item in enumerate(items):
        a, b, level, direction = coord(item)
        for other in items[index + 1:]:
            c, d, other_level, other_direction = coord(other)
            if direction != other_direction or item.get("side", "bottom") != other.get("side", "bottom"):
                continue
            if a == c and b == d:
                add("SAME_COORD" if level == other_level else "STACKED", item, other)
            elif max(a, c) < min(b, d) and (level is None or other_level is None or abs(level - other_level) <= (height if direction == "horizontal" else width) * .03):
                add("OVERLAP", item, other)
    return issues


def draw_overview(photo, mapping, dest):
    width, height = photo.size
    scale = min(1, 2000 / width)
    shown = photo.resize((round(width * scale), round(height * scale))) if scale < 1 else photo.copy()
    lanes = {}
    lane_counts = {}
    for side in ("top", "bottom"):
        last_x = []
        ordered = sorted((item for item in mapping["items"] if item.get("side", "bottom") == side),
                         key=lambda item: ((item["x1"] + item["x2"]) / 2, item["n"]))
        for item in ordered:
            center = (item["x1"] + item["x2"]) / 2 * scale
            lane = next((index for index, previous in enumerate(last_x) if center - previous >= 22), len(last_x))
            if lane == len(last_x):
                last_x.append(center)
            else:
                last_x[lane] = center
            lanes[item["n"]] = lane
        lane_counts[side] = len(last_x)
    margin = max(76, 45 + 24 * max(lane_counts.values(), default=0))
    canvas = Image.new("RGB", (shown.width + 2 * margin, shown.height + 2 * margin), "white")
    canvas.paste(shown, (margin, margin))
    overlay = Image.new("RGBA", canvas.size)
    paint = ImageDraw.Draw(overlay)
    top = mapping.get("crop", {}).get("top", 0) * scale
    bottom = mapping.get("crop", {}).get("bottom", 0) * scale
    if top:
        paint.rectangle((margin, margin, margin + shown.width, margin + top), fill=(130, 130, 130, 100))
    if bottom:
        paint.rectangle((margin, margin + shown.height - bottom, margin + shown.width, margin + shown.height), fill=(130, 130, 130, 100))
    stroke = max(2, round(1.5 / scale)) if scale < .5 else 2
    for item in mapping["items"]:
        a, b, level, direction = coord(item)
        side = item.get("side", "bottom")
        if direction == "horizontal":
            x1, x2 = margin + a * scale, margin + b * scale
            y = margin + (level if level is not None else (0 if side == "top" else height)) * scale
            half = max(6, height * scale * .03)
            paint.rectangle((x1, y - half, x2, y + half), fill=(0, 122, 255, 45))
            if side == "top":
                points = [(x1, y + 8), (x1, y - 6), (x2, y - 6), (x2, y + 8)]
                cx, cy = (x1 + x2) / 2, margin - 27 - 24 * lanes[item["n"]]
                paint.line([(cx, y - 6), (cx, cy + 10)], fill=BLUE, width=stroke)
            else:
                points = [(x1, y - 8), (x1, y + 6), (x2, y + 6), (x2, y - 8)]
                cx, cy = (x1 + x2) / 2, margin + shown.height + 27 + 24 * lanes[item["n"]]
                paint.line([(cx, y + 6), (cx, cy - 10)], fill=BLUE, width=stroke)
            paint.line(points, fill=BLUE, width=stroke, joint="curve")
        else:
            x = margin + (level if level is not None else (0 if side == "left" else width)) * scale
            y1, y2 = margin + a * scale, margin + b * scale
            half = max(6, width * scale * .03)
            paint.rectangle((x - half, y1, x + half, y2), fill=(0, 122, 255, 45))
            sign = -1 if side == "left" else 1
            paint.line([(x - sign * 8, y1), (x + sign * 6, y1), (x + sign * 6, y2), (x - sign * 8, y2)], fill=BLUE, width=stroke)
            cx, cy = x + sign * 26, (y1 + y2) / 2
            paint.line([(x + sign * 6, cy), (x + sign * 14, cy)], fill=BLUE, width=stroke)
        paint.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), fill=BLUE)
        paint.text((cx, cy), str(item["n"]), fill="white", anchor="mm", font=font(11))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
    canvas.save(dest)


def draw_marker(photo, item, dest, pad=None):
    width, height = photo.size
    a, b, level, direction = coord(item)
    span = max(1, b - a)
    padding = pad if pad is not None else span
    if direction == "horizontal":
        center = level if level is not None else height / 2
        vertical_pad = max(span * .8, height * .15)
        box = (max(0, math.floor(a - padding)), max(0, math.floor(center - vertical_pad)),
               min(width, math.ceil(b + padding)), min(height, math.ceil(center + vertical_pad)))
    else:
        center = level if level is not None else (0 if item["side"] == "left" else width)
        horizontal_pad = max(span * .8, width * .15)
        # Edge brackets on diagrams describe a row, not an x coordinate. Keep
        # the full panel so the connector body remains visible in the crop.
        x_start, x_end = (0, width) if level is None else (
            max(0, math.floor(center - horizontal_pad)), min(width, math.ceil(center + horizontal_pad)))
        box = (x_start, max(0, math.floor(a - padding)), x_end, min(height, math.ceil(b + padding)))
    if box[2] <= box[0] or box[3] <= box[1]:
        raise ValueError(f"marker {item['n']}: empty crop {box}")
    crop = photo.crop(box)
    scale = 600 / crop.width
    crop = crop.resize((600, max(1, round(crop.height * scale))))
    header = 48
    canvas = Image.new("RGB", (600, crop.height + header), "white")
    canvas.paste(crop, (0, header))
    draw = ImageDraw.Draw(canvas)
    draw.text((8, 12), f"{item['n']} · {item['label']}", fill="black", font=font(17))
    if direction == "horizontal":
        for value in (a, b):
            x = (value - box[0]) * scale
            draw.line((x, header, x, canvas.height), fill=BLUE, width=2)
            draw.text((x + 3, header + 3), str(value), fill=BLUE, font=font(13))
        if level is not None:
            y = header + (level - box[1]) * scale
            draw.line((0, y, 600, y), fill=BLUE, width=2)
            draw.text((3, y + 3), f"y={level}", fill=BLUE, font=font(13))
    else:
        for value in (a, b):
            y = header + (value - box[1]) * scale
            draw.line((0, y, 600, y), fill=BLUE, width=2)
            draw.text((3, y + 3), str(value), fill=BLUE, font=font(13))
        if level is not None:
            x = (level - box[0]) * scale
            draw.line((x, header, x, canvas.height), fill=BLUE, width=2)
            draw.text((x + 3, header + 3), f"x={level}", fill=BLUE, font=font(13))
    canvas.save(dest)
    return canvas


def draw_sheet(markers, dest):
    tile_width = 600
    tile_height = max(image.height for image in markers)
    sheet = Image.new("RGB", (tile_width * 3, tile_height * math.ceil(len(markers) / 3)), "white")
    for index, marker in enumerate(markers):
        sheet.paste(marker, ((index % 3) * tile_width, (index // 3) * tile_height))
    sheet.save(dest)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("slugs", nargs="*")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--manufacturer")
    parser.add_argument("--lint-only", action="store_true")
    parser.add_argument("--zoom", type=int, help="render only this marker number")
    parser.add_argument("--pad", type=int, help="crop padding in source pixels")
    parser.add_argument("--ref", help="render a committed baseline into each product's before/ folder")
    args = parser.parse_args()
    catalog = dict(products())
    if args.list:
        for slug, product in catalog.items():
            print(f"{slug}\t{product.get('manufacturer', '')}\t{len(product['portMap']['items'])}\t{image_for(product).name}")
        print(f"TOTAL\t{len(catalog)} products\t{sum(len(p['portMap']['items']) for p in catalog.values())} markers")
        return
    if not (args.all or args.slugs or args.manufacturer):
        parser.error("choose --all, --manufacturer, or one or more slugs")
    selected = [(slug, p) for slug, p in catalog.items() if args.all or slug in args.slugs or args.manufacturer and args.manufacturer.casefold() in p.get("manufacturer", "").casefold()]
    missing = set(args.slugs) - catalog.keys()
    if missing:
        parser.error(f"no Port Map: {', '.join(sorted(missing))}")
    if args.ref:
        baseline_catalog = {}
        for slug in catalog:
            baseline = subprocess.run(
                ["git", "show", f"{args.ref}:beta/site/detail/data/{slug}.json"],
                cwd=ROOT, capture_output=True, check=True)
            baseline_catalog[slug] = json.loads(baseline.stdout)
    else:
        baseline_catalog = catalog
    signatures = {slug: coordinate_signature(product["portMap"]) for slug, product in baseline_catalog.items()}
    total_issues = 0
    for slug, product in selected:
        if args.ref:
            product = baseline_catalog[slug]
        mapping = product["portMap"]
        path = image_for(product)
        with Image.open(path) as source:
            photo = source.convert("RGB")
        issues = lint(mapping, photo.size)
        shared = [other for other, signature in signatures.items() if other != slug and signature == signatures[slug]]
        if shared:
            issues.append({"code": "SHARED_WITH", "slugs": shared})
        total_issues += len(issues)
        directory = OUTPUT / slug / "before" if args.ref else OUTPUT / slug
        directory.mkdir(parents=True, exist_ok=True)
        (directory / "lint.json").write_text(json.dumps(issues, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        if not args.lint_only:
            draw_overview(photo, mapping, directory / "overview.png")
            markers = [draw_marker(photo, item, directory / f"m{item['n']}.png", args.pad) for item in sorted(mapping["items"], key=lambda i: i["n"]) if args.zoom is None or item["n"] == args.zoom]
            if markers:
                draw_sheet(markers, directory / "sheet.png")
        print(f"{slug}: {len(mapping['items'])} markers, {len(issues)} lint signals")
    print(f"TOTAL: {len(selected)} products, {total_issues} lint signals (manual image review required)")


if __name__ == "__main__":
    main()
