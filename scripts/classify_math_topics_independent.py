#!/usr/bin/env python3
"""Classify independent Mathematics topics for official Monkey5 entrance-exam questions.

This is taxonomy v1 approved for the project. It deliberately does NOT send the
source-system `Question.topic` to the model. For every question it returns exactly
one `topicPrimary`, up to two `topicSecondary` labels, and zero or more `contextTags`.
The script is resumable through JSONL and uses a separate visual request for each
question with a usable figure asset.

Examples:
  # Dry-run: validate the complete workload without calling an LLM
  python3 scripts/classify_math_topics_independent.py --dry-run \
    --asset-url-log /path/to/vision-asset-upload.log

  # Full run: PNG asset URLs are required to classify image-dependent questions visually
  python3 scripts/classify_math_topics_independent.py \
    --asset-url-log /path/to/vision-asset-upload.log

  # Small visual smoke test in an isolated output directory
  python3 scripts/classify_math_topics_independent.py --only-visual --limit 1 \
    --asset-url-log /path/to/vision-asset-upload.log \
    --output-dir .analysis/topic-taxonomy-v1-visual-smoke
"""

from __future__ import annotations

import argparse
import concurrent.futures as futures
import json
import re
import shutil
import sys
import threading
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / ".analysis" / "math-vision-input" / "questions-with-figures.json"
DEFAULT_OUTPUT_DIR = ROOT / ".analysis" / "topic-taxonomy-v1"
TAXONOMY_VERSION = "math-topic-taxonomy-v1"

PRIMARY_TOPICS: dict[str, dict[str, str]] = {
    "num_div": {
        "label": "Số tự nhiên, chữ số & chia hết",
        "definition": "Cấu tạo số/chữ số, ước–bội, chia hết, số dư, số nguyên tố, GCD/LCM ở mức phù hợp, phép tính số tự nhiên và tổ hợp chữ số.",
    },
    "frac_decimal": {
        "label": "Phân số & số thập phân",
        "definition": "Phân số, hỗn số, số thập phân, quy đồng/rút gọn/so sánh, phép tính và biểu thức mà phân số hoặc số thập phân là công cụ trung tâm.",
    },
    "ratio_percent": {
        "label": "Tỉ số, phần trăm & tỉ lệ",
        "definition": "Tỉ số, chia theo tỉ lệ, tổng–hiệu–tỉ số, phần trăm, tăng/giảm phần trăm và scale/bản đồ khi quan hệ tỉ lệ là phương pháp mở khóa.",
    },
    "sequence_pattern": {
        "label": "Dãy số, quy luật & đại số sơ cấp",
        "definition": "Dãy số, chu kỳ, quy luật tạo sinh, số hạng theo vị trí, quan hệ biến thiên, biểu thức hoặc ẩn đơn giản khi nhận ra quy luật là then chốt.",
    },
    "plane_geometry": {
        "label": "Hình phẳng & diện tích",
        "definition": "Tam giác, tứ giác, đường tròn, góc, chu vi/diện tích, tỉ lệ diện tích, quan hệ hình và suy luận từ hình vẽ phẳng.",
    },
    "solid_geometry": {
        "label": "Hình khối & thể tích",
        "definition": "Hình hộp, lập phương, khối ghép/cắt, triển khai, thể tích, diện tích toàn phần/xung quanh và cấu trúc hình khối.",
    },
    "measurement": {
        "label": "Đo lường, đơn vị & ước lượng",
        "definition": "Đổi đơn vị chiều dài/khối lượng/diện tích/thể tích/dung tích, ước lượng, tiền tệ và thao tác số đo khi conversion là nút thắt chính.",
    },
    "time_calendar": {
        "label": "Thời gian & lịch",
        "definition": "Đồng hồ, ngày–tháng–năm, khoảng thời gian, quy đổi giờ–phút–giây và lịch, khi không có mô hình vận tốc/quãng đường.",
    },
    "motion": {
        "label": "Chuyển động đều",
        "definition": "Quãng đường–vận tốc–thời gian, gặp nhau/đuổi kịp, chuyển động tròn, tàu–cầu–dòng nước và vận tốc trung bình.",
    },
    "work_rate": {
        "label": "Công việc, năng suất & lưu lượng",
        "definition": "Cùng làm/chung vòi, năng suất, người–giờ–sản phẩm, phần công việc, lưu lượng hoặc tốc độ hoàn thành công việc.",
    },
    "data_probability": {
        "label": "Dữ liệu, thống kê & xác suất",
        "definition": "Bảng/biểu đồ, trung bình, tần suất, xác suất đơn giản hoặc suy luận từ dữ liệu.",
    },
    "counting_combinatorics": {
        "label": "Đếm & tổ hợp",
        "definition": "Đếm trường hợp, chọn/sắp xếp/ghép, quy tắc đếm, bắt tay, phân chia đối tượng và cấu hình tổ hợp.",
    },
    "logic_strategy": {
        "label": "Logic, bất biến & chiến lược",
        "definition": "Suy luận điều kiện, bất biến, phản chứng đơn giản, trò chơi, tối ưu/chiến lược hoặc câu đố cần ý tưởng không theo quy trình chuẩn.",
    },
}

