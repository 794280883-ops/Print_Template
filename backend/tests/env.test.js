import assert from "node:assert/strict";
import test from "node:test";

async function loadEnv(overrides = {}) {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET,
    PDF_CJK_FONT_PATH: process.env.PDF_CJK_FONT_PATH,
  };
  for (const key of Object.keys(previous)) {
    delete process.env[key];
  }
  Object.assign(process.env, overrides);

  try {
    return await import(`../src/config/env.js?test=${Date.now()}_${Math.random()}`);
  } finally {
    for (const key of Object.keys(previous)) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

test("production environment requires JWT_SECRET", async () => {
  await assert.rejects(
    () => loadEnv({ NODE_ENV: "production" }),
    /JWT_SECRET/,
  );
});

test("development environment keeps a local JWT_SECRET fallback", async () => {
  const { env } = await loadEnv({ NODE_ENV: "development" });
  assert.equal(env.jwtSecret, "wms-print-template-jwt-secret");
});

test("PDF CJK font path can be configured by environment", async () => {
  const { env } = await loadEnv({
    NODE_ENV: "development",
    PDF_CJK_FONT_PATH: "/opt/fonts/NotoSansCJK-Regular.otf",
  });
  assert.equal(env.pdf.cjkFontPath, "/opt/fonts/NotoSansCJK-Regular.otf");
});

test("PDF CJK font path keeps the existing local fallback", async () => {
  const { env } = await loadEnv({ NODE_ENV: "development" });
  assert.equal(env.pdf.cjkFontPath, "/Library/Fonts/Arial Unicode.ttf");
});
