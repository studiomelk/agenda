"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight, CalendarDays, Check, ChevronRight, CircleDollarSign,
  ClipboardList, FileText, LayoutDashboard, MessageCircle, Plus,
  Search, ShieldCheck, Sparkles, UsersRound, MapPin, UserRoundCheck,
  ReceiptText, WalletCards, ExternalLink, CheckCircle2, Clock3, Pencil, Paperclip, Share2, Mail, Phone, UserRound, Trash2, RotateCcw, Save
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { leadStages, type LeadStage } from "../lib/lead-intake";
import { recoveredEvents, recoveredTeam } from "../lib/recovered-studio-data";
import { useOriginalStudioData, type OriginalStudioData } from "../lib/firebase-original";

type Lead = {
  id: string;
  name: string;
  initials: string;
  source: "Proposta" | "WhatsApp" | "Formulário" | "Gerador";
  stage: LeadStage;
  event: string;
  date: string;
  value: string;
  next: string;
  tone: string;
  email?: string;
  phone?: string;
  service?: string;
  venue?: string;
  paymentMethod?: string;
  installments?: string;
  contractUrl?: string;
};

const initialLeads: Lead[] = [
  { id: "L-024", name: "Nathalia & Victor", initials: "NV", source: "Proposta", stage: "Proposta enviada", event: "Casamento · Campinas", date: "18 out 2026", value: "R$ 8.400", next: "Retornar amanhã", tone: "rose", email: "cliente@exemplo.com", phone: "(19) 99999-0000", service: "Foto e vídeo · dia completo", venue: "Campinas, SP", paymentMethod: "Pix e cartão", installments: "30% de sinal + 2 parcelas" },
  { id: "L-023", name: "Marina Alves", initials: "MA", source: "WhatsApp", stage: "Negociação", event: "Ensaio de família · Jundiaí", date: "06 set 2026", value: "R$ 2.200", next: "Ajustar pacote", tone: "violet" },
  { id: "L-022", name: "Beatriz & Lucas", initials: "BL", source: "Formulário", stage: "Qualificado", event: "Casamento · São Paulo", date: "22 nov 2026", value: "R$ 10.800", next: "Enviar proposta", tone: "gold" },
  { id: "L-021", name: "Casa Prana", initials: "CP", source: "WhatsApp", stage: "Contato feito", event: "Evento corporativo · Campinas", date: "14 ago 2026", value: "R$ 4.600", next: "Confirmar briefing", tone: "teal" },
  { id: "L-020", name: "Clara Monteiro", initials: "CM", source: "Formulário", stage: "Novo lead", event: "Ensaio gestante · Valinhos", date: "03 out 2026", value: "R$ 1.850", next: "Fazer primeiro contato", tone: "blue" },
];

const navigation: [LucideIcon, string][] = [
  [LayoutDashboard, "Visão geral"], [UsersRound, "Leads"], [FileText, "Propostas"],
  [ClipboardList, "Contratos"], [CalendarDays, "Agenda"], [UserRoundCheck, "Equipe"],
  [CircleDollarSign, "Financeiro"], [Trash2, "Lixeira"], [ShieldCheck, "Importação"],
];

