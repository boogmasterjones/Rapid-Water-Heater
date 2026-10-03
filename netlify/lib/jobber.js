// Minimal Jobber API client for the website's lead form. No dependencies (Node 18+ global fetch).
// Env vars (set in Netlify): JOBBER_CLIENT_ID, JOBBER_CLIENT_SECRET, JOBBER_REFRESH_TOKEN,
// optional JOBBER_API_VERSION and SITE_URL.

const SITE_URL = process.env.SITE_URL || "https://rapidwaterheater.co";
const API_URL = "https://api.getjobber.com/api/graphql";
const TOKEN_URL = "https://api.getjobber.com/api/oauth/token";
const AUTHORIZE_URL = "https://api.getjobber.com/api/oauth/authorize";
const API_VERSION = process.env.JOBBER_API_VERSION || "2026-05-12";
const REDIRECT_URI = SITE_URL + "/.netlify/functions/jobber-callback";

let cached = { token: null, expiresAt: 0 };

async function tokenRequest(params) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(Object.assign({
      client_id: process.env.JOBBER_CLIENT_ID,
      client_secret: process.env.JOBBER_CLIENT_SECRET
    }, params))
  });
  const data = await res.json().catch(function () { return {}; });
  if (!res.ok || !data.access_token) throw new Error("Jobber token request failed (HTTP " + res.status + ")");
  return data;
}

async function getAccessToken() {
  if (cached.token && Date.now() < cached.expiresAt - 60000) return cached.token;
  const refreshToken = process.env.JOBBER_REFRESH_TOKEN;
  const data = await tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken });
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    console.warn("Jobber issued a NEW refresh token, so Refresh Token Rotation is ON. Turn it off for this app in the Jobber Developer Center, then re-run the connect step.");
  }
  cached = { token: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
  return cached.token;
}

async function graphql(query, retried) {
  const token = await getAccessToken();
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "X-JOBBER-GRAPHQL-VERSION": API_VERSION,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query: query })
  });
  if (res.status === 401 && !retried) {
    cached = { token: null, expiresAt: 0 };
    return graphql(query, true);
  }
  const json = await res.json().catch(function () { return null; });
  if (!res.ok || !json) throw new Error("Jobber API HTTP " + res.status);
  if (json.errors && json.errors.length) {
    throw new Error("Jobber API: " + json.errors.map(function (e) { return e.message; }).join("; "));
  }
  return json.data;
}

function userErrorText(payload) {
  const errs = payload && payload.userErrors;
  return errs && errs.length ? errs.map(function (e) { return e.message; }).join("; ") : "";
}

// All values below are inlined as JSON-escaped string literals, which are valid GraphQL strings.
async function createClient(lead) {
  const parts = lead.name.trim().split(/\s+/);
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ") || "(Website Lead)";
  const fields = [
    "firstName: " + JSON.stringify(firstName),
    "lastName: " + JSON.stringify(lastName)
  ];
  if (lead.email) fields.push("emails: [{ description: MAIN, primary: true, address: " + JSON.stringify(lead.email) + " }]");
  if (lead.phone) fields.push("phones: [{ description: MAIN, primary: true, number: " + JSON.stringify(lead.phone) + " }]");
  const data = await graphql(
    "mutation { clientCreate(input: { " + fields.join(", ") + " }) { client { id } userErrors { message path } } }"
  );
  const err = userErrorText(data.clientCreate);
  if (err || !data.clientCreate.client) throw new Error("clientCreate rejected: " + err);
  return data.clientCreate.client.id;
}

// NOTE: the exact input fields of the request-creation mutation still need to be confirmed against
// the live schema (Developer Center > Test in GraphiQL). Everything request-specific lives here.
async function createRequest(clientId, lead) {
  const title = ("Website request: " + (lead.services.join(", ") || "Estimate") + (lead.serviceArea ? " (" + lead.serviceArea + ")" : "")).slice(0, 200);
  const data = await graphql(
    "mutation { requestCreate(input: { clientId: " + JSON.stringify(clientId) + ", title: " + JSON.stringify(title) + " }) { request { id } userErrors { message path } } }"
  );
  const err = userErrorText(data.requestCreate);
  if (err || !data.requestCreate.request) throw new Error("requestCreate rejected: " + err);
  return data.requestCreate.request.id;
}

module.exports = { SITE_URL, TOKEN_URL, AUTHORIZE_URL, REDIRECT_URI, tokenRequest, graphql, createClient, createRequest };
