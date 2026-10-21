/** Utilitários do servidor do Gerador para falar com o Melk CRM (HMAC + aparelho). */
const crypto = require("crypto");
const COOKIE = "mcrm_dev";

function crmUrl() {
  return process.env.MANAGER_CANONICAL_SYNC_URL || process.env.MANAGER_SYNC_URL || "https://melk-crm.vercel.app/api/integrations/gerador";
}
function readCookie(request, name = COOKIE) {
  const raw = request.headers.cookie || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return "";
}
function deviceCookie(token, maxAge) {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
/** Chama o CRM assinando `${ts}.${corpo}` (POST) ou `${ts}.${query}` (GET). */
async function callCrm({ method = "GET", query = "", body, device }) {
  const secret = process.env.GERADOR_SYNC_SECRET;
  if (!secret) return { status: 503, body: { error: "A conexão com o CRM ainda não foi configurada no servidor." } };
  const raw = method === "POST" ? JSON.stringify(body || {}) : query;
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = crypto.createHmac("sha256", secret).update(`${ts}.${raw}`).digest("hex");
  const headers = { "x-melk-timestamp": ts, "x-melk-signature": sig };
  if (method === "POST") headers["content-type"] = "application/json";
  if (device) headers["x-gerador-device"] = device;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const r = await fetch(crmUrl() + (query ? "?" + query : ""), { method, headers, body: method === "POST" ? raw : undefined, signal: controller.signal });
    const b = await r.json().catch(() => ({}));
    if (r.ok) return { status: 200, body: b };
    const reason = b.error || `HTTP ${r.status}`;
    if (b.code === "device_revoked") return { status: 401, body: { error: reason, code: "device_revoked" } };
    const prefix = r.status === 401 ? "O CRM recusou a assinatura (segredo diferente entre os apps)" : r.status >= 500 ? "O CRM está fora do ar ou com erro" : "O CRM recusou os dados";
    return { status: r.status === 401 ? 502 : r.status, body: { error: `${prefix}: ${reason}` } };
  } catch (e) {
    return { status: 504, body: { error: e && e.name === "AbortError" ? "O CRM demorou para responder. Tente novamente em instantes." : "Não foi possível falar com o CRM agora. Tente novamente em instantes." } };
  } finally { clearTimeout(timer); }
}
module.exports = { COOKIE, readCookie, deviceCookie, callCrm };