CONTEXT_TAGS: dict[str, dict[str, str]] = {
    "ctx_age": {"label": "Bài toán tuổi", "definition": "Quan hệ tuổi hiện tại/quá khứ/tương lai là bối cảnh đáng ghi nhận."},
    "ctx_map_scale": {"label": "Tỉ lệ bản đồ/scale", "definition": "Dùng tỉ lệ bản đồ hoặc mô hình thu nhỏ/phóng to."},
    "ctx_finance_commerce": {"label": "Tài chính/mua bán", "definition": "Mua bán, giá, lãi/lỗ, chiết khấu, doanh thu hoặc tiền tệ là bối cảnh chính."},
    "rep_diagram_required": {"label": "Cần đọc hình/biểu đồ", "definition": "Không thể giải/hiểu đầy đủ nếu không đọc hình hoặc biểu đồ đi kèm."},
    "cross_domain": {"label": "Liên chuyên đề thực sự", "definition": "Hai chuyên đề chính đều thiết yếu và không có một trục chi phối rõ ràng."},
}

PRIMARY_IDS = list(PRIMARY_TOPICS)
CONTEXT_IDS = list(CONTEXT_TAGS)

SYSTEM_PROMPT = """Bạn là chuyên gia độc lập phân loại chuyên đề của câu Toán tuyển sinh vào lớp 6 tại Việt Nam.

Mục tiêu: phân loại theo taxonomy đã phê duyệt mà KHÔNG biết nhãn chuyên đề cũ của hệ thống. Với mỗi câu, gán chính xác MỘT `topicPrimary`, tối đa HAI `topicSecondary` và các `contextTags` cần thiết.

Quy tắc nền tảng:
1. `topicPrimary` là kiến thức/kỹ năng mà nếu học sinh không nắm, em đó khó mở khóa phương pháp giải nhất. Không chọn theo từ khóa, hình thức đề hay bối cảnh kể chuyện.
2. `topicSecondary` chỉ dùng cho tối đa hai kiến thức phụ thực sự được vận dụng. Không lặp `topicPrimary` và không gắn mọi kiến thức xuất hiện trong đề.
3. `contextTags` mô tả bối cảnh hoặc cách biểu diễn; chúng không thay thế chuyên đề chính. Chỉ dùng `cross_domain` khi hai trục kiến thức ngang nhau thật sự.
4. Trường `hasFigure` cho biết câu có hình minh họa chính thức hay không. Nếu `hasFigure=false`, bắt buộc `figureRead` đúng là “Không có hình minh họa” và TUYỆT ĐỐI không thêm `rep_diagram_required`. Nếu `hasFigure=true` và request có hình, phải đọc hình trước khi phân loại; chỉ thêm `rep_diagram_required` nếu hình là cần thiết để hiểu/giải câu.
5. `topicConfidence` là phần trăm 0–100 về độ chắc chắn của NHÃN CHUYÊN ĐỀ, không phải độ khó và không phải xác suất đáp án đúng.
6. `correct`, `modelAnswer` và `options` chỉ dùng để hiểu yêu cầu; không để lời giải sẵn có làm thay đổi chuyên đề.

Ranh giới bắt buộc:
- `plane_geometry` khi quan hệ hình/công thức/suy luận diện tích là mấu chốt; `measurement` khi đổi đơn vị hoặc thao tác số đo là nút thắt.
- `solid_geometry` khi cấu trúc khối, mặt/cạnh hoặc công thức thể tích cần thiết; `measurement` nếu chỉ quy đổi số đo.
- `frac_decimal` khi phép tính phân số/số thập phân chi phối; `ratio_percent` khi tỉ số, phần–toàn bộ, chia tỉ lệ hoặc phần trăm chi phối.
- `work_rate` nếu có suất làm, vòi, người–giờ hoặc phần việc; `ratio_percent` nếu chỉ là tỉ lệ/%.
- `motion` khi có quãng đường–vận tốc; `time_calendar` khi chỉ có đồng hồ, lịch hoặc khoảng thời gian.
- `counting_combinatorics` khi cần đếm cấu hình/trường hợp; `logic_strategy` khi cần bất biến, chiến lược hoặc suy luận điều kiện mà không phải đếm.
- Bài toán tuổi dùng `ctx_age`; chuyên đề chính vẫn là phương pháp mở khóa (thường `ratio_percent`, `num_div` hoặc `sequence_pattern`).

Trả về JSON đúng schema, không kèm văn bản ngoài JSON."""

