/**
 * Server-side bridge between Studio Melk Flow and Studio Melk Manager.
 * The secret is stored only in Vercel Environment Variables; it is never
 * sent to, or embedded in, the browser.
 */
const crypto = require("crypto");

function encodeToken(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signToken(payload, secret) {
  const encoded = encodeToken(payload);
  const signature = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyToken(token, secret) {
  try {
    if (!token || !secret) return null;
    const [encoded, signature] = String(token).split(".");
    if (!encoded || !signature) return null;
    const expected = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
    const receivedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (receivedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

module.exports = async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Studio-Pair-Code, X-Studio-Public-Token");
  response.setHeader("Cache-Control", "no-store");
  if (request.method === "OPTIONS") return response.status(204).end();
  if (!["GET", "POST"].includes(request.method)) {
    response.setHeader("Allow", "GET, POST, OPTIONS");
    return response.status(405).json({ error: "Use POST." });
  }

  const expectedPairCode = process.env.STUDIO_PAIR_CODE;
  const pairCode = request.headers["x-studio-pair-code"];
  const managerUrl = process.env.MANAGER_CANONICAL_SYNC_URL || "https://studio-melk.vercel.app/api/integrations/gerador";
  const secret = process.env.GERADOR_SYNC_SECRET;
  if (!managerUrl || !secret) {
    return response.status(503).json({ error: "A conexão ainda não foi configurada no servidor." });
  }

  const pairAuthorized = Boolean(expectedPairCode && pairCode && pairCode === expectedPairCode);
  if (request.method === "GET" && request.query?.issue === "public-token") {
    if (!pairAuthorized) return response.status(401).json({ error: "Código de conexão inválido." });
    const scope = request.query.scope === "lead" ? "lead" : "contract";
    const externalId = scope === "contract" ? String(request.query.externalId || "") : "";
    if (scope === "contract" && !externalId) return response.status(400).json({ error: "Informe o identificador da proposta." });
    const token = signToken({ scope, externalId, exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) }, secret);
    return response.status(200).json({ token, scope, expiresIn: 31536000 });
  }

  const publicToken = verifyToken(request.headers["x-studio-public-token"], secret);
  const publicAuthorized = request.method === "POST" && publicToken && publicToken.scope === request.body?.type
    && (!publicToken.externalId || publicToken.externalId === request.body?.externalId);
  if (!pairAuthorized && !publicAuthorized) {
    return response.status(401).json({ error: "Integração não autorizada." });
  }

  try {
    const headers = request.method === "GET"
      ? { "x-studio-pair-code": pairCode }
      : { "content-type": "application/json", authorization: `Bearer ${secret}` };
    const upstream = await fetch(managerUrl, {
      method: request.method,
      headers,
      body: request.method === "POST" ? JSON.stringify(request.body) : undefined,
    });
    const body = await upstream.json().catch(() => ({ error: "Resposta inválida do CRM." }));
    return response.status(upstream.status).json(body);
  } catch {
    return response.status(502).json({ error: "Não foi possível falar com o CRM agora." });
  }
};
