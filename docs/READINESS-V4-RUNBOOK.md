# Readiness v4 — Runbook triển khai và rollback

Readiness v4 là additive. Không xoá hoặc đổi shape `User.topicMastery`,
`User.readiness`, legacy `SchoolProfile` hay dữ liệu `Attempt`.

## 1. Điều kiện trước deploy

- Có backup SQLite và đã thử restore.
- `npm test` đạt.
- `npx prisma validate` đạt.
- Migration diff chỉ chứa bảng/index/trigger mới và `ALTER TABLE ADD COLUMN`.
- Artifact assessment đã được chuyển tới máy chạy importer.
- Có hai admin active để đáp ứng four-eyes.

## 2. Schema

```bash
cp prisma/dev.db prisma/dev.db.bak-pre-readiness-v4
npm run db:migrate
npx prisma generate
sqlite3 prisma/dev.db 'PRAGMA integrity_check;'
```

Không dùng `prisma db push --accept-data-loss` cho rollout v4.

## 3. Assessment import

Dry-run bắt buộc:

```bash
npx tsx scripts/readiness-v4/import-assessments.ts \
  --artifact .analysis/math-reassessment-fresh-gpt56sol-20260824T120947Z
```

Chỉ apply khi `missing=0`, `conflicts=0`, `invalid=0`:

```bash
npx tsx scripts/readiness-v4/import-assessments.ts \
  --artifact .analysis/math-reassessment-fresh-gpt56sol-20260824T120947Z \
  --apply --approve --approved-by INTERNAL_ADMIN_ID

npx tsx scripts/readiness-v4/import-assessments.ts \
  --artifact .analysis/math-reassessment-fresh-gpt56sol-20260824T120947Z \
  --supplemental-mika --apply --approve --approved-by INTERNAL_ADMIN_ID
```

Chạy lại importer phải trả toàn bộ row là `unchanged`, không tạo duplicate.

### 3A. Assessment Question Bank canonical còn thiếu

Export deterministic (dry, không gọi AI):

```bash
npm run readiness:v4:export-bank -- \
  --output-dir .analysis/math-question-bank-v4-YYYYMMDD
```

Kiểm tra `export-summary.json`: manifest count/unique đúng, `assetFailures=[]`,
không có PII/legacy topic/grade và generated clone không nằm trong model input.

Chạy hai pass bằng Codex runtime và khóa model `gpt-5.6-sol`. Runner này dùng
toàn bộ instruction
`.reports/INSTRUCTION-TAI-DANH-GIA-TOAN-DA-PHUONG-THUC.md` v2.0, giống pipeline
849 câu official. Không dùng provider đang bật trong Admin → AI LLMs và không
được thay bằng Gemini:

```bash
npm run readiness:v4:assess-bank -- \
  --output-dir .analysis/math-question-bank-v4-YYYYMMDD \
  --pass all
```

Runner checkpoint bằng JSONL và có thể chạy lại cùng lệnh. Validator chặn enum,
topic ngoài taxonomy, confidence/độ khó sai, thiếu rationale, duplicate hoặc
thiếu ID.

Chuẩn bị QA cho toàn bộ visual, low-confidence, D5 outlier và sample phân tầng:

```bash
npm run readiness:v4:prepare-bank-qa -- \
  --output-dir .analysis/math-question-bank-v4-YYYYMMDD

npm run readiness:v4:assess-bank -- \
  --output-dir .analysis/math-question-bank-v4-YYYYMMDD \
  --input .analysis/math-question-bank-v4-YYYYMMDD/qa-model-input-manifest.json \
  --output-prefix qa-judge --pass all
```

QA input chỉ chứa manifest câu hỏi gốc, không chứa kết quả first pass hoặc nhãn
legacy, để judge đánh giá độc lập. Có thể resume cùng lệnh từ checkpoint JSONL.

Dry-run importer, sau đó mới apply/approve khi report sạch:

```bash
npm run readiness:v4:import-assessments -- \
  --artifact .analysis/math-question-bank-v4-YYYYMMDD

npm run readiness:v4:import-assessments -- \
  --artifact .analysis/math-question-bank-v4-YYYYMMDD \
  --apply --approve --approved-by INTERNAL_ADMIN_ID
```

