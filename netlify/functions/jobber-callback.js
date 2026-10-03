// One-time setup: Jobber redirects here after "Allow Access". Shows the refresh token to paste into Netlify.
const jobber = require("../lib/jobber");

const esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

function page(statusCode, html) {
  return { statusCode: statusCode, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }, body: "<!doctype html><meta charset=utf-8><meta name=robots content=noindex><title>Jobber connect</title><body style=\"font-family:system-ui;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.5\">" + html };
}

exports.handler = async function (event) {
  const q = event.queryStringParameters || {};
  const cookie = ((event.headers.cookie || "").match(/(?:^|;\s*)rwh_jobber=([^;]+)/) || [])[1] || "";
  const parts = cookie.split(".");
  if (!q.code || !q.state || parts.length !== 2 || parts[0] !== q.state) {
    return page(400, "<h2>That didn't work</h2><p>Start again from <code>/.netlify/functions/jobber-connect</code> in the same browser.</p>");
  }
  try {
    const data = await jobber.tokenRequest({
      grant_type: "authorization_code",
      code: q.code,
      redirect_uri: jobber.REDIRECT_URI,
      code_verifier: parts[1]
    });
    return page(200,
      "<h2>Jobber is connected</h2>" +
      "<p>Copy this value into Netlify as the environment variable <b>JOBBER_REFRESH_TOKEN</b>, then trigger a new deploy.</p>" +
      "<p><code style=\"word-break:break-all;background:#f3f3f3;padding:8px;display:block\">" + esc(data.refresh_token) + "</code></p>" +
      "<p>Keep it private. You can close this page afterwards.</p>");
  } catch (err) {
    console.error("Jobber connect failed:", err.message);
    return page(502, "<h2>Jobber rejected the connection</h2><p>Check the client ID, client secret and callback URL in the Jobber app, then try again.</p>");
  }
};
