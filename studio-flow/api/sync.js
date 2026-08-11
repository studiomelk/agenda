/**
 * Server-side bridge between Studio Melk Flow and Studio Melk Manager.
 * The secret is stored only in Vercel Environment Variables; it is never
 * sent to, or embedded in, the browser.
 */
module.exports = async (request, response) => {
  if (!["GET", "POST"].includes(request.method)) {
    response.setHeader("Allow", "GET, POST");
    return response.status(405).json({ error: "Use POST." });
  }

  const expectedPairCode = process.env.STUDIO_PAIR_CODE;
  const pairCode = request.headers["x-studio-pair-code"];
  if (!expectedPairCode || !pairCode || pairCode !== expectedPairCode) {
    return response.status(401).json({ error: "Código de conexão inválido." });
  }

  const managerUrl = process.env.MANAGER_SYNC_URL;
  const secret = process.env.GERADOR_SYNC_SECRET;
  if (!managerUrl || !secret) {
    return response.status(503).json({ error: "A conexão ainda não foi configurada no servidor." });
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