PRIMARY_REFERENCE = "\n".join(
    f"- {topic_id} — {topic['label']}: {topic['definition']}"
    for topic_id, topic in PRIMARY_TOPICS.items()
)
CONTEXT_REFERENCE = "\n".join(
    f"- {tag_id} — {tag['label']}: {tag['definition']}"
    for tag_id, tag in CONTEXT_TAGS.items()
)

ITEM_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "questionId": {"type": "string"},
        "topicPrimary": {"type": "string", "enum": PRIMARY_IDS},
        "topicSecondary": {
            "type": "array",
            "items": {"type": "string", "enum": PRIMARY_IDS},
            "minItems": 0,
            "maxItems": 2,
            "uniqueItems": True,
        },
        "contextTags": {
            "type": "array",
            "items": {"type": "string", "enum": CONTEXT_IDS},
            "minItems": 0,
            "maxItems": len(CONTEXT_IDS),
            "uniqueItems": True,
        },
        "topicConfidence": {"type": "integer", "minimum": 0, "maximum": 100},
        "topicRationale": {"type": "string"},
        "figureRead": {"type": "string"},
    },
    "required": [
        "questionId", "topicPrimary", "topicSecondary", "contextTags",
        "topicConfidence", "topicRationale", "figureRead",
    ],
    "additionalProperties": False,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Manifest questions-with-figures.json")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Directory for resumable outputs")
    parser.add_argument("--asset-url-log", type=Path, help="Log mapping rendered PNG file names to HTTPS URLs")
    parser.add_argument("--model", default="gpt-5-mini", help="OpenAI-compatible model identifier")
    parser.add_argument("--batch-size", type=int, default=8, help="Text-only questions per request")
    parser.add_argument("--max-workers", type=int, default=5, help="Maximum concurrent API jobs")
    parser.add_argument("--limit", type=int, help="Optional cap for a smoke test")
    parser.add_argument("--only-visual", action="store_true", help="Only process records carrying a figure key")
    parser.add_argument("--reset", action="store_true", help="Delete existing output-dir before the run")
    parser.add_argument("--dry-run", action="store_true", help="Validate workload without API calls")
    return parser.parse_args()


