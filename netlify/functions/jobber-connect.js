// One-time setup: a Jobber admin opens /.netlify/functions/jobber-connect and clicks "Allow Access".
const crypto = require("crypto");
const jobber = require("../lib/jobber");

const b64url = function (buf) { return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };

exports.handler = async function () {
  if (!process.env.JOBBER_CLIENT_ID || !process.env.JOBBER_CLIENT_SECRET) {
    return { statusCode: 500, headers: { "Content-Type": "text/plain" }, body: "Set JOBBER_CLIENT_ID and JOBBER_CLIENT_SECRET in Netlify first, then redeploy." };
  }
  const state = b64url(crypto.randomBytes(16));
  const verifier = b64url(crypto.randomBytes(48));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  const url = jobber.AUTHORIZE_URL + "?" + new URLSearchParams({
    response_type: "code",
    client_id: process.env.JOBBER_CLIENT_ID,
    redirect_uri: jobber.REDIRECT_URI,
    state: state,
    code_challenge: challenge,
    code_challenge_method: "S256"
  });
  return {
    statusCode: 302,
    headers: {
      Location: url,
      "Cache-Control": "no-store",
      "Set-Cookie": "rwh_jobber=" + state + "." + verifier + "; Max-Age=600; Path=/.netlify/functions; HttpOnly; Secure; SameSite=Lax"
    }
  };
};
