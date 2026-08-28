# Readiness V4 — Migration runner và rollback safety

## Mục đích

Runner này bảo vệ quá trình migrate Readiness V4 trước các lỗi thường gặp: chạy nhầm production target, migration có SQL destructive, database backup không khớp, SQLite integrity lỗi hoặc schema diff chưa được review. Runner mặc định là **dry-run** và chỉ cho phép `--apply` với target `local-dev`.

## Lệnh sử dụng

Từ root project:

```bash
# Dry-run: validate migration files, Prisma schema, integrity và migration status
npm run readiness:v4:migrate

# Dry-run + tạo backup và rollback rehearsal copy
npm run readiness:v4:migrate -- --rollback-check

# Apply chỉ trên local-dev sau khi đã review output
npm run readiness:v4:migrate -- --apply --target=local-dev

# Apply local-dev và ngay sau đó chạy rollback rehearsal
npm run readiness:v4:migrate -- --apply --target=local-dev --rollback-check
```

Có thể chỉ định database/backup path cho môi trường cô lập:

```bash
npm run readiness:v4:migrate -- \
  --database=/absolute/path/to/release-candidate.db \
  --backup-dir=/absolute/path/to/backup-dir \
  --target=release-candidate
```

`--apply` hiện cố ý bị giới hạn ở `--target=local-dev`. Release candidate phải được rehearsal bằng copy cô lập và chỉ chuyển sang thao tác production sau khi owner phê duyệt quy trình riêng.

## Safety gates

Runner sẽ dừng nếu migration có `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `DELETE FROM`, update hàng loạt hoặc `ALTER TABLE` không phải `ADD COLUMN`; nếu migration file thiếu; nếu `DATABASE_PATH` hoặc `--target` có dấu hiệu production; nếu `PRAGMA integrity_check` không trả `ok`; hoặc nếu `PRAGMA foreign_key_check` có kết quả.

Trước khi apply, runner kiểm tra Prisma schema, migration inventory, hash của backup và trạng thái `_prisma_migrations`. Khi có `--rollback-check`, runner tạo một bản copy rehearsal từ backup, chạy integrity/foreign-key check, kiểm tra migration metadata và chạy `prisma migrate diff` với schema hiện tại. Rehearsal không tự động xoá artifact để có thể kiểm tra thủ công.

> Rollback của Prisma migration không đồng nghĩa tự động hoàn nguyên dữ liệu. Artifact backup là nguồn phục hồi; không dùng `prisma migrate resolve --rolled-back` như một thao tác undo schema nếu chưa có kế hoạch restore/recovery được review.

## Quy trình release candidate

Trước hết tạo bản sao database và chạy dry-run. Tiếp theo chạy rollback rehearsal trên bản sao; kiểm tra `integrity_check`, foreign keys, schema diff, migration metadata và backup hash. Sau đó chạy migration trên release-candidate copy, kiểm tra lại integrity và smoke test ứng dụng. Cuối cùng cập nhật Runbook, lưu output runner, hash backup, migration status và quyết định rollback/forward-fix của owner.

Không chạy `prisma db push --accept-data-loss`, `db:reset` hoặc xoá migration history trong quy trình này. Không deploy production tự động từ runner.