export default function Page() {
  const originalData = useOriginalStudioData();
  const [leads, setLeads] = useState(initialLeads);
  const [query, setQuery] = useState("");
  const [activeView, setActiveView] = useState("Visão geral");
  const [selectedId, setSelectedId] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [notice, setNotice] = useState("Studio Melk Flow conectado. Novos dados entram automaticamente.");
  const selected = leads.find((lead) => lead.id === selectedId);
  const filtered = useMemo(() => leads.filter((lead) =>
    `${lead.name} ${lead.event} ${lead.source}`.toLowerCase().includes(query.toLowerCase())), [leads, query]);
  const activeStages: LeadStage[] = ["Novo lead", "Qualificado", "Proposta enviada", "Negociação", "Aceita"];

  useEffect(() => {
    if (!accessKey) return;
    fetch("/api/staging/solicitacoes", { headers: { "x-manager-access": accessKey }, cache: "no-store" })
      .then(async (response) => ({ ok: response.ok, data: await response.json() }))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "Não foi possível abrir os dados privados.");
        const imported = (data.records as Array<{ externalId: string; displayName: string; eventTitle: string; eventDate?: string; eventTime?: string; total?: string; stage: LeadStage; clientEmail?: string; clientPhone?: string; service?: string; venue?: string; paymentMethod?: string; installments?: string }>).map((record, index) => ({
          id: record.externalId, name: record.displayName,
          initials: record.displayName.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "CL",
          source: "Gerador" as const, stage: record.stage, event: record.eventTitle,
          date: record.eventDate ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(`${record.eventDate}T12:00:00`)) : "Data a confirmar",
          value: record.total ? `R$ ${Number(record.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Valor a confirmar",
          next: "Revisar ficha do cliente", tone: ["rose", "teal", "violet", "gold", "blue"][index % 5], email: record.clientEmail, phone: record.clientPhone,
          service: record.service, venue: record.venue, paymentMethod: record.paymentMethod, installments: record.installments,
        }));
        if (imported.length) { setLeads(imported); setSelectedId(""); }
        setNotice(`${imported.length} registros privados carregados do staging.`);
      })
      .catch((error: Error) => setNotice(error.message));
  }, [accessKey]);

  useEffect(() => {
    if (!originalData.requests.length) return;
    const sourceLeads = originalData.requests.map((request, index) => {
      const contractor = (request.dadosContratante ?? {}) as Record<string, unknown>;
      const eventData = (request.dadosEvento ?? {}) as Record<string, unknown>;
      const commercial = (request.dadosComerciais ?? {}) as Record<string, unknown>;
      const name = String(contractor.nome || "Cliente sem nome");
      const rawValue = Number(commercial.valorTotal || 0);
      return {
        id: String(request.id), name,
        initials: name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "CL",
        source: String(request.origem || "").includes("site") ? "Formulário" as const : String(request.origem || "").includes("Proposta") ? "Proposta" as const : "Gerador" as const,
        stage: (request.status === "Proposta enviada" ? "Proposta enviada" : request.status === "Pendente" ? "Novo lead" : "Aceita") as LeadStage,
        event: String(request.tipoEvento || "Evento a confirmar"),
        date: String(eventData.data || "Data a confirmar"),
        value: rawValue ? `R$ ${rawValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Valor a confirmar",
        next: request.status === "Proposta enviada" ? "Aguardar resposta do link" : request.status === "Pendente" ? "Revisar solicitação" : "Abrir cadastro",
        tone: ["rose", "teal", "violet", "gold", "blue"][index % 5],
        email: String(contractor.email || ""), phone: String(contractor.whatsapp || ""),
        service: String(commercial.servico || ""), venue: String(eventData.local || eventData.localFesta || ""),
      } satisfies Lead;
    });
    setLeads(sourceLeads);
    setSelectedId("");
  }, [originalData.requests]);

  function advanceLead() {
    if (!selected) return;
    const position = leadStages.indexOf(selected.stage);
    const nextStage = leadStages[Math.min(position + 1, leadStages.length - 1)];
    void moveLead(selected.id, nextStage);
  }
  async function moveLead(id: string, stage: LeadStage) {
    const lead = leads.find((item) => item.id === id);
    setLeads((all) => all.map((lead) => lead.id === id ? { ...lead, stage, next: `Movido manualmente para ${stage}` } : lead));
    setSelectedId("");
    if (originalData.requests.some((request) => String(request.id) === id)) {
      await originalData.patchDocument("solicitacoes", id, { status: stage, atualizadoEm: new Date().toISOString() });
    }
    setNotice(`${lead?.name || "Lead"} foi salvo em “${stage}”. O cartão foi fechado e continua disponível no funil.`);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">m</span><span>studio<br /><strong>melk</strong></span></div>
        <nav aria-label="Navegação principal">
          {navigation.map(([Icon, label]) => <button key={label} className={activeView === label ? "nav-item selected" : "nav-item"} onClick={() => setActiveView(label)}>
            <Icon size={18} /><span>{label}</span>{label === "Leads" && <em>5</em>}
          </button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="safe-note"><ShieldCheck size={16} /><span>Studio Melk integrado<br /><small>versão principal</small></span></div>
          <button className="profile"><span className="avatar rose">MM</span><span>Márcio Melk<small>Administrador</small></span><ChevronRight size={16} /></button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p className="date">Sábado, 9 de agosto</p><h1>{activeView === "Visão geral" ? "Bom dia, Márcio." : activeView}</h1></div>
          <div className="actions"><button className="icon-button" aria-label="Buscar"><Search size={19} /></button><button className="outline-button" onClick={() => setNotice("Em breve: formulário de captura com link próprio e botão do WhatsApp.")}><MessageCircle size={17} /> Captar lead</button><button className="primary-button" onClick={() => setNotice("Novo lead adicionado ao fluxo de demonstração.")}><Plus size={18} /> Novo lead</button></div>
        </header>

        <div className="notice" role="status"><Sparkles size={16} /> <span>{notice}</span></div>

        {(activeView === "Visão geral" || activeView === "Leads") ? <>
        <section className="metrics" aria-label="Resumo comercial">
          <article><span>Pipeline em aberto</span><strong>R$ 27.850</strong><small><b>+18%</b> em relação ao mês anterior</small></article>
          <article><span>Leads ativos</span><strong>5</strong><small>2 aguardam seu retorno</small></article>
          <article><span>Propostas enviadas</span><strong>3</strong><small>R$ 21.400 em potencial</small></article>
          <article className="forecast"><span>Próximos 30 dias</span><strong>2 eventos</strong><small><CalendarDays size={14} /> Agenda sob controle</small></article>
        </section>

        <section className="content-grid">
          <div className="pipeline-panel">
            <div className="section-heading"><div><h2>Pipeline comercial</h2><p>Do primeiro contato ao evento confirmado.</p></div><button className="text-button" onClick={() => setActiveView("Leads")}>Ver todos <ArrowUpRight size={15} /></button></div>
            <div className="pipeline" aria-label="Funil de leads">
              {activeStages.map((stage) => {
                const stageLeads = leads.filter((lead) => lead.stage === stage);
                return <div className="stage" key={stage} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const id = event.dataTransfer.getData("text/plain"); if (id) moveLead(id, stage); }}><div className="stage-title"><span>{stage}</span><b>{stageLeads.length}</b></div>
                  {stageLeads.length ? stageLeads.map((lead) => <button key={lead.id} draggable className="lead-card" onDragStart={(event) => event.dataTransfer.setData("text/plain", lead.id)} onClick={() => setSelectedId(lead.id)}>
                    <span className={`avatar ${lead.tone}`}>{lead.initials}</span><span><strong>{lead.name}</strong><small>{lead.event}</small><i>{lead.value}</i></span>
                  </button>) : <div className="empty-stage">Sem leads nesta etapa</div>}
                </div>;
              })}
            </div>
          </div>

          {selected ? <aside className="detail-panel" aria-label="Detalhe do lead selecionado">
            <div className="detail-top"><span className={`avatar large ${selected.tone}`}>{selected.initials}</span><button className="icon-button small" aria-label="Mais opções">•••</button></div>
            <h2>{selected.name}</h2><p className="lead-id">{selected.id} · chegou por {selected.source}</p>
            <div className="stage-status"><span>Etapa atual</span><strong>{selected.stage}</strong></div>
            <dl><div><dt>Evento</dt><dd>{selected.event}</dd></div><div><dt>Data prevista</dt><dd>{selected.date}</dd></div><div><dt>Proposta</dt><dd>{selected.value}</dd></div><div><dt>Próxima ação</dt><dd>{selected.next}</dd></div></dl>
            <div className="timeline"><h3>Atividade recente</h3><p><span className="dot" />Lead criado a partir de {selected.source.toLowerCase()}<small>Hoje, 10:24</small></p><p><span className="dot muted" />Dados do evento organizados<small>Hoje, 10:25</small></p></div>
            <div className="detail-actions"><button className="outline-button" disabled={leadStages.indexOf(selected.stage) === 0} onClick={() => moveLead(selected.id, leadStages[Math.max(0, leadStages.indexOf(selected.stage) - 1)])}>Retroceder</button><button className="primary-button" onClick={advanceLead}>Avançar no funil <ChevronRight size={17} /></button></div>
          </aside> : <aside className="detail-panel detail-empty" aria-label="Nenhum lead selecionado"><UsersRound size={28} /><h2>Selecione um lead</h2><p>Clique em um cartão do funil para abrir os detalhes. Ao mudar a etapa, ele será salvo e esta área ficará limpa novamente.</p></aside>}
        </section>

        <section className="leads-table-section">
          <div className="section-heading"><div><h2>Leads recentes</h2><p>Base de trabalho da equipe comercial.</p></div><label className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar lead, evento ou origem" /></label></div>
          <div className="table-wrap"><table><thead><tr><th>Lead</th><th>Origem</th><th>Etapa</th><th>Evento</th><th>Próxima ação</th></tr></thead><tbody>
            {filtered.map((lead) => <tr key={lead.id} onClick={() => setSelectedId(lead.id)} className={selected?.id === lead.id ? "row-selected" : ""}><td><span className={`avatar table-avatar ${lead.tone}`}>{lead.initials}</span><strong>{lead.name}</strong></td><td>{lead.source}</td><td><span className="stage-pill">{lead.stage}</span></td><td>{lead.date}</td><td>{lead.next}<ChevronRight size={15} /></td></tr>)}
          </tbody></table></div>
        </section>
        </> : activeView === "Importação" ? <ImportWorkspace setNotice={setNotice} onUnlock={setAccessKey} originalData={originalData} /> : <OperationsWorkspace view={activeView} setNotice={setNotice} leads={leads} originalData={originalData} />}
      </section>
    </main>
  );
}

type OperationsWorkspaceProps = { view: string; setNotice: (message: string) => void; leads: Lead[]; originalData: OriginalStudioData };

