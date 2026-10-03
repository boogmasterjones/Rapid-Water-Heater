// Receives the website estimate form and creates the client + request in Jobber.
// The email copy (FormSubmit) is sent separately by the browser, so a Jobber problem never loses a lead.
const jobber = require("../lib/jobber");

const ALLOWED_HOSTS = ["rapidwaterheater.co", "www.rapidwaterheater.co", "localhost"];

function json(statusCode, body) {
  return { statusCode: statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) };
}

function clean(value, max) {
  return String(value == null ? "" : value).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") return json(405, { ok: false, error: "method" });

  const origin = event.headers.origin || event.headers.referer || "";
  let host = "";
  try { host = new URL(origin).hostname; } catch (e) { /* no origin */ }
  if (ALLOWED_HOSTS.indexOf(host) === -1) return json(403, { ok: false, error: "origin" });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch (e) { return json(400, { ok: false, error: "json" }); }

  if (body._honey) return json(200, { ok: true });

  const lead = {
    name: clean(body.name, 100),
    phone: clean(body.phone, 40),
    email: clean(body.email, 120),
    serviceArea: clean(body["service-area"], 60),
    services: Array.isArray(body.services) ? body.services.slice(0, 10).map(function (s) { return clean(s, 80); }).filter(Boolean) : []
  };
  if (!lead.name || (!lead.phone && !lead.email)) return json(400, { ok: false, error: "missing" });

  try {
    const clientId = await jobber.createClient(lead);
    try {
      await jobber.createRequest(clientId, lead);
      return json(200, { ok: true });
    } catch (err) {
      console.error("Jobber client created but request failed:", err.message);
      return json(200, { ok: true, partial: "client-only" });
    }
  } catch (err) {
    console.error("Jobber lead failed:", err.message);
    return json(502, { ok: false, error: "jobber" });
  }
};
