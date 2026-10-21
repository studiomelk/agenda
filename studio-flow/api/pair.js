/** Conexão do aparelho com o Melk CRM: guarda o token do aparelho em cookie HttpOnly (nunca no localStorage). */
const { readCookie, deviceCookie, callCrm } = require("./_crm");

module.exports = async (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  if (request.method === "GET") {
    const dev = readCookie(request);
    if (!dev) return response.status(200).json({ connected: false });
    const r = await callCrm({ device: dev });
    if (r.status === 401 && r.body.code === "device_revoked") {
      response.setHeader("Set-Cookie", deviceCookie("", 0));
      return response.status(200).json({ connected: false, error: r.body.error });
    }
    return response.status(r.status === 200 ? 200 : r.status).json(r.status === 200 ? { connected: true, message: r.body.message, device: r.body.device } : { connected: true, error: r.body.error });
  }
  if (request.method === "POST") {
    const token = String((request.body && request.body.token) || "");
    if (!/^gdv_[A-Za-z0-9_-]{20,120}$/.test(token)) return response.status(400).json({ error: "Código de conexão inválido." });
    const r = await callCrm({ device: token });
    if (r.status !== 200 || !r.body.device) return response.status(401).json({ error: r.body.error || "O CRM não reconheceu este aparelho." });
    response.setHeader("Set-Cookie", deviceCookie(token, 60 * 60 * 24 * 365));
    return response.status(200).json({ connected: true, message: r.body.message, device: r.body.device });
  }
  if (request.method === "DELETE") {
    response.setHeader("Set-Cookie", deviceCookie("", 0));
    return response.status(200).json({ connected: false });
  }
  response.setHeader("Allow", "GET, POST, DELETE");
  return response.status(405).json({ error: "Método não permitido." });
};
