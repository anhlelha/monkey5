#!/usr/bin/env python3
"""Classify official Math questions against Vietnamese Grade 4/5 curriculum bands.

The script produces separate analysis artifacts only. It never updates Question.topic
or assumes that a Grade 5 concept has already been taught at the start of Grade 5.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import sys
import threading
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / ".analysis" / "math-vision-input" / "questions-with-figures.json"
DEFAULT_TAXONOMY = ROOT / ".analysis" / "topic-taxonomy-v1" / "topic-taxonomy-v1-assessments.json"
DEFAULT_OUT = ROOT / ".analysis" / "curriculum-crosswalk-v1"
MODEL = "gpt-5-mini"
BATCH_SIZE = 8

BANDS = ["grade4_or_earlier", "grade5_core", "extension_beyond_grade5"]
TIERS = ["T0_foundation", "T2_grade5_not_yet_taught", "T3_selective_extension"]
JAN_ACTIONS = ["foundation_practice", "selective_preteach", "defer_until_school_or_later"]
STRANDS = [
    "number_operations",
    "fractions_decimals_ratio",
    "geometry_measurement",
    "data_probability",
    "practical_modeling",
    "nonroutine_strategy",
]
PREREQUISITES = [
    "natural_number_operations",
    "fractions",
    "decimals",
    "ratio_percent",
    "geometry_basics",
    "geometry_grade5",
    "measurement_units",
    "data_reading",
    "uniform_motion",
    "strategic_reasoning",
]

SYSTEM_PROMPT = """You are mapping Vietnamese official entrance-exam Math questions to the Vietnamese national Mathematics curriculum.

Context: the learner has JUST STARTED Grade 5. Do not mark a Grade 5 standard as a weakness simply because it is not yet taught. Your job is curricular dependency mapping, not difficulty grading.

Reference curriculum boundaries (condensed from the Mathematics curriculum issued with Circular 32/2018/TT-BGDDT):
- Grade 4 / earlier (T0): natural numbers up to millions; four operations, estimation, simple expressions and 2–3 step word problems; initial fractions and simpler arithmetic with fractions; parallel/perpendicular lines, parallelogram, rhombus, angle recognition; basic length/area/mass/time units; bar charts and simple experimental counting.
- Grade 5 core, potentially not yet taught at this point (T2): decimals and decimal operations; broader fraction operations; ratio, percentage and map scale; trapezoid, circle and triangle types; nets of solids; km2/hectare, volume units; area of triangle/trapezoid/circle; surface area and volume of cuboid/cube; uniform motion; pie charts; simple experimental probability.
- Selective entrance extension (T3): non-routine digit/divisibility/number-theory constraints, deep pattern generalization, telescoping or unusual transformations, combinatorics, invariants/strategy puzzles, sophisticated multi-step geometric deduction, work-rate methods not explicitly in Grade 5, or a task whose solution goes materially beyond the stated Grade 4/5 expectation even if it uses elementary calculations.