def load_json(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(f"Không tìm thấy: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def parse_upload_urls(path: Path | None) -> dict[str, str]:
    """Support manus-upload-file logs or simple `filename -> https://...` mappings."""
    if path is None:
        return {}
    if not path.exists():
        raise FileNotFoundError(f"Không tìm thấy asset-url-log: {path}")
    urls: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        match = re.search(
            r"(?:\[SUCCESS\]\s*)?(?:\.?/?)([^\s]+\.(?:png|jpg|jpeg|webp))\s*(?:->|→)\s*(https://\S+)",
            raw_line.strip(),
            re.I,
        )
        if match:
            urls[Path(match.group(1)).name] = match.group(2)
    return urls


def parse_options(raw_options: Any) -> Any:
    if not isinstance(raw_options, str):
        return raw_options
    try:
        return json.loads(raw_options)
    except json.JSONDecodeError:
        return raw_options


def compact_question(question: dict[str, Any]) -> dict[str, Any]:
    """Exclude the source-system topic and grade to preserve independent classification."""
    return {
        "questionId": question["questionId"],
        "school": question.get("school"),
        "year": question.get("year"),
        "questionNo": question.get("num"),
        "questionType": question.get("type"),
        "points": question.get("points"),
        "stem": question.get("stem"),
        "options": parse_options(question.get("options") or "[]"),
        "correct": question.get("correct"),
        "modelAnswer": question.get("modelAnswer"),
        "unit": question.get("unit"),
        "placeholder": question.get("placeholder"),
        "hasFigure": bool(question.get("figure")),
    }


def taxonomy_instruction() -> str:
    return (
        "Taxonomy chuyên đề chính (chọn đúng một):\n" + PRIMARY_REFERENCE
        + "\n\nNhãn phụ bối cảnh/biểu diễn (có thể chọn nhiều):\n" + CONTEXT_REFERENCE
    )


def response_schema(name: str, array: bool) -> dict[str, Any]:
    schema: dict[str, Any] = ITEM_SCHEMA
    if array:
        schema = {
            "type": "object",
            "properties": {"assessments": {"type": "array", "items": ITEM_SCHEMA}},
            "required": ["assessments"],
            "additionalProperties": False,
        }
    return {"type": "json_schema", "json_schema": {"name": name, "strict": True, "schema": schema}}


def model_token_kwargs(model: str) -> dict[str, int]:
    """Avoid max-token incompatibilities between OpenAI-compatible provider families."""
    if model.startswith(("gemini-", "claude-")):
        return {"max_tokens": 2600}
    return {"max_completion_tokens": 2600}


def request_json(client: OpenAI, model: str, messages: list[dict[str, Any]], schema_name: str, array: bool) -> dict[str, Any]:
    last_error: Exception | None = None
    for attempt in range(4):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                response_format=response_schema(schema_name, array=array),
                **model_token_kwargs(model),
            )
            return json.loads(response.choices[0].message.content or "")
        except Exception as error:  # Provider/network failures are retried.
            last_error = error
            time.sleep(min(20, 2 ** attempt))
    raise RuntimeError(f"LLM request failed after retries: {last_error}")


def classify_visual(client: OpenAI, model: str, question: dict[str, Any], image_url: str) -> dict[str, Any]:
    result = request_json(
        client,
        model,
        [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": [
                {"type": "text", "text": taxonomy_instruction() + "\n\nPhân loại câu hỏi này bằng cả văn bản và hình:\n" + json.dumps(compact_question(question), ensure_ascii=False)},
                {"type": "image_url", "image_url": {"url": image_url, "detail": "high"}},
            ]},
        ],
        "math_topic_taxonomy_v1_visual",
        array=False,
    )
    if result["questionId"] != question["questionId"]:
        raise RuntimeError(f"Sai questionId: expected {question['questionId']}, got {result['questionId']}")
    return {**result, "usedVisual": True, "figureKey": question.get("figure"), "figureAsset": question.get("figureAsset"), "imageUrl": image_url}


