import assert from "node:assert/strict";

const baseUrl = (process.env.READINESS_E2E_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const cookie = process.env.READINESS_E2E_COOKIE;
const authenticated = Boolean(cookie);

const routes = [
  "/admin?tab=readiness&subject=math",
  "/admin/readiness/compare",
  "/admin/readiness/policies",
  "/admin/readiness/simulator",
  "/admin/readiness/profiles",
  "/admin/readiness/jobs/nonexistent",
];

async function request(path: string): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    headers: cookie ? { cookie } : {},
  });
}

async function main() {
  const signin = await request("/signin");
  assert.ok(signin.status >= 200 && signin.status < 400, `signin returned ${signin.status}`);
  const results: Array<{ path: string; status: number; location: string | null }> = [];
  for (const path of routes) {
    const response = await request(path);
    assert.ok(response.status < 500, `${path} returned server error ${response.status}`);
    const location = response.headers.get("location");
    if (authenticated) assert.ok(response.status === 200, `${path} must render with supplied authenticated cookie; got ${response.status}`);
    else assert.ok([200, 301, 302, 303, 307, 308].includes(response.status), `${path} returned unexpected ${response.status}`);
    results.push({ path, status: response.status, location });
  }
  if (authenticated) {
    const admin = await request("/admin?tab=readiness&subject=math");
    const html = await admin.text();
    for (const expected of ["Readiness", "Policy", "Profile", "Simulator"]) {
      assert.match(html, new RegExp(expected, "i"), `Admin readiness page is missing ${expected}`);
    }
  }
  console.log(JSON.stringify({ baseUrl, authenticated, routes: results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