Classification rules:
1. Use the question text, options/answer and figure description only. Ignore unknown source-system labels.
2. Choose exactly one curriculumBand and one readinessTier.
3. curriculumBand = grade4_or_earlier only when no new Grade 5 standard is essential. Use grade5_core when an explicit Grade 5 standard is essential. Use extension_beyond_grade5 when the decisive solution method materially exceeds the official Grade 4/5 expected outcome.
4. readinessTier at the start of Grade 5: grade4_or_earlier => T0_foundation; grade5_core => T2_grade5_not_yet_taught; extension_beyond_grade5 => T3_selective_extension.
5. For January target schools (NSHN/NSHM/ARC), selective_preteach is only for a Grade 5 core or T3 concept that is (a) central to the question and (b) high-leverage for the January target group. Do not select it merely because it appears in a question.
6. Be conservative. A short standard Grade 5 application is T2, not T3. A multi-step but standard Grade 4/5 application remains its core band unless the strategy itself goes materially beyond standard expectations.
7. Do not evaluate the student's actual ability. Explain the decisive curricular concept in Vietnamese in one concise sentence.
"""

SCHEMA = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "questionId": {"type": "string"},
                    "curriculumBand": {"type": "string", "enum": BANDS},
                    "readinessTier": {"type": "string", "enum": TIERS},
                    "primaryStrand": {"type": "string", "enum": STRANDS},
                    "prerequisites": {
                        "type": "array",
                        "items": {"type": "string", "enum": PREREQUISITES},
                        "minItems": 1,
                        "maxItems": 4,
                        "uniqueItems": True,
                    },
                    "januaryAction": {"type": "string", "enum": JAN_ACTIONS},
                    "curriculumRationale": {"type": "string", "minLength": 12, "maxLength": 280},
                },
                "required": [
                    "questionId", "curriculumBand", "readinessTier", "primaryStrand",
                    "prerequisites", "januaryAction", "curriculumRationale",
                ],
                "additionalProperties": False,
            },
        }
    },
    "required": ["items"],
    "additionalProperties": False,
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_completed(path: Path) -> dict[str, dict[str, Any]]:
    completed: dict[str, dict[str, Any]] = {}
    if not path.exists():
        return completed
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        row = json.loads(line)
        question_id = row.get("questionId")
        if not question_id:
            raise ValueError(f"Missing questionId in {path}:{line_number}")
        completed[question_id] = row
    return completed


def compact_question(source: dict[str, Any], taxonomy: dict[str, Any]) -> dict[str, Any]:
    return {
        "questionId": source["questionId"],
        "school": source.get("school"),
        "year": source.get("year"),
        "questionNo": source.get("num"),
        "stem": source.get("stem", ""),
        "options": source.get("options", []),
        "correct": source.get("correct"),
        "modelAnswer": source.get("modelAnswer", ""),
        "figureDescription": taxonomy.get("figureRead", "") or "No figure description available.",
    }


def expected_tier(band: str) -> str:
    return {
        "grade4_or_earlier": "T0_foundation",
        "grade5_core": "T2_grade5_not_yet_taught",
        "extension_beyond_grade5": "T3_selective_extension",
    }[band]


def validate_row(row: dict[str, Any], allowed_ids: set[str]) -> None:
    required = {"questionId", "curriculumBand", "readinessTier", "primaryStrand", "prerequisites", "januaryAction", "curriculumRationale"}
    if set(row) - required:
        raise ValueError(f"Unexpected output fields: {set(row) - required}")
    if set(row) != required:
        raise ValueError(f"Missing output fields: {required - set(row)}")
    if row["questionId"] not in allowed_ids:
        raise ValueError(f"Unexpected questionId: {row['questionId']}")
    if row["curriculumBand"] not in BANDS or row["readinessTier"] not in TIERS:
        raise ValueError(f"Invalid band/tier for {row['questionId']}")
    if row["readinessTier"] != expected_tier(row["curriculumBand"]):
        raise ValueError(f"Band/tier contradiction for {row['questionId']}")
    if row["primaryStrand"] not in STRANDS:
        raise ValueError(f"Invalid primaryStrand for {row['questionId']}")
    prerequisites = row["prerequisites"]
    if not isinstance(prerequisites, list) or not 1 <= len(prerequisites) <= 4 or len(set(prerequisites)) != len(prerequisites):
        raise ValueError(f"Invalid prerequisites for {row['questionId']}")
    if any(value not in PREREQUISITES for value in prerequisites):
        raise ValueError(f"Unknown prerequisite for {row['questionId']}")
    if row["januaryAction"] not in JAN_ACTIONS:
        raise ValueError(f"Invalid January action for {row['questionId']}")
    if not 12 <= len(row["curriculumRationale"].strip()) <= 280:
        raise ValueError(f"Invalid rationale length for {row['questionId']}")


def build_messages(batch: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": "Classify every item below. Return exactly the schema.\n\n" + json.dumps({"questions": batch}, ensure_ascii=False),
        },
    ]


def call_batch(client: OpenAI, model: str, batch: list[dict[str, Any]]) -> list[dict[str, Any]]:
    response = client.chat.completions.create(
        model=model,
        messages=build_messages(batch),
        max_completion_tokens=3500,
        response_format={
            "type": "json_schema",
            "json_schema": {"name": "curriculum_crosswalk_batch", "strict": True, "schema": SCHEMA},
        },
    )
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("Model returned no structured content")
    parsed = json.loads(content)
    records = parsed["items"]
    expected_ids = {item["questionId"] for item in batch}
    received_ids = {item.get("questionId") for item in records}
    if received_ids != expected_ids or len(records) != len(batch):
        raise ValueError(f"Batch IDs mismatch. expected={expected_ids}, received={received_ids}")
    for record in records:
        validate_row(record, expected_ids)
    return records


def append_rows(path: Path, rows: list[dict[str, Any]], lock: threading.Lock) -> None:
    payload = "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows)
    with lock:
        with path.open("a", encoding="utf-8") as handle:
            handle.write(payload)
            handle.flush()


def summarize(rows: list[dict[str, Any]], source_by_id: dict[str, dict[str, Any]]) -> dict[str, Any]:
    def count(field: str) -> dict[str, int]:
        return dict(sorted(Counter(row[field] for row in rows).items()))

    by_school: dict[str, Counter[str]] = {}
    for row in rows:
        school = source_by_id[row["questionId"]].get("school", "unknown")
        by_school.setdefault(school, Counter())[row["curriculumBand"]] += 1

    return {
        "crosswalkVersion": "curriculum-crosswalk-v1",
        "total": len(rows),
        "curriculumBandCounts": count("curriculumBand"),
        "readinessTierCounts": count("readinessTier"),
        "primaryStrandCounts": count("primaryStrand"),
        "januaryActionCounts": count("januaryAction"),
        "bySchoolBand": {school: dict(sorted(values.items())) for school, values in sorted(by_school.items())},
        "generatedAt": now_iso(),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--taxonomy", type=Path, default=DEFAULT_TAXONOMY)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--model", default=MODEL)
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE)
    parser.add_argument("--max-workers", type=int, default=5)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--reset", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.batch_size < 1 or args.max_workers < 1:
        raise SystemExit("batch-size and max-workers must be positive")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    jsonl_path = args.output_dir / "curriculum-crosswalk-assessments.jsonl"
    json_path = args.output_dir / "curriculum-crosswalk-assessments.json"
    summary_path = args.output_dir / "curriculum-crosswalk-summary.json"
    if args.reset:
        for path in (jsonl_path, json_path, summary_path):
            path.unlink(missing_ok=True)

    manifest = read_json(args.manifest)
    taxonomy = read_json(args.taxonomy)
    taxonomy_by_id = {row["questionId"]: row for row in taxonomy}
    source_by_id = {row["questionId"]: row for row in manifest}
    if set(source_by_id) != set(taxonomy_by_id):
        raise SystemExit("Manifest and taxonomy records do not have identical question IDs")

    completed = load_completed(jsonl_path)
    for row in completed.values():
        validate_row(row, set(source_by_id))
    pending_ids = [question_id for question_id in source_by_id if question_id not in completed]
    if args.limit:
        pending_ids = pending_ids[:args.limit]
    pending = [compact_question(source_by_id[question_id], taxonomy_by_id[question_id]) for question_id in pending_ids]
    batches = [pending[index:index + args.batch_size] for index in range(0, len(pending), args.batch_size)]

    plan = {
        "totalInput": len(source_by_id),
        "alreadyCompleted": len(completed),
        "pending": len(pending),
        "batches": len(batches),
        "model": args.model,
        "outputDir": str(args.output_dir),
        "dryRun": args.dry_run,
    }
    print(json.dumps(plan, ensure_ascii=False, indent=2), flush=True)
    if args.dry_run:
        return 0

    client = OpenAI()
    write_lock = threading.Lock()
    failures: list[dict[str, str]] = []
    done_count = len(completed)
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.max_workers) as executor:
        future_map = {executor.submit(call_batch, client, args.model, batch): batch for batch in batches}
        for future in concurrent.futures.as_completed(future_map):
            batch = future_map[future]
            try:
                rows = future.result()
                stamped = [
                    {
                        **row,
                        "model": args.model,
                        "assessedAt": now_iso(),
                    }
                    for row in rows
                ]
                append_rows(jsonl_path, stamped, write_lock)
                completed.update({row["questionId"]: row for row in stamped})
                done_count += len(stamped)
                print(f"Completed {done_count}/{len(source_by_id)} questions", flush=True)
            except Exception as exc:  # noqa: BLE001
                failures.append({"questionIds": ",".join(item["questionId"] for item in batch), "error": str(exc)})
                print(f"FAILED batch: {failures[-1]}", file=sys.stderr, flush=True)

    ordered = [completed[question_id] for question_id in source_by_id if question_id in completed]
    json_path.write_text(json.dumps(ordered, ensure_ascii=False, indent=2), encoding="utf-8")
    summary = summarize(ordered, source_by_id)
    summary.update({"failures": failures, "coveragePct": round(len(ordered) / len(source_by_id) * 100, 2)})
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2), flush=True)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