def classify_text_batch(client: OpenAI, model: str, questions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    payload = [compact_question(question) for question in questions]
    result = request_json(
        client,
        model,
        [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": taxonomy_instruction() + "\n\nCác câu sau được chấm theo văn bản. Tôn trọng từng trường `hasFigure`: nếu `hasFigure=false`, figureRead phải là “Không có hình minh họa” và không được chọn `rep_diagram_required`; nếu `hasFigure=true` nhưng không có ảnh trong request, chỉ đánh dấu `rep_diagram_required` khi đề nêu rõ hình là cần thiết. Phân loại từng câu:\n" + json.dumps(payload, ensure_ascii=False)},
        ],
        "math_topic_taxonomy_v1_text_batch",
        array=True,
    )
    mapped = {row["questionId"]: row for row in result["assessments"]}
    expected = {question["questionId"] for question in questions}
    if set(mapped) != expected:
        raise RuntimeError(f"Batch trả sai coverage: expected={len(expected)}, got={len(mapped)}")
    return [
        {**mapped[question["questionId"]], "usedVisual": False, "figureKey": question.get("figure"), "figureAsset": question.get("figureAsset"), "imageUrl": None}
        for question in questions
    ]


def validate_row(row: dict[str, Any]) -> None:
    primary = row.get("topicPrimary")
    secondary = row.get("topicSecondary")
    tags = row.get("contextTags")
    if primary not in PRIMARY_TOPICS:
        raise ValueError(f"topicPrimary không hợp lệ: {primary}")
    if not isinstance(secondary, list) or len(secondary) > 2 or len(set(secondary)) != len(secondary):
        raise ValueError("topicSecondary phải là danh sách unique, tối đa hai nhãn")
    if primary in secondary or any(item not in PRIMARY_TOPICS for item in secondary):
        raise ValueError("topicSecondary chứa nhãn không hợp lệ hoặc lặp topicPrimary")
    if not isinstance(tags, list) or len(set(tags)) != len(tags) or any(item not in CONTEXT_TAGS for item in tags):
        raise ValueError("contextTags không hợp lệ")
    if not row.get("figureKey") and "rep_diagram_required" in tags:
        raise ValueError("Câu không có figureKey không được gán rep_diagram_required")
    if not row.get("figureKey") and row.get("figureRead") != "Không có hình minh họa":
        raise ValueError("Câu không có figureKey phải ghi figureRead là Không có hình minh họa")
    if not isinstance(row.get("topicConfidence"), int) or not 0 <= row["topicConfidence"] <= 100:
        raise ValueError("topicConfidence phải là integer trong 0–100")
    if not isinstance(row.get("topicRationale"), str) or not row["topicRationale"].strip():
        raise ValueError("Thiếu topicRationale")
    if not isinstance(row.get("figureRead"), str):
        raise ValueError("Thiếu figureRead")


def load_completed(jsonl_path: Path) -> dict[str, dict[str, Any]]:
    completed: dict[str, dict[str, Any]] = {}
    if not jsonl_path.exists():
        return completed
    for line_number, line in enumerate(jsonl_path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        row = json.loads(line)
        validate_row(row)
        question_id = row.get("questionId")
        if not question_id or question_id in completed:
            raise ValueError(f"questionId rỗng/trùng ở {jsonl_path}:{line_number}")
        completed[question_id] = row
    return completed


def build_comparison(rows: list[dict[str, Any]], source_by_id: dict[str, dict[str, Any]]) -> dict[str, Any]:
    """Compare distributions without treating a source-label mismatch as an error."""
    source_to_primary: dict[str, Counter[str]] = defaultdict(Counter)
    school_to_primary: dict[str, Counter[str]] = defaultdict(Counter)
    primary_to_secondary: dict[str, Counter[str]] = defaultdict(Counter)
    tag_counts: Counter[str] = Counter()
    low_confidence: list[dict[str, Any]] = []
    cross_domain: list[dict[str, Any]] = []

    for row in rows:
        source = source_by_id[row["questionId"]]
        source_topic = source.get("topic", "unknown")
        school = source.get("school", "unknown")
        primary = row["topicPrimary"]
        source_to_primary[source_topic][primary] += 1
        school_to_primary[school][primary] += 1
        for secondary in row["topicSecondary"]:
            primary_to_secondary[primary][secondary] += 1
        tag_counts.update(row["contextTags"])
        reference = {
            "questionId": row["questionId"],
            "school": school,
            "year": source.get("year"),
            "questionNo": source.get("num"),
            "systemTopic": source_topic,
            "topicPrimary": primary,
            "topicSecondary": row["topicSecondary"],
            "contextTags": row["contextTags"],
            "topicConfidence": row["topicConfidence"],
            "usedVisual": row.get("usedVisual", False),
            "topicRationale": row["topicRationale"],
        }
        if row["topicConfidence"] < 70:
            low_confidence.append(reference)
        if "cross_domain" in row["contextTags"]:
            cross_domain.append(reference)

    return {
        "comparisonMeaning": "Bảng là đối chiếu phân bố giữa nhãn nguồn và taxonomy độc lập; không phải thước đo nhãn nguồn đúng/sai.",
        "total": len(rows),
        "matrixSystemToPrimary": {key: dict(value) for key, value in sorted(source_to_primary.items())},
        "primaryDistributionBySchool": {key: dict(value) for key, value in sorted(school_to_primary.items())},
        "secondaryByPrimary": {key: dict(value) for key, value in sorted(primary_to_secondary.items())},
        "contextTagCounts": dict(tag_counts),
        "reviewCandidates": {
            "lowTopicConfidence": sorted(low_confidence, key=lambda item: (item["topicConfidence"], item["questionId"])),
            "crossDomain": sorted(cross_domain, key=lambda item: (-item["topicConfidence"], item["questionId"])),
        },
    }


def main() -> None:
    args = parse_args()
    if args.batch_size < 1 or args.max_workers < 1:
        raise ValueError("batch-size và max-workers phải lớn hơn 0")
    if args.reset and args.output_dir.exists():
        shutil.rmtree(args.output_dir)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    questions = load_json(args.input)
    if not isinstance(questions, list):
        raise ValueError("Input manifest phải là JSON array")
    if args.only_visual:
        questions = [question for question in questions if question.get("figure")]
    if args.limit is not None:
        if args.limit < 1:
            raise ValueError("limit phải lớn hơn 0")
        questions = questions[: args.limit]
    source_by_id = {question["questionId"]: question for question in questions}
    if len(source_by_id) != len(questions):
        raise ValueError("Manifest có questionId trùng lặp")

    urls = parse_upload_urls(args.asset_url_log)
    jsonl_path = args.output_dir / "topic-taxonomy-v1-assessments.jsonl"
    output_path = args.output_dir / "topic-taxonomy-v1-assessments.json"
    summary_path = args.output_dir / "topic-taxonomy-v1-summary.json"
    comparison_path = args.output_dir / "topic-taxonomy-v1-comparison.json"
    metadata_path = args.output_dir / "topic-taxonomy-v1-run-metadata.json"

    completed = load_completed(jsonl_path)
    unknown_completed = set(completed) - set(source_by_id)
    if unknown_completed:
        raise ValueError(f"JSONL có questionId không thuộc input hiện tại: {sorted(unknown_completed)[:5]}")
    pending = [question for question in questions if question["questionId"] not in completed]

    visual_tasks: list[tuple[dict[str, Any], str]] = []
    text_questions: list[dict[str, Any]] = []
    missing_visual_assets: list[dict[str, str]] = []
    for question in pending:
        asset = question.get("figureAsset")
        asset_png = Path(str(asset)).with_suffix(".png").name if asset else None
        if asset_png and asset_png in urls:
            visual_tasks.append((question, urls[asset_png]))
        else:
            text_questions.append(question)
            if question.get("figure"):
                missing_visual_assets.append({"questionId": question["questionId"], "figureKey": str(question.get("figure")), "figureAsset": str(asset or "")})

    text_batches = [text_questions[index:index + args.batch_size] for index in range(0, len(text_questions), args.batch_size)]
    planned = {
        "taxonomyVersion": TAXONOMY_VERSION,
        "totalInput": len(questions),
        "alreadyCompleted": len(completed),
        "pending": len(pending),
        "visualQuestions": len(visual_tasks),
        "textOnlyQuestions": len(text_questions),
        "missingVisualAssets": len(missing_visual_assets),
        "textBatches": len(text_batches),
        "model": args.model,
        "input": str(args.input),
        "assetUrlLog": str(args.asset_url_log) if args.asset_url_log else None,
        "outputDir": str(args.output_dir),
        "onlyVisual": args.only_visual,
    }
    print(json.dumps(planned, ensure_ascii=False, indent=2))
    if args.dry_run:
        write_json(args.output_dir / "topic-taxonomy-v1-dry-run.json", {**planned, "missingVisualAssetDetails": missing_visual_assets})
        return

    client = OpenAI()
    write_lock = threading.Lock()
    failures: list[dict[str, str]] = []

    def append_rows(rows: list[dict[str, Any]]) -> None:
        for row in rows:
            validate_row(row)
        with write_lock:
            with jsonl_path.open("a", encoding="utf-8") as handle:
                for row in rows:
                    row["model"] = args.model
                    row["taxonomyVersion"] = TAXONOMY_VERSION
                    row["assessedAt"] = datetime.now(timezone.utc).isoformat()
                    handle.write(json.dumps(row, ensure_ascii=False) + "\n")
                    completed[row["questionId"]] = row

    jobs: list[tuple[str, Any]] = [("visual", task) for task in visual_tasks] + [("text", batch) for batch in text_batches]

    def run_job(job: tuple[str, Any]) -> list[dict[str, Any]]:
        kind, payload = job
        if kind == "visual":
            question, image_url = payload
            return [classify_visual(client, args.model, question, image_url)]
        return classify_text_batch(client, args.model, payload)

    with futures.ThreadPoolExecutor(max_workers=args.max_workers) as executor:
        submitted = {executor.submit(run_job, job): job for job in jobs}
        for index, future in enumerate(futures.as_completed(submitted), start=1):
            job = submitted[future]
            try:
                rows = future.result()
                append_rows(rows)
                print(f"Completed {index}/{len(jobs)} jobs; {len(completed)}/{len(questions)} questions")
            except Exception as error:  # Provider/network failures are persisted in the run summary.
                failure: dict[str, str] = {"kind": job[0], "error": str(error)}
                if job[0] == "visual":
                    failure["questionId"] = job[1][0]["questionId"]
                else:
                    failure["questionIds"] = ",".join(question["questionId"] for question in job[1])
                failures.append(failure)
                print("FAILED " + json.dumps(failure, ensure_ascii=False), file=sys.stderr)

    final_rows = [completed[question["questionId"]] for question in questions if question["questionId"] in completed]
    if len({row["questionId"] for row in final_rows}) != len(final_rows):
        raise RuntimeError("Output có questionId trùng lặp")
    for row in final_rows:
        validate_row(row)

    comparison = build_comparison(final_rows, source_by_id)
    summary = {
        **planned,
        "completed": len(final_rows),
        "coveragePct": round((len(final_rows) / len(questions) * 100) if questions else 0, 2),
        "usedVisual": sum(bool(row.get("usedVisual")) for row in final_rows),
        "textOnly": sum(not bool(row.get("usedVisual")) for row in final_rows),
        "topicPrimaryCounts": dict(Counter(row["topicPrimary"] for row in final_rows)),
        "topicSecondaryCounts": dict(Counter(tag for row in final_rows for tag in row["topicSecondary"])),
        "contextTagCounts": dict(Counter(tag for row in final_rows for tag in row["contextTags"])),
        "topicConfidence": {
            "mean": round(sum(row["topicConfidence"] for row in final_rows) / len(final_rows), 2) if final_rows else 0,
            "high90Plus": sum(row["topicConfidence"] >= 90 for row in final_rows),
            "reviewBelow70": sum(row["topicConfidence"] < 70 for row in final_rows),
        },
        "failures": failures,
        "missingVisualAssetDetails": missing_visual_assets,
        "finishedAt": datetime.now(timezone.utc).isoformat(),
    }
    metadata = {
        "runKind": "independent_primary_math_topic_classification",
        "taxonomyVersion": TAXONOMY_VERSION,
        "model": args.model,
        "systemPrompt": SYSTEM_PROMPT,
        "primaryTopics": PRIMARY_TOPICS,
        "contextTags": CONTEXT_TAGS,
        "inputManifest": str(args.input),
        "assetUrlLog": str(args.asset_url_log) if args.asset_url_log else None,
        "startedWithCompleted": planned["alreadyCompleted"],
        "completed": len(final_rows),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
    write_json(output_path, final_rows)
    write_json(summary_path, summary)
    write_json(comparison_path, comparison)
    write_json(metadata_path, metadata)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    if failures or len(final_rows) != len(questions):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