function ImportWorkspace({ setNotice, onUnlock, originalData }: { setNotice: (message: string) => void; onUnlock: (password: string) => void; originalData: OriginalStudioData }) {
  const [pairCode, setPairCode] = useState("Melk21");
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(true);
  const [googleEmail, setGoogleEmail] = useState("");
  useEffect(() => {
    const savedCode = localStorage.getItem("studio-melk-flow-pair-code") || "Melk21";
    const savedEnabled = localStorage.getItem("studio-melk-flow-connected") !== "false";
    setPairCode(savedCode); setConnected(savedEnabled);
    setGoogleEmail(localStorage.getItem("studio-melk-google-calendar-email") || "");
    if (savedEnabled) void connectFlow(savedCode, false);
  }, []);
  async function connectFlow(code = pairCode, announce = true) {
    setConnecting(true);
    try {
      const response = await fetch("/api/integrations/gerador", { headers: { "x-studio-pair-code": code }, cache: "no-store" });
      const data = await response.json() as { connected?: boolean; error?: string };
      if (!response.ok || !data.connected) throw new Error(data.error || "Não foi possível conectar.");
      setConnected(true);
      localStorage.setItem("studio-melk-flow-pair-code", code);
      localStorage.setItem("studio-melk-flow-connected", "true");
      if (announce) setNotice("Conexão permanente ativada. Ela continuará funcionando após atualizações.");
    } catch (error) {
      setConnected(false);
      if (announce) setNotice(error instanceof Error ? error.message : "Não foi possível validar o código de conexão.");
    } finally { setConnecting(false); }
  }
  async function saveConnection() {
    setConnecting(true);
    try {
      const currentCode = localStorage.getItem("studio-melk-flow-pair-code") || "Melk21";
      const response = await fetch("/api/integrations/gerador", { method: "PUT", headers: { "content-type": "application/json", "x-studio-pair-code": currentCode }, body: JSON.stringify({ pairCode, enabled: true }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar a conexão.");
      localStorage.setItem("studio-melk-flow-pair-code", pairCode); localStorage.setItem("studio-melk-flow-connected", "true"); setConnected(true);
      setNotice("Código salvo e integração permanente ativada.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível salvar a conexão."); }
    finally { setConnecting(false); }
  }
  async function disconnectFlow() {
    setConnecting(true);
    try {
      await fetch("/api/integrations/gerador", { method: "PUT", headers: { "content-type": "application/json", "x-studio-pair-code": pairCode }, body: JSON.stringify({ pairCode, enabled: false }) });
      localStorage.setItem("studio-melk-flow-connected", "false"); setConnected(false); setNotice("Integração desconectada. Nenhum dado foi apagado.");
    } finally { setConnecting(false); }
  }
  return <section className="import-layout">
    <div className="section-heading"><div><h2>Integrações</h2><p>Conecte uma vez e mantenha o fluxo ativo até decidir desconectar.</p></div><span className="stage-pill">{connected ? "Ativa" : "Desconectada"}</span></div>
    <div className="import-next integration-card"><ShieldCheck size={22} /><div><h3>Studio Melk Flow</h3><p>Propostas e contratos entram automaticamente; contratos também criam cliente, financeiro e agenda.</p><label className="pair-code-field">Código da conexão<input value={pairCode} onChange={(event) => setPairCode(event.target.value)} autoCapitalize="none" /></label></div><div className="integration-actions"><button className="primary-button" type="button" disabled={connecting || pairCode.trim().length < 6} onClick={() => void saveConnection()}>{connecting ? "Salvando…" : connected ? "Salvar alteração" : "Conectar"}</button>{connected && <button className="outline-button" type="button" disabled={connecting} onClick={() => void disconnectFlow()}>Desconectar</button>}</div></div>
    <div className="import-next"><CalendarDays size={22} /><div><h3>Google Agenda</h3><p>Este e-mail será usado como referência nos atalhos de agenda e localização.</p><label className="pair-code-field">E-mail da agenda<input type="email" value={googleEmail} placeholder="seuemail@gmail.com" onChange={(event) => setGoogleEmail(event.target.value)} /></label></div><button className="primary-button" type="button" onClick={() => { localStorage.setItem("studio-melk-google-calendar-email", googleEmail); setNotice("E-mail do Google Agenda salvo neste dispositivo."); }}>Salvar</button></div>
  </section>;
}

type TeamAssignment = { role: string; person: string; assignment?: string; workStart?: string; specialDuty?: string };
type EventRecord = { id: string; clientId?: string; integrationId?: string; title: string; date: string; rawDate?: string; time: string; place: string; mapUrl?: string; status: string; client: string; email: string; phone: string; project: string; value: string; team: TeamAssignment[]; teamNotes?: string; reminders?: string; contract: "Link do CRM" | "PDF anexado" | "Pendente"; contractUrl?: string; contractFileName?: string; contractSigned?: boolean; contractSignedAt?: string; paid: string; remaining: string };
const events: EventRecord[] = [
  { id: "E-102", title: "Casamento · evento confirmado", date: "Sáb, 22 ago", time: "16:15", place: "Campinas, SP", status: "Confirmado", client: "Casal do projeto", email: "cliente@exemplo.com", phone: "(19) 99999-0000", project: "Foto e vídeo · dia completo", value: "R$ 8.400", team: [{role:"Fotografia",person:"A definir"},{role:"Vídeo",person:"A definir"}], contract:"Link do CRM", paid:"R$ 2.520", remaining:"R$ 5.880" },
  { id: "E-103", title: "Casamento · aguardando equipe", date: "Sáb, 12 set", time: "15:30", place: "Local confirmado", status: "Atenção", client: "Cliente do projeto", email: "cliente@exemplo.com", phone: "(11) 99999-0000", project: "Cobertura de cerimônia e recepção", value: "R$ 10.800", team: [{role:"Fotografia",person:"A definir"},{role:"Vídeo",person:"A definir"},{role:"Edição",person:"A definir"}], contract:"PDF anexado", paid:"R$ 3.240", remaining:"R$ 7.560" },
  { id: "E-104", title: "Ensaio · proposta aceita", date: "Sex, 03 out", time: "09:00", place: "Local a combinar", status: "Pendente", client: "Cliente do projeto", email: "cliente@exemplo.com", phone: "(19) 99999-0000", project: "Ensaio fotográfico", value: "R$ 1.850", team: [{role:"Fotografia",person:"A definir"}], contract:"Pendente", paid:"—", remaining:"R$ 1.850" },
];

const recoveredEventRecords: EventRecord[] = recoveredEvents.map((event) => {
  const client = event.title.includes(" - ") ? event.title.split(" - ").slice(1).join(" - ") : event.title;
  return {
    id: event.id,
    title: event.title,
    date: new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(new Date(`${event.date}T12:00:00`)),
    time: event.time === "00:00" ? "Horário a confirmar" : event.time,
    place: event.place,
    status: "Confirmado",
    client,
    email: "E-mail não informado",
    phone: "Telefone não informado",
    project: "Projeto recuperado do aplicativo original",
    value: "Valor não informado",
    team: event.team.length ? event.team.map((assignment) => ({ role: assignment.role === "Foto" ? "Fotografia" : "Vídeo", person: assignment.name })) : [{ role: "Equipe", person: "A definir" }],
    contract: "Pendente",
    paid: "Não informado",
    remaining: "Não informado",
  };
});

function normalizedEventDate(value?: string) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const brazilian = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brazilian) return `${brazilian[3]}-${brazilian[2].padStart(2, "0")}-${brazilian[1].padStart(2, "0")}`;
  return "";
}

function agendaMonthLabel(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}

function googleCalendarUrl(event: EventRecord) {
  const rawDate = normalizedEventDate(event.rawDate);
  const time = /^\d{2}:\d{2}$/.test(event.time) ? event.time : "09:00";
  const start = rawDate ? new Date(`${rawDate}T${time}:00`) : new Date();
  const end = new Date(start.getTime() + 8 * 60 * 60 * 1000);
  const stamp = (value: Date) => `${value.getFullYear()}${String(value.getMonth() + 1).padStart(2, "0")}${String(value.getDate()).padStart(2, "0")}T${String(value.getHours()).padStart(2, "0")}${String(value.getMinutes()).padStart(2, "0")}00`;
  const maps = event.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.place)}`;
  const params = new URLSearchParams({ action: "TEMPLATE", text: event.title, dates: `${stamp(start)}/${stamp(end)}`, location: event.place, details: `${event.project}\nCliente: ${event.client}\nMapa: ${maps}\n\nCriado pelo Flow CRM` });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function OperationsWorkspace({ view, setNotice, leads, originalData }: OperationsWorkspaceProps) {
  const importedRecords: EventRecord[] = leads.filter((lead) => lead.source === "Gerador").map((lead) => ({
    id: `project-${lead.id}`, title: lead.event, date: lead.date, time: "Horário a confirmar", place: lead.venue || "Local a confirmar", status: lead.stage === "Aceita" ? "Confirmado" : "Pendente",
    client: lead.name, email: lead.email || "E-mail não informado", phone: lead.phone || "Telefone não informado", project: lead.service || "Serviço a confirmar", value: lead.value,
    team: [{ role: "Fotografia", person: "A definir" }, { role: "Vídeo", person: "A definir" }], contract: "Pendente", paid: "—", remaining: lead.value,
  }));
  const originalRecords: EventRecord[] = originalData.events.filter((event) => event.status !== "Lixeira").sort((left, right) => String(left.date || "").localeCompare(String(right.date || ""))).map((event) => {
    const client = originalData.clients.find((item) => item.id === event.clientId);
    const order = originalData.orders.find((item) => item.clientId === event.clientId);
    const payments = Array.isArray(client?.pagamentos) ? client.pagamentos as Array<Record<string, unknown>> : [];
    const paidValue = payments.filter((payment) => payment.status === "Pago").reduce((total, payment) => total + Number(payment.valor || 0), 0);
    const totalValue = Number(order?.valorTotal || 0);
    const team = Array.isArray(event.team) ? event.team as Array<Record<string, unknown>> : [];
    return {
      id: String(event.id), clientId: client ? String(client.id) : undefined, integrationId: String(event.integrationId || ""), title: String(event.title || "Evento sem título"),
      date: event.date ? new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(new Date(`${event.date}T12:00:00`)) : "Data a confirmar", rawDate: String(event.date || ""),
      time: String(event.time || "Horário a confirmar"),
      place: String(event.locCerimonia || event.locFesta || "Local a confirmar"), mapUrl: String(event.mapUrl || ""),
      status: String(event.status || "Pendente"), client: String(client?.nome || event.title || "Cliente não informado"),
      email: String(client?.email || "E-mail não informado"), phone: String(client?.whatsapp || "Telefone não informado"),
      project: String(order?.servicos || event.services || "Projeto não informado"),
      value: totalValue ? `R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Valor não informado",
      team: team.length ? team.map((member) => ({ role: String(member.role || "Equipe"), person: String(member.name || "A definir"), assignment: String(member.assignment || "Geral"), workStart: String(member.workStart || ""), specialDuty: String(member.specialDuty || "") })) : [{ role: "Equipe", person: "A definir", assignment: "Geral" }], teamNotes: String(event.teamNotes || ""), reminders: String(event.reminders || ""),
      contract: event.contractUrl ? "PDF anexado" : order ? "Link do CRM" : "Pendente", contractUrl: String(event.contractUrl || ""), contractFileName: String(event.contractFileName || ""), contractSigned: Boolean(event.contractSigned), contractSignedAt: String(event.contractSignedAt || ""),
      paid: paidValue ? `R$ ${paidValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Não informado",
      remaining: totalValue ? `R$ ${Math.max(0, totalValue - paidValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Não informado",
    };
  });
  const baseRecords: EventRecord[] = originalRecords.length ? originalRecords : [...recoveredEventRecords, ...importedRecords];
  const [openEventId, setOpenEventId] = useState(baseRecords[0]?.id ?? events[0].id);
  const [featuredEvents, setFeaturedEvents] = useState<string[]>([]);
  const [editing, setEditing] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", place: "", notes: "" });
  const [eventEdits, setEventEdits] = useState<Record<string, Partial<EventRecord>>>({});
  const [teamEdits, setTeamEdits] = useState<Record<string, { name: string; role: string; specialSkills: string }>>({});
  const [editingMemberId, setEditingMemberId] = useState("");
  const [openMemberId, setOpenMemberId] = useState("");
  const [newTeamMember, setNewTeamMember] = useState({ name: "", role: "" });
  const [paymentValues, setPaymentValues] = useState<Record<string, string>>({});
  const [selectedClientId, setSelectedClientId] = useState("");
  const [contractQuery, setContractQuery] = useState("");
  const [agendaYear, setAgendaYear] = useState("todos");
  const records = baseRecords.map((event) => ({ ...event, ...eventEdits[event.id] }));
  const openEvent = records.find((event) => event.id === openEventId) ?? records[0];
  const datedAgendaRecords = records.map((event) => ({ ...event, agendaDate: normalizedEventDate(event.rawDate) })).sort((left, right) => (left.agendaDate || "9999-12-31").localeCompare(right.agendaDate || "9999-12-31"));
  const agendaYears = [...new Set(datedAgendaRecords.map((event) => event.agendaDate.slice(0, 4)).filter(Boolean))].sort();
  const visibleAgendaRecords = datedAgendaRecords.filter((event) => agendaYear === "todos" || event.agendaDate.startsWith(agendaYear));
  const agendaGroups = visibleAgendaRecords.reduce<Array<{ key: string; label: string; events: typeof visibleAgendaRecords }>>((groups, event) => {
    const key = event.agendaDate ? event.agendaDate.slice(0, 7) : "sem-data";
    const group = groups.find((item) => item.key === key);
    if (group) group.events.push(event);
    else groups.push({ key, label: event.agendaDate ? agendaMonthLabel(event.agendaDate) : "Sem data definida", events: [event] });
    return groups;
  }, []);
  const updateOpenEvent = <K extends keyof EventRecord>(field: K, value: EventRecord[K]) => {
    if (!openEvent) return;
    setEventEdits((all) => ({ ...all, [openEvent.id]: { ...all[openEvent.id], [field]: value } }));
  };
  const shareEvent = async (event: EventRecord) => {
    const mapsUrl = event.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.place)}`;
    const text = `${event.title}\n${event.date} · ${event.time}\nLocal: ${event.place}\nMapa: ${mapsUrl}\nEquipe e atribuições:\n${event.team.map((member) => `• ${member.person} — ${member.role}${member.workStart ? ` · começa: ${member.workStart}` : ""}${member.specialDuty ? ` · especial: ${member.specialDuty}` : member.assignment ? ` · ${member.assignment}` : ""}`).join("\n")}${event.teamNotes ? `\n\nInstruções adicionais:\n${event.teamNotes}` : ""}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text });
        setNotice("Resumo do projeto compartilhado com a equipe.");
        return;
      }
      await navigator.clipboard.writeText(text);
      setNotice("Resumo do projeto copiado para enviar à equipe.");
    } catch {
      setNotice("Compartilhamento cancelado. A ficha continua aberta para você.");
    }
  };
  const saveOpenEvent = async () => {
    await originalData.patchDocument("events", openEvent.id, {
      title: openEvent.title, date: openEvent.rawDate || "", time: openEvent.time,
      locCerimonia: openEvent.place, mapUrl: openEvent.mapUrl || "", services: openEvent.project,
      team: openEvent.team.map((member) => ({ name: member.person, role: member.role, assignment: member.assignment || "Geral", workStart: member.workStart || "", specialDuty: member.specialDuty || "" })),
      teamNotes: openEvent.teamNotes || "", reminders: openEvent.reminders || "", status: openEvent.status || "Confirmado",
    });
    if (openEvent.clientId) {
      await originalData.patchDocument("clientes", openEvent.clientId, {
        nome: openEvent.client, email: openEvent.email, whatsapp: openEvent.phone,
      });
    }
    setEventEdits((all) => { const next = { ...all }; delete next[openEvent.id]; return next; });
    setNotice(`${openEvent.title} e os dados do cliente foram atualizados no banco principal.`);
  };
  const createNewEvent = async () => {
    if (!newEvent.title || !newEvent.date) return setNotice("Informe ao menos o nome e a data do evento.");
    const id = await originalData.createDocument("events", {
      title: newEvent.title, date: newEvent.date, time: newEvent.time, locCerimonia: newEvent.place,
      locFesta: "", team: [], teamNotes: newEvent.notes, roteiro: "", services: "", status: "Confirmado",
      createdAt: new Date().toISOString(),
    });
    setNewEvent({ title: "", date: "", time: "", place: "", notes: "" });
    setCreating(false); setOpenEventId(id); setNotice("Novo evento salvo no banco principal.");
  };
  const moveToTrash = async (event: EventRecord) => {
    if (!window.confirm(`Enviar “${event.title}” para a lixeira? Você poderá recuperar a ficha depois.`)) return;
    await originalData.patchDocument("events", event.id, { status: "Lixeira" });
    if (event.integrationId) {
      const request = originalData.requests.find((item) => String(item.externalId || "") === event.integrationId || String(item.id) === `gerador-${event.integrationId}`);
      if (request) await originalData.patchDocument("solicitacoes", String(request.id), { status: "Lixeira" });
    }
    setNotice(`${event.title} foi enviado para a lixeira e pode ser recuperado.`);
  };
  const flowRequests = originalData.requests.filter((request) => String(request.origem || "").includes("Studio Melk Flow"));
  const moveFlowRequestToTrash = async (request: Record<string, unknown>) => {
    const id = String(request.id || "");
    const externalId = String(request.externalId || id.replace(/^gerador-/, ""));
    const type = String(request.tipoRecebido || "proposal");
    const label = type === "contract" ? "contrato" : "proposta";
    if (!window.confirm(`Enviar este ${label} para a lixeira? Você poderá recuperá-lo depois.`)) return;
    await originalData.patchDocument("solicitacoes", id, { status: "Lixeira" });
    if (type === "contract") {
      const event = originalData.events.find((item) => String(item.integrationId || "") === externalId || String(item.id) === `gerador-event-${externalId}`);
      const order = originalData.orders.find((item) => String(item.integrationId || "") === externalId || String(item.id) === `gerador-order-${externalId}`);
      if (event) await originalData.patchDocument("events", String(event.id), { status: "Lixeira" });
      if (order) await originalData.patchDocument("pedidos", String(order.id), { status: "Lixeira" });
    }
    setNotice(`O ${label} foi enviado para a lixeira. Nenhum dado foi apagado definitivamente.`);
  };
  const restoreFlowRequest = async (request: Record<string, unknown>) => {
    const id = String(request.id || "");
    const externalId = String(request.externalId || id.replace(/^gerador-/, ""));
    const type = String(request.tipoRecebido || "proposal");
    await originalData.patchDocument("solicitacoes", id, { status: type === "contract" ? "Contratado" : "Pendente" });
    if (type === "contract") {
      const event = originalData.events.find((item) => String(item.integrationId || "") === externalId || String(item.id) === `gerador-event-${externalId}`);
      const order = originalData.orders.find((item) => String(item.integrationId || "") === externalId || String(item.id) === `gerador-order-${externalId}`);
      if (event) await originalData.patchDocument("events", String(event.id), { status: "Confirmado" });
      if (order) await originalData.patchDocument("pedidos", String(order.id), { status: "Aberto" });
    }
    setNotice("Registro recuperado da lixeira.");
  };
  const financialItems: Array<Record<string, unknown> & { clientId: string; clientName: string }> = originalData.clients.flatMap((client) => (Array.isArray(client.pagamentos) ? client.pagamentos as Array<Record<string, unknown>> : []).map((payment) => ({ ...payment, clientId: String(client.id), clientName: String(client.nome || "Cliente") })));
  const paidTotal = financialItems.filter((payment) => payment.status === "Pago").reduce((total, payment) => total + Number(payment.valor || 0), 0);
  const pendingItems = financialItems.filter((payment) => payment.status !== "Pago");
  const pendingTotal = pendingItems.reduce((total, payment) => total + Number(payment.valor || 0), 0);
  const selectedClient = originalData.clients.find((client) => String(client.id) === selectedClientId) ?? originalData.clients[0];
  const savePayment = async (item: Record<string, unknown> & { clientId: string; clientName: string }, status: "Pago" | "Pendente") => {
    const client = originalData.clients.find((record) => String(record.id) === item.clientId);
    if (!client) return;
    const payments = Array.isArray(client.pagamentos) ? client.pagamentos as Array<Record<string, unknown>> : [];
    const actualValue = Number(paymentValues[String(item.id)] ?? item.valor ?? 0);
    const originalValue = Number(item.valor || 0);
    const difference = actualValue - originalValue;
    const next: Array<Record<string, unknown>> = payments.map((payment) => String(payment.id) === String(item.id) ? { ...payment, valor: actualValue, status, dataPagamento: status === "Pago" ? new Date().toISOString() : "", reciboId: status === "Pago" ? `RC-${Date.now()}` : "", reciboGeradoEm: status === "Pago" ? new Date().toISOString() : "" } : { ...payment });
    if (difference !== 0) {
      const lastPendingIndex = next.map((payment, index) => ({ payment, index })).filter(({ payment }) => String(payment.id) !== String(item.id) && payment.status !== "Pago").at(-1)?.index;
      if (lastPendingIndex !== undefined) next[lastPendingIndex] = { ...next[lastPendingIndex], valor: Math.max(0, Number(next[lastPendingIndex].valor || 0) - difference) };
    }
    await originalData.patchDocument("clientes", item.clientId, { pagamentos: next });
    setNotice(status === "Pago" ? `Pagamento registrado. ${difference ? "A última parcela pendente foi ajustada automaticamente." : ""}` : "Baixa estornada; a parcela voltou a ficar pendente.");
  };
  const shareReceipt = async (item: Record<string, unknown> & { clientId: string; clientName: string }) => {
    const receipt = `RECIBO\nCliente: ${item.clientName}\nParcela: ${String(item.parcela || "—")}\nValor recebido: R$ ${Number(item.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\nData: ${item.dataPagamento ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(String(item.dataPagamento))) : "A confirmar"}\nStudio Melk`;
    try { if (navigator.share) await navigator.share({ title: "Recibo Studio Melk", text: receipt }); else await navigator.clipboard.writeText(receipt); setNotice("Recibo preparado para envio. Para enviar como PDF por e-mail, falta configurar o serviço de e-mail."); } catch { setNotice("Envio do recibo cancelado."); }
  };
  if (view === "Lixeira") {
    const trashedEvents = originalData.events.filter((event) => event.status === "Lixeira");
    const trashedFlowRecords = flowRequests.filter((request) => request.status === "Lixeira");
    const totalTrash = trashedEvents.length + trashedFlowRecords.length;
    return <section className="orders-layout"><div className="section-heading"><div><h2>Lixeira</h2><p>Eventos, propostas e contratos removidos podem ser recuperados sem perder os dados.</p></div><span className="stage-pill">{totalTrash} itens</span></div><div className="trash-list">{trashedFlowRecords.map((request) => <article className="trash-row" key={String(request.id)}><div><strong>{String(request.tipoRecebido) === "contract" ? "Contrato recebido do Flow" : "Proposta recebida do Flow"}</strong><span>{String((request.dadosContratante as Record<string, unknown> | undefined)?.nome || "Cliente")} · {String(request.tipoEvento || "Evento")}</span></div><button className="outline-button" disabled={originalData.saving} onClick={() => void restoreFlowRequest(request as Record<string, unknown>)}><RotateCcw size={15} /> Recuperar</button></article>)}{trashedEvents.map((event) => <article className="trash-row" key={String(event.id)}><div><strong>{String(event.title || "Evento sem título")}</strong><span>{String(event.date || "Data não informada")} · {String(event.time || "Horário não informado")}</span></div><button className="outline-button" disabled={originalData.saving} onClick={async () => { await originalData.patchDocument("events", String(event.id), { status: "Confirmado" }); setNotice(`${String(event.title)} foi recuperado.`); }}><RotateCcw size={15} /> Recuperar</button></article>)}{!totalTrash && <div className="availability-note"><CheckCircle2 size={18} /><span>A lixeira está vazia.</span></div>}</div></section>;
  }
  if (view === "Agenda") return <section className="operations-grid">
    <div className="operations-main"><div className="section-heading"><div><h2>Agenda de produção</h2><p>Abra uma ficha para editar cada detalhe.</p></div><button className="primary-button" onClick={() => setCreating((value) => !value)}><Plus size={17} /> Novo evento</button></div>{creating && <form className="new-event-form" onSubmit={(event) => { event.preventDefault(); void createNewEvent(); }}><label>Evento<input value={newEvent.title} onChange={(event) => setNewEvent((current) => ({ ...current, title: event.target.value }))} /></label><label>Data<input type="date" value={newEvent.date} onChange={(event) => setNewEvent((current) => ({ ...current, date: event.target.value }))} /></label><label>Horário<input type="time" value={newEvent.time} onChange={(event) => setNewEvent((current) => ({ ...current, time: event.target.value }))} /></label><label>Local<input value={newEvent.place} onChange={(event) => setNewEvent((current) => ({ ...current, place: event.target.value }))} /></label><label className="form-wide">Instruções iniciais<textarea value={newEvent.notes} onChange={(event) => setNewEvent((current) => ({ ...current, notes: event.target.value }))} /></label><div className="new-event-actions"><button type="button" className="outline-button" onClick={() => setCreating(false)}>Cancelar</button><button type="submit" className="primary-button" disabled={originalData.saving}><Save size={16} /> Salvar evento</button></div></form>}
      <div className="agenda-year-bar"><label htmlFor="agenda-year">Buscar ano</label><select id="agenda-year" value={agendaYear} onChange={(event) => setAgendaYear(event.target.value)}><option value="todos">Todos os anos</option>{agendaYears.map((year) => <option value={year} key={year}>{year}</option>)}</select>{agendaYears.map((year) => <button className={agendaYear === year ? "year-chip active" : "year-chip"} type="button" key={year} onClick={() => setAgendaYear(year)}>{year}</button>)}</div>
      <div className="agenda-list">{agendaGroups.length ? agendaGroups.map((group) => <section className="agenda-month-group" key={group.key}><h3>{group.label}</h3>{group.events.map((event) => <article className={`event-card ${openEventId === event.id ? "is-open" : ""} ${featuredEvents.includes(event.id) ? "is-featured" : ""}`} key={event.id} onClick={() => { setOpenEventId(event.id); setEditing(false); }} onDoubleClick={() => { setOpenEventId(event.id); setEditing(true); }} title="Clique para ver; clique duas vezes para editar"><div className="event-date"><strong>{event.agendaDate ? event.agendaDate.slice(8, 10) : "—"}</strong><span>{event.agendaDate ? new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(new Date(`${event.agendaDate}T12:00:00`)) : "Projeto"}</span></div><div className="event-copy"><div className="event-kicker"><span className={`status-dot ${event.status.toLowerCase()}`}>{event.status}</span>{featuredEvents.includes(event.id) && <span className="featured-label">Em destaque</span>}</div><h3>{event.title}</h3><p><Clock3 size={15} /> {event.time} <span /> <MapPin size={15} /> {event.place}</p><div className="assignment-row">{event.team.map(({role,person,assignment,workStart,specialDuty}) => <span key={`${role}-${person}`}><UserRoundCheck size={14} /><b>{role}</b> {person}{workStart ? ` · ${workStart}` : ""}{specialDuty ? ` · ${specialDuty}` : assignment && assignment !== "Geral" ? ` · ${assignment}` : ""}</span>)}</div></div><div className="event-actions"><button className="outline-button" aria-pressed={featuredEvents.includes(event.id)} onClick={(e) => { e.stopPropagation(); setFeaturedEvents((items) => items.includes(event.id) ? items.filter((id) => id !== event.id) : [...items, event.id]); }}>{featuredEvents.includes(event.id) ? "Remover destaque" : "Destacar"}</button><a className="outline-button" href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}><CalendarDays size={16} /> Google Agenda</a><button className="outline-button" onClick={(e) => { e.stopPropagation(); void shareEvent(event); }}><Share2 size={16} /> Compartilhar</button><button className="text-button" onClick={(e) => { e.stopPropagation(); setOpenEventId(event.id); setEditing(true); }}>Editar ficha <ChevronRight size={16} /></button></div></article>)}</section>) : <div className="availability-note"><CalendarDays size={18} /><span>Nenhum evento cadastrado neste ano.</span></div>}</div>
    </div><aside className="task-panel event-sheet"><div className="sheet-heading"><div><span>Ficha editável do projeto</span><h2>{openEvent.title}</h2></div><button className={`sheet-close ${editing ? "is-editing" : ""}`} onClick={() => setEditing(!editing)} aria-label="Alternar edição" aria-pressed={editing}><Pencil size={15} /></button></div><div className="sheet-summary"><span>{openEvent.status}</span><span>{openEvent.team.length} pessoas na equipe</span><span>{openEvent.contract}</span></div>{editing && <form className="edit-form" onSubmit={(event) => { event.preventDefault(); void saveOpenEvent(); }}><div className="edit-form-heading"><Pencil size={15} /><span>Dados do cliente, evento e equipe</span></div><label>Nome do projeto<input value={openEvent.title} onChange={(event) => updateOpenEvent("title", event.target.value)} /></label><label>Cliente ou casal<input value={openEvent.client} onChange={(event) => updateOpenEvent("client", event.target.value)} /></label><div className="form-pair"><label>E-mail<input type="email" value={openEvent.email} onChange={(event) => updateOpenEvent("email", event.target.value)} /></label><label>WhatsApp<input value={openEvent.phone} onChange={(event) => updateOpenEvent("phone", event.target.value)} /></label></div><div className="form-pair"><label>Data<input type="date" value={openEvent.rawDate || ""} onChange={(event) => updateOpenEvent("rawDate", event.target.value)} /></label><label>Horário<input value={openEvent.time} onChange={(event) => updateOpenEvent("time", event.target.value)} /></label></div><label>Local<input value={openEvent.place} onChange={(event) => updateOpenEvent("place", event.target.value)} /></label><label>Projeto contratado<input value={openEvent.project} onChange={(event) => updateOpenEvent("project", event.target.value)} /></label><div className="team-editor"><strong>Equipe e atribuições</strong>{openEvent.team.map((member, index) => <div className="team-edit-row complete" key={`${member.person}-${index}`}><input value={member.person} aria-label="Profissional" onChange={(event) => updateOpenEvent("team", openEvent.team.map((item, itemIndex) => itemIndex === index ? { ...item, person: event.target.value } : item))} placeholder="Profissional" /><input value={member.role} aria-label="Função" onChange={(event) => updateOpenEvent("team", openEvent.team.map((item, itemIndex) => itemIndex === index ? { ...item, role: event.target.value } : item))} placeholder="Função" /><input value={member.assignment || ""} aria-label="Atribuição" onChange={(event) => updateOpenEvent("team", openEvent.team.map((item, itemIndex) => itemIndex === index ? { ...item, assignment: event.target.value } : item))} placeholder="Ex.: Making of noiva" /><button type="button" className="icon-button small" aria-label="Remover profissional" onClick={() => updateOpenEvent("team", openEvent.team.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>)}<button type="button" className="outline-button" onClick={() => updateOpenEvent("team", [...openEvent.team, { person: "", role: "", assignment: "" }])}><Plus size={15} /> Adicionar profissional</button></div><label>Instruções adicionais<textarea value={openEvent.teamNotes || ""} onChange={(event) => updateOpenEvent("teamNotes", event.target.value)} placeholder="Horários, chegada, prioridades e observações" /></label><button className="save-preview-button" type="submit" disabled={originalData.saving}><Save size={16} /> Salvar ficha e cliente</button></form>}<div className="sheet-section"><strong>Contrato e pagamentos</strong><p><FileText size={16} /> Contrato: {openEvent.contract}{openEvent.contractSigned ? " · assinado" : ""}</p><div className="sheet-actions">{openEvent.contractUrl ? <a className="sheet-button contract-link" href={openEvent.contractUrl} target="_blank" rel="noreferrer"><FileText size={14} /> Abrir contrato</a> : <span className="contract-empty">Nenhum arquivo anexado</span>}<label className="sheet-button contract-upload"><Paperclip size={14} /> {originalData.saving ? "Enviando…" : "Anexar contrato"}<input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={originalData.saving} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { await originalData.uploadContract(file, openEvent.id); setNotice("Arquivo do contrato anexado ao evento."); } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível anexar o contrato."); } finally { event.currentTarget.value = ""; } }} /></label></div><a className="contract-status" href={googleCalendarUrl(openEvent)} target="_blank" rel="noreferrer"><CalendarDays size={16} /> Adicionar ao Google Agenda</a><button className={`contract-status ${openEvent.contractSigned ? "signed" : ""}`} disabled={originalData.saving} onClick={async () => { const signed = !openEvent.contractSigned; await originalData.patchDocument("events", openEvent.id, { contractSigned: signed, contractSignedAt: signed ? new Date().toISOString() : "" }); setNotice(signed ? "Contrato marcado como assinado." : "Contrato marcado como pendente."); }}>{openEvent.contractSigned ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}{openEvent.contractSigned ? "Contrato assinado" : "Marcar como assinado"}</button></div><button className="share-sheet" onClick={() => void shareEvent(openEvent)}><Share2 size={18} /> Compartilhar dados com equipe</button><button className="outline-button danger-button sheet-trash" disabled={originalData.saving} onClick={() => void moveToTrash(openEvent)}><Trash2 size={16} /> Enviar ficha para lixeira</button></aside>
  </section>;

  if (view === "Equipe") {
    const sourceMembers = originalData.teamMembers.length ? originalData.teamMembers : recoveredTeam.map((name, index) => ({ id: `recovered-${index}`, name }));
    const members = sourceMembers.map((member) => {
      const values = member as Record<string, unknown>;
      const name = String(values.name ?? values.nome ?? "Profissional");
      return { values, eventCount: records.filter((item) => item.team.some((assignment) => assignment.person === name)).length };
    }).sort((left, right) => right.eventCount - left.eventCount);
    const shareMemberAgenda = async (name: string, memberEvents: EventRecord[], detail: "dates" | "schedule" | "complete") => {
      const lines = memberEvents.map((item) => {
        const assignment = item.team.find((entry) => entry.person === name);
        if (detail === "dates") return `• ${item.date} — ${item.title}`;
        if (detail === "schedule") return `• ${item.date} · ${item.time} — ${item.title} — ${item.place}`;
        const map = item.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.place)}`;
        return `• ${item.date} · ${item.time} — ${item.title}\n  ${item.place}\n  ${map}${assignment?.workStart ? `\n  Começa: ${assignment.workStart}` : ""}${assignment?.specialDuty ? `\n  Especial: ${assignment.specialDuty}` : ""}`;
      });
      const text = `Agenda de ${name}\n\n${lines.join("\n\n")}`;
      try { if (navigator.share) await navigator.share({ title: `Agenda de ${name}`, text }); else await navigator.clipboard.writeText(text); setNotice(`Agenda de ${name} pronta para compartilhar.`); } catch { setNotice("Compartilhamento cancelado."); }
    };
    return <section className="team-layout">
      <div className="section-heading"><div><h2>Equipe e disponibilidade</h2><p>Profissionais ordenados por número de eventos fechados. Abra um cartão para ver e compartilhar a agenda.</p></div></div>
      <form className="new-event-form team-add-form" onSubmit={(event) => { event.preventDefault(); if (!newTeamMember.name) return; void originalData.createDocument("team_members", { name: newTeamMember.name, role: newTeamMember.role || "Foto", specialSkills: "", createdAt: new Date().toISOString() }).then(() => { setNewTeamMember({ name: "", role: "" }); setNotice("Profissional adicionado à equipe."); }); }}>
        <label>Nome do profissional<input value={newTeamMember.name} onChange={(event) => setNewTeamMember((item) => ({ ...item, name: event.target.value }))} /></label>
        <label>Função principal<select value={newTeamMember.role} onChange={(event) => setNewTeamMember((item) => ({ ...item, role: event.target.value }))}><option value="">Selecione</option><option>Foto</option><option>Vídeo</option><option>Foto e vídeo híbrido</option><option>Edição</option><option>Assistência</option></select></label>
        <div className="new-event-actions"><button className="primary-button" type="submit" disabled={originalData.saving}><Plus size={16} /> Adicionar pessoa</button></div>
      </form>
      <div className="team-grid">{members.map(({ values, eventCount }, index) => {
        const id = String(values.id);
        const savedName = String(values.name ?? values.nome ?? "Profissional");
        const name = String(teamEdits[id]?.name ?? savedName);
        const role = String(teamEdits[id]?.role ?? values.role ?? values.funcao ?? "Função a definir");
        const specialSkills = String(teamEdits[id]?.specialSkills ?? values.specialSkills ?? "");
        const memberEvents = records.filter((item) => item.team.some((assignment) => assignment.person === savedName)).sort((left, right) => String(left.rawDate || "9999").localeCompare(String(right.rawDate || "9999")));
        const isEditing = editingMemberId === id;
        const isOpen = openMemberId === id;
        return <article className={`member-card ${isOpen ? "is-open" : ""}`} key={id}>
          <button type="button" className="member-summary" onClick={() => setOpenMemberId(isOpen ? "" : id)}>
            <span className={`avatar large ${["rose","teal","violet","gold","blue"][index % 5]}`}>{name.slice(0,1)}</span>
            <span className="member-identity"><strong>{name}</strong><small>{role}</small></span>
            <span className="member-count"><b>{eventCount}</b><small>{eventCount === 1 ? "evento fechado" : "eventos fechados"}</small></span>
            <ChevronRight size={18} />
          </button>
          {isEditing ? <div className="member-edit-form">
            <label>Nome<input value={name} onChange={(event) => setTeamEdits((all) => ({ ...all, [id]: { name: event.target.value, role, specialSkills } }))} /></label>
            <label>Função principal<select value={role} onChange={(event) => setTeamEdits((all) => ({ ...all, [id]: { name, role: event.target.value, specialSkills } }))}><option>Foto</option><option>Vídeo</option><option>Foto e vídeo híbrido</option><option>Edição</option><option>Assistência</option></select></label>
            <label>Funções especiais<input value={specialSkills} placeholder="Same Day Edit, drone…" onChange={(event) => setTeamEdits((all) => ({ ...all, [id]: { name, role, specialSkills: event.target.value } }))} /></label>
            <div className="member-actions"><button className="outline-button" type="button" onClick={() => setEditingMemberId("")}>Cancelar</button>{!id.startsWith("recovered-") && <button className="primary-button" type="button" disabled={originalData.saving} onClick={() => void originalData.patchDocument("team_members", id, { name, role, specialSkills }).then(() => { setTeamEdits((all) => { const next = { ...all }; delete next[id]; return next; }); setEditingMemberId(""); setNotice(`${name} foi atualizado.`); })}><Save size={15} /> Salvar</button>}</div>
          </div> : <button className="outline-button member-edit-button" type="button" onClick={() => setEditingMemberId(id)}><Pencil size={15} /> Editar</button>}
          {isOpen && <div className="member-agenda"><div className="member-agenda-heading"><strong>Agenda completa</strong><span>{memberEvents.length} datas</span></div>{memberEvents.length ? memberEvents.map((item) => { const assignment = item.team.find((entry) => entry.person === savedName); return <button type="button" className="member-event" key={item.id} onClick={() => { setOpenEventId(item.id); setEditing(false); }}><time>{item.date}</time><span><strong>{item.title}</strong><small>{item.time} · {item.place}</small>{assignment && <em>{assignment.role}{assignment.workStart ? ` · ${assignment.workStart}` : ""}{assignment.specialDuty ? ` · ${assignment.specialDuty}` : ""}</em>}</span><ChevronRight size={16} /></button>; }) : <p>Nenhum evento atribuído.</p>}<div className="share-options"><button type="button" onClick={() => void shareMemberAgenda(savedName, memberEvents, "dates")}><Share2 size={14} /> Só datas</button><button type="button" onClick={() => void shareMemberAgenda(savedName, memberEvents, "schedule")}><Clock3 size={14} /> Horários e locais</button><button type="button" onClick={() => void shareMemberAgenda(savedName, memberEvents, "complete")}><MapPin size={14} /> Completa + Maps</button></div></div>}
        </article>;
      })}</div>
    </section>;
  }

  if (view === "Financeiro") return <section className="finance-layout"><div className="section-heading"><div><h2>Financeiro simples</h2><p>Valores calculados a partir dos pagamentos cadastrados no banco principal.</p></div><button className="primary-button" onClick={() => setNotice("A gravação de recebimentos será habilitada depois da cópia de segurança do banco principal.")}><Plus size={17} /> Registrar recebimento</button></div><div className="money-summary"><article><span>Já entrou</span><strong>R$ {paidTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong><small>Pagamentos marcados como pagos</small></article><article><span>Falta receber</span><strong>R$ {pendingTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong><small>{pendingItems.length} parcelas pendentes</small></article><article className="money-action"><WalletCards size={22} /><strong>Próximo passo</strong><p>{pendingItems.length ? "Revisar as parcelas pendentes com os clientes." : "Nenhuma parcela pendente cadastrada."}</p></article></div><div className="simple-ledger"><div className="section-heading"><div><h2>O que precisa da sua atenção</h2><p>Somente dados do banco principal.</p></div></div>{pendingItems.length ? pendingItems.slice(0, 8).map((item, index) => <div className="ledger-row" key={`${item.clientName}-${index}`}><ReceiptText size={19} /><div><strong>{item.clientName}</strong><span>{String(item.vencimento || "Vencimento não informado")}</span></div><b>R$ {Number(item.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</b><button className="outline-button" onClick={() => setNotice(`Parcela de ${item.clientName} aberta para conferência.`)}>Revisar</button></div>) : <div className="availability-note"><CheckCircle2 size={18} /><span>Nenhuma cobrança pendente cadastrada no banco principal.</span></div>}</div></section>;

  if (view === "Contratos") {
    const searchedContracts = records.filter((event) => (event.contractUrl || event.integrationId || event.contractSigned) && `${event.title} ${event.client} ${event.date} ${event.project}`.toLowerCase().includes(contractQuery.toLowerCase()));
    return <section className="orders-layout"><div className="section-heading"><div><h2>Contratos e fichas</h2><p>Somente clientes com contrato aparecem aqui.</p></div><div className="actions"><label className="primary-button contract-upload"><Paperclip size={16} /> Importar contrato<input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={originalData.saving} onChange={async (changeEvent) => { const file = changeEvent.target.files?.[0]; if (!file) return; try { const id = await originalData.createDocument("events", { title: file.name.replace(/\.(pdf|docx?)$/i, ""), date: "", time: "", locCerimonia: "", status: "Pendente", team: [], services: "Contrato importado manualmente", createdAt: new Date().toISOString() }); await originalData.uploadContract(file, id); setOpenEventId(id); setNotice("Contrato importado. Abra a ficha para completar cliente, data e local."); } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível importar o contrato."); } finally { changeEvent.currentTarget.value = ""; } }} /></label><label className="search-field"><Search size={16} /><input value={contractQuery} onChange={(event) => setContractQuery(event.target.value)} placeholder="Buscar cliente, data ou ficha" /></label></div></div><div className="document-flow"><article><FileText size={23} /><h3>{searchedContracts.length} fichas</h3><p>Contratos recebidos ou importados.</p></article><ChevronRight /><article><ClipboardList size={23} /><h3>Arquivos</h3><p>PDF, DOC, assinatura e valores.</p></article><ChevronRight /><article><ReceiptText size={23} /><h3>Histórico</h3><p>Cliente, data e pagamento em um só lugar.</p></article></div><div className="contract-directory">{searchedContracts.length ? searchedContracts.map((event) => <article key={event.id} className="contract-row"><div><strong>{event.client}</strong><span>{event.title} · {event.date} · {event.time}</span><small>{event.project}</small></div><div><span className="stage-pill">{event.contractSigned ? "Assinado" : event.contract}</span><b>{event.value}</b></div><button className="outline-button" onClick={() => { setOpenEventId(event.id); setNotice(`Ficha localizada: ${event.title}. Abra Agenda para editar todos os dados.`); }}>Localizar ficha <ChevronRight size={15} /></button><button className="outline-button" disabled={originalData.saving} onClick={() => void moveToTrash(event)}><Trash2 size={15} /> Lixeira</button>{event.contractUrl && <a className="outline-button" href={event.contractUrl} target="_blank" rel="noreferrer">Abrir <ExternalLink size={15} /></a>}</article>) : <div className="availability-note"><FileText size={18} /><span>Nenhum contrato cadastrado. Eventos sem contrato ficam ocultos nesta aba.</span></div>}</div></section>;
  }
  const receivedProposals = flowRequests.filter((request) => request.status !== "Lixeira" && String(request.tipoRecebido || "proposal") !== "contract");
  return <section className="orders-layout"><div className="section-heading"><div><h2>Propostas · Recebidas</h2><p>Respostas recebidas por link publicado, HTML baixado ou envio direto do Flow.</p></div><button className="primary-button" onClick={() => setNotice("Novo documento preparado para o fluxo do Gerador.")}><Plus size={17} /> Criar proposta</button></div><div className="document-flow"><article><FileText size={23} /><h3>1. Proposta</h3><p>Cliente escolhe itens no Gerador.</p></article><ChevronRight /><article><ClipboardList size={23} /><h3>2. Recebida</h3><p>A origem e os dados ficam registrados.</p></article><ChevronRight /><article><ReceiptText size={23} /><h3>3. Contrato</h3><p>Ao virar contrato, cria agenda e financeiro.</p></article></div><div className="contract-directory">{receivedProposals.length ? receivedProposals.map((request) => { const contractor = (request.dadosContratante || {}) as Record<string, unknown>; const commercial = (request.dadosComerciais || {}) as Record<string, unknown>; const sourceUrl = String(request.sourceUrl || ""); return <article key={String(request.id)} className="contract-row"><div><strong>{String(contractor.nome || "Cliente")}</strong><span>{String(request.tipoEvento || "Evento")} · {String((request.dadosEvento as Record<string, unknown> | undefined)?.data || "Data a confirmar")}</span><small>{String(commercial.servico || "Serviço a confirmar")}</small></div><div><span className="stage-pill">{String(request.sourceFormat || "Recebida do Flow")}</span><small>{String(request.origem || "Studio Melk Flow")}</small><b>{Number(commercial.valorTotal || 0) ? `R$ ${Number(commercial.valorTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Valor a confirmar"}</b></div>{sourceUrl && <a className="outline-button" href={sourceUrl} target="_blank" rel="noreferrer">Origem <ExternalLink size={15} /></a>}<button className="outline-button" disabled={originalData.saving} onClick={() => void moveFlowRequestToTrash(request as Record<string, unknown>)}><Trash2 size={15} /> Lixeira</button></article>; }) : <div className="availability-note"><FileText size={18} /><span>As propostas enviadas pelo Flow aparecerão aqui.</span></div>}</div></section>;
}