Sau approve, importer chỉ enqueue recompute cho user có submitted attempt chứa
câu canonical vừa được assessment hoặc generated clone trỏ tới câu đó. Importer
không rebuild School Profile từ supplement/private/reference.

## 4. Shadow setup

```bash
npx tsx scripts/readiness-v4/build-school-profiles.ts --apply
npx tsx scripts/readiness-v4/seed-shadow-policy.ts
npx tsx scripts/readiness-v4/seed-admin-permissions.ts
npx tsx scripts/readiness-v4/seed-content-taxonomy-mapping.ts
npx tsx scripts/readiness-v4/enable-shadow.ts
npx tsx scripts/readiness-v4/create-shadow-job.ts
npx tsx scripts/readiness-v4/worker.ts
npx tsx scripts/readiness-v4/generate-shadow-report.ts
```

`readinessV4ReadEnabled` phải vẫn là `false` trong toàn bộ giai đoạn này.

## 5. Review gate

Trước activation phải kiểm tra:

- Job mới nhất `completed`, `failedItems=0`.
- `invariantViolations=0` trong shadow comparison report.
- Assessment coverage của fixture bằng 100% hoặc có exception đã duyệt.
- Point/count delta và Mika fixture đã được review.
- Hai admin khác nhau thực hiện create/review/activation.
- Home, Overview, Results, Library và School detail cùng dùng read adapter.

## 6. Activation và cutover

Trong Admin → Readiness v4:

1. `Activate global`: chuyển profile/policy pointer, nhưng chưa đổi UI.
2. Kiểm tra số assignment và snapshot coverage.
3. `Bật read v4`: áp dụng global cho toàn bộ user.

Activation không được gộp tự động vào deploy code.

## 7. Worker

Production chạy worker riêng:

```bash
pm2 start npx --name monkey5-readiness-v4-worker -- \
  tsx scripts/readiness-v4/worker.ts --poll
```

Job có lease, tối đa ba attempt/item, tự pause khi failure rate vượt 5%.

## 8. Rollback

Ưu tiên tắt read flag trước:

1. Admin → `Tắt read v4`, hoặc đặt `readinessV4ReadEnabled=false`.
2. UI quay lại legacy; không xoá snapshot.
3. Dùng `Rollback global` để kết thúc assignment hiện tại và quay pointer về
   version trước nếu có.
4. Tạo recompute job cho version được phục hồi nếu cần.

Rollback không update hoặc xoá snapshot/policy/profile cũ.

Rollback toàn DB chỉ dùng khi migration/schema bị lỗi:

```bash
cp prisma/dev.db.bak-pre-readiness-v4 prisma/dev.db
pm2 restart monkey5
pm2 restart monkey5-readiness-v4-worker
```

## 9. Monitoring tối thiểu

- Job queue depth và checkpoint age.
- `processed/success/failed` theo job.
- Snapshot stale/missing so với global assignment.
- Invariant violations.
- Phân bố `unverified`, `evidence_limited`, `ready`.
- Legacy-v4 và point-count delta.
- Recommendation không có content mapping.

## 10. Global read gate và active-read monitoring

Trước khi bật hoặc xác nhận `readinessV4ReadEnabled`, chạy:

```bash
npm run readiness:v4:check-read-gates
```

Gate checker không chứa PII và kiểm tra active policy pointer, active profile pointers, shadow/active-backfill job, unique user × profile snapshot coverage và invariant `Readiness ≤ SchoolMastery × 100`. Chỉ coi `go=true` là điều kiện kỹ thuật; Product/Academic/Release sign-off vẫn bắt buộc.

Sau khi policy đã ở trạng thái active, dùng active report thay cho shadow report:

```bash
npm run readiness:v4:active-report
```

Report chỉ xuất aggregate theo status/school, không xuất user ID, email hoặc answer. Nếu cần kiểm tra một candidate mới, phải clone active thành Draft, validate, move sang Shadow rồi chạy Simulator; không dùng active report để thay thế impact preview cho candidate.

Khi global read đã bật, không tắt `readinessV4PersistLegacyEnabled` trong rollback window. Nếu có lỗi critical, tắt `readinessV4ReadEnabled` trước, giữ snapshot/audit/job history và chỉ rollback pointer hoặc database sau khi đã lưu incident evidence.
