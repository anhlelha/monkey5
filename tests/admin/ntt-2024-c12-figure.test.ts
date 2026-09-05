import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IMPLEMENTED_FIGURES } from "../../app/(app)/admin/qa-constants";
import { ExamFigure } from "../../components/ExamFigure";

test("admin preview recognizes and renders the NTT 2024 question 12 figure", () => {
  const figure = "ntt-2024-c12";

  assert.equal(IMPLEMENTED_FIGURES.has(figure), true);

  const markup = renderToStaticMarkup(
    React.createElement(ExamFigure, { figure }),
  );
  assert.match(markup, /<svg/);
  assert.match(markup, /Hình thang ABCD/);
});
