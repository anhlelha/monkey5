import assert from "node:assert/strict";
import test from "node:test";
import { isAtomicPracticeStem } from "../../lib/readiness-v4/practice-service";

test("topic practice rejects source rows that bundle independent worksheet tasks", () => {
  assert.equal(isAtomicPracticeStem("Một bài toán độc lập."), true);
  assert.equal(isAtomicPracticeStem("**Bài 1:** Câu hỏi duy nhất."), true);
  assert.equal(isAtomicPracticeStem("**Bài 1:** Số học.\n\n**Bài 2:** Hình học."), false);
  assert.equal(isAtomicPracticeStem("**Bài 1.** Số học.\n\n**Bài 2.** Hình học."), false);
});
