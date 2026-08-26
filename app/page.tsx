"use client";

import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowUpRight, CalendarDays, Check, ChevronRight, CircleDollarSign,
  ClipboardList, FileText, LayoutDashboard, MessageCircle, Plus,
  Search, ShieldCheck, Sparkles, UsersRound, MapPin, UserRoundCheck,
  ReceiptText, WalletCards, ExternalLink, CheckCircle2, Clock3, Pencil, Paperclip, Share2, Mail, Phone, UserRound, Trash2, RotateCcw, Save
  , ShoppingBag, Images, FormInput, Link2, Send, BookOpen, ImageIcon
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
  [Images, "Entregas"], [BookOpen, "Álbuns"], [FormInput, "Formulários"], [CircleDollarSign, "Financeiro"], [Trash2, "Lixeira"], [ShieldCheck, "Importação"],
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
 type EventRecord = { id: string; clientId?: string; integrationId?: string; title: string; date: string; rawDate?: string; time: string; place: string; mapUrl?: string; partyPlace?: string; partyMapUrl?: string; brideMakingOf?: string; groomMakingOf?: string; preWeddingDate?: string; preWeddingTime?: string; preWeddingPlace?: string; route?: string; tasks?: string; companyCost?: string; editingCost?: string; extraCosts?: string; status: string; client: string; email: string; phone: string; project: string; value: string; team: TeamAssignment[]; teamNotes?: string; reminders?: string; contract: "Link do CRM" | "PDF anexado" | "Pendente"; contractUrl?: string; contractFileName?: string; contractSigned?: boolean; contractSignedAt?: string; paid: string; remaining: string };
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

 type FormTemplate = { id: string; name: string; description: string; fields: string[]; featured: boolean; active: boolean };

const initialFormTemplates: FormTemplate[] = [
  { id:"casamentos", name:"Casamentos", description:"Um contato inicial simples para entender data e locais.", fields:["Nome do casal","Data do casamento","Local da cerimônia","Local da festa"], featured:true, active:true },
  { id:"aniversarios", name:"Aniversários e 15 anos", description:"Dados essenciais da festa para o primeiro contato.", fields:["Nome do contratante","Data da festa","Local da festa","Idade do aniversariante"], featured:true, active:true },
  { id:"ensaios", name:"Ensaios", description:"Conte qual ensaio deseja e o melhor período.", fields:["Nome","WhatsApp","Tipo de ensaio","Período","Cidade"], featured:true, active:true },
  { id:"empresas", name:"Empresas", description:"Briefing para fotografia e vídeo corporativo.", fields:["Empresa","Contato","WhatsApp","E-mail","Briefing","Prazo"], featured:false, active:true },
  { id:"eventos", name:"Eventos sociais", description:"Festas, batizados e outras celebrações.", fields:["Evento","Responsável","WhatsApp","Data","Local"], featured:false, active:true },
  { id:"personalizado", name:"Pedido personalizado", description:"Uma porta aberta para outros projetos.", fields:["Nome","WhatsApp","O que você precisa?","Data ou prazo"], featured:false, active:true },
];

type CatalogProduct = { id:string; title:string; description:string; action:string; active:boolean; price:string; paymentLink:string; photo:string; attachToReport:boolean; attachToPortal:boolean };

function DeliverySalesWorkspace({ setNotice }: { setNotice:(message:string)=>void }) {
  const [jobType,setJobType]=useState<"casamento"|"aniversario"|"ensaio"|"corporativo"|"marketing">("casamento");
  const [cover,setCover]=useState("");
  const [format,setFormat]=useState<"horizontal"|"vertical">("horizontal");
  const [position,setPosition]=useState("50");
  const [guidePdf,setGuidePdf]=useState<{name:string;url:string}|null>(null);
  const [guideVisible,setGuideVisible]=useState(true);
  const [guidePortalActive,setGuidePortalActive]=useState(true);
  const [guideReportActive,setGuideReportActive]=useState(true);
  const [guideNewContent,setGuideNewContent]=useState(true);
  const [guideMode,setGuideMode]=useState<"preparacao"|"album"|"quinzeDias">("preparacao");
  const [guideVideo,setGuideVideo]=useState("");
  const [alignmentNotes,setAlignmentNotes]=useState("");
  const [savedGuideNames,setSavedGuideNames]=useState<string[]>(["Guia do ensaio", "Guia de escolha do álbum"]);
  const [templates,setTemplates]=useState<string[]>(["Álbum premium", "Livro de ensaio", "Quadros e ampliações"]);
  const [guideLibraries,setGuideLibraries]=useState({
    preparacao:["Escolha roupas confortáveis e coordenadas, evitando estampas que disputem atenção.","Prefira um local com significado e que combine com o estilo desejado.","Considere luz e horário; o fim da tarde costuma oferecer iluminação mais suave."],
    album:["Conte a história em sequência: preparação, cerimônia, retratos, família e festa.","Escolha primeiro as fotos indispensáveis; depois complete as transições e detalhes.","Use imagens maiores para momentos emocionantes e marcantes; sequências menores funcionam bem para ações e detalhes.","Evite muitas fotos quase iguais. Variedade de planos, pessoas e emoções deixa o álbum mais interessante.","Confira tamanho, número de páginas, tipo de capa, papel, acabamento e prazo antes de aprovar."],
    quinzeDias:["Agende a reunião de alinhamento com o fotógrafo e confirme todos os horários e endereços.","Combine com a maquiadora para a noiva estar pronta cerca de 2 horas antes da cerimônia se desejar fotos com tranquilidade.","Envie referências importantes e avise se houver pessoas, detalhes ou momentos que não podem faltar.","Confirme responsáveis, contatos, restrições do local, deslocamentos e plano para chuva.","Decida se deseja encomendar quadros, ampliações, livro do ensaio ou outros produtos antes do evento."],
  });
  const guideTips=guideLibraries[guideMode];
  const setGuideTips=(updater:(items:string[])=>string[])=>setGuideLibraries(libraries=>({...libraries,[guideMode]:updater(libraries[guideMode])}));
  const [products,setProducts]=useState<CatalogProduct[]>([
    {id:"album",title:"Álbum do casamento",description:"Uma história impressa para atravessar gerações, sem depender de telas, senhas ou links.",action:"Conhecer os álbuns",active:true,price:"A partir de R$ 1.850,00",paymentLink:"",photo:"",attachToReport:true,attachToPortal:true},
    {id:"book",title:"Livro do pré-wedding",description:"Transforme o ensaio em um livro para recordar essa fase e compor a decoração do casamento.",action:"Ver modelos",active:true,price:"A partir de R$ 890,00",paymentLink:"",photo:"",attachToReport:true,attachToPortal:true},
    {id:"frames",title:"Quadros e ampliações",description:"Leve as imagens favoritas para sua casa ou presenteie pessoas importantes.",action:"Pedir orçamento",active:true,price:"Sob consulta",paymentLink:"",photo:"",attachToReport:false,attachToPortal:true},
  ]);
  const jobProfiles={casamento:{label:"Casamento",client:"Nathalia & Victor",portal:"Memórias do casamento",guide:"Guia do casal"},aniversario:{label:"Aniversário e 15 anos",client:"Isabella · 15 anos",portal:"Memórias da celebração",guide:"Guia para a festa"},ensaio:{label:"Ensaio",client:"Marina Alves",portal:"Seu ensaio",guide:"Guia para o ensaio"},corporativo:{label:"Evento corporativo",client:"Empresa Aurora",portal:"Cobertura do evento",guide:"Orientações para a produção"},marketing:{label:"Marketing e conteúdo",client:"Marca Horizonte",portal:"Conteúdos da campanha",guide:"Briefing e preparação"}} as const;
  const profile=jobProfiles[jobType];
  const updateProduct=(id:string,changes:Partial<CatalogProduct>)=>setProducts(items=>items.map(item=>item.id===id?{...item,...changes}:item));
  const requestProduct=(product:CatalogProduct)=>{const orderId=`PED-${Date.now().toString().slice(-6)}`;const message=["Olá, Studio Melk! Gostaria de solicitar este produto:","",`Pedido: ${orderId}`,`Cliente/projeto: ${profile.client}`,`Tipo de trabalho: ${profile.label}`,`Produto: ${product.title}`,`Valor informado: ${product.price}`,`Detalhes: ${product.description}`,"Quantidade: 1","Opção/acabamento: quero receber as opções disponíveis","Observações: confirmar prazo, formato, uso e valor final",product.paymentLink?`Link para pagamento quando aprovado: ${product.paymentLink}`:"","Por favor, envie as opções para eu concluir o pedido."].filter(Boolean).join("\n");window.open(`https://wa.me/5511999160224?text=${encodeURIComponent(message)}`,"_blank","noopener,noreferrer");setNotice(`${orderId} preparado para ${profile.label.toLowerCase()}.`)};
  return <section className="commerce-delivery"><div className="section-heading"><div><h2>Entregas e produtos</h2><p>Portal, relatórios e ofertas se adaptam ao tipo de trabalho.</p></div><div className="adaptive-job"><label>Visualizar como<select value={jobType} onChange={event=>setJobType(event.target.value as typeof jobType)}><option value="casamento">Casamento</option><option value="aniversario">Aniversário e 15 anos</option><option value="ensaio">Ensaio</option><option value="corporativo">Evento corporativo</option><option value="marketing">Marketing e conteúdo</option></select></label><button className="primary-button" onClick={()=>setNotice(`Nova entrega de ${profile.label.toLowerCase()} preparada.`)}><Plus size={17}/> Nova entrega</button></div></div>
    <div className="delivery-editor-grid"><aside className="delivery-controls"><h3>Capa do portal</h3><p>Sem imagem, usamos um fundo neutro. Você pode adicionar foto do casal, aniversariante, equipe, evento ou campanha.</p><label className="cover-upload"><ImageIcon size={18}/><span>{cover?"Trocar imagem de capa":"Adicionar imagem de capa"}</span><input type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(file)setCover(URL.createObjectURL(file))}}/></label><div className="cover-format"><button className={format==="horizontal"?"active":""} onClick={()=>setFormat("horizontal")}>Horizontal</button><button className={format==="vertical"?"active":""} onClick={()=>setFormat("vertical")}>Vertical</button></div><label>Ajustar enquadramento<input type="range" min="0" max="100" value={position} onChange={e=>setPosition(e.target.value)}/></label>{cover&&<button className="outline-button" onClick={()=>setCover("")}>Usar fundo neutro</button>}</aside><div className={`delivery-preview ${format}`} style={cover?{backgroundImage:`linear-gradient(90deg,rgba(5,32,24,.9),rgba(5,32,24,.16)),url(${cover})`,backgroundPosition:`${position}% center`}:undefined}><div><span>{profile.portal}</span><h3>{jobType==="marketing"?"Conteúdo pronto para colocar sua marca em movimento.":jobType==="corporativo"?"A história do seu evento, organizada para sua equipe.":"Suas imagens merecem permanecer perto."}</h3><p>{profile.client} · fotos, vídeos e documentos</p><button>Acessar entregas</button></div></div></div>
    <div className="album-message"><BookOpen size={32}/><div><h3>Mais que fotografias: uma herança de família</h3><p>Arquivos digitais são práticos. O álbum é o objeto que volta às mãos em aniversários, encontros e novas gerações. O cliente entende essa importância e solicita opções sem pressão.</p></div><button className="primary-button" onClick={()=>requestProduct(products[0])}>Quero conhecer</button></div>
    <div className="guide-mode-tabs"><button className={guideMode==="preparacao"?"active":""} onClick={()=>setGuideMode("preparacao")}>Guia do ensaio</button><button className={guideMode==="album"?"active":""} onClick={()=>setGuideMode("album")}>Escolha das fotos e álbum</button><button className={guideMode==="quinzeDias"?"active":""} onClick={()=>setGuideMode("quinzeDias")}>15 dias antes</button></div>
    <section className="session-guide">
      <div className="session-guide-heading"><div><BookOpen size={25}/><span><h3>{guideMode==="album"?"Guia de escolha das fotos para o álbum":guideMode==="quinzeDias"?"Preparação e alinhamento — 15 dias antes":profile.guide}</h3><p>{guideMode==="album"?"Sequência, fotos indispensáveis, tamanhos, acabamentos e aprovação.":guideMode==="quinzeDias"?"Reunião, referências, horários, fornecedores e decisões finais.":"Um link fixo com orientações adaptadas ao trabalho."}</p></span></div><div className="guide-heading-actions"><button className="outline-button" onClick={()=>{const guideName=guideMode==="album"?"Guia de escolha do álbum":guideMode==="quinzeDias"?"Guia 15 dias antes":profile.guide;setSavedGuideNames(items=>items.includes(guideName)?items:[...items,guideName]);setNotice(`${guideName} salvo como material reutilizável.`)}}><Save size={14}/> Salvar guia</button><button className={guideVisible?"guide-on":"guide-off"} onClick={()=>setGuideVisible(value=>!value)}>{guideVisible?"Visível no portal":"Oculto"}</button></div></div>
      <div className="session-guide-body"><div className="guide-tips"><strong>Orientações que aparecem no link</strong>{guideTips.map((tip,index)=><label key={index}><span>{index+1}</span><textarea value={tip} onChange={event=>setGuideTips(items=>items.map((item,itemIndex)=>itemIndex===index?event.target.value:item))}/><button aria-label="Excluir dica" onClick={()=>setGuideTips(items=>items.filter((_,itemIndex)=>itemIndex!==index))}>×</button></label>)}<button className="outline-button" onClick={()=>setGuideTips(items=>[...items,"Nova orientação para este trabalho."])}><Plus size={15}/> Adicionar orientação</button></div>
      <div className="guide-document"><strong>PDF e vídeo explicativo</strong><p>Complemente o guia com seu PDF e um vídeo do YouTube, exibido dentro do portal.</p><label className="guide-upload"><Paperclip size={18}/><span>{guidePdf?guidePdf.name:"Adicionar PDF com orientações"}</span><input type="file" accept="application/pdf,.pdf" onChange={event=>{const file=event.target.files?.[0];if(file){setGuidePdf({name:file.name,url:URL.createObjectURL(file)});setNotice(file.name + " anexado ao material de orientação.")}}}/></label>{guidePdf&&<div className="guide-file-actions"><a href={guidePdf.url} target="_blank" rel="noreferrer">Abrir PDF</a><button onClick={()=>setGuidePdf(null)}>Remover</button></div>}<label className="guide-video">Link do vídeo no YouTube<input value={guideVideo} onChange={event=>setGuideVideo(event.target.value)} placeholder="https://youtube.com/watch?v=..."/></label>{guideVideo&&<div className="video-preview"><span>Prévia do vídeo vinculada</span><a href={guideVideo} target="_blank" rel="noreferrer">Abrir vídeo <ExternalLink size={13}/></a></div>}<div className="guide-distribution"><strong>Onde este guia aparece</strong><label><input type="checkbox" checked={guidePortalActive} onChange={event=>setGuidePortalActive(event.target.checked)}/> Área do cliente</label><label><input type="checkbox" checked={guideReportActive} onChange={event=>setGuideReportActive(event.target.checked)}/> Relatório e ficha do cliente</label><label><input type="checkbox" checked={guideNewContent} onChange={event=>setGuideNewContent(event.target.checked)}/> Avisar “novo conteúdo”</label></div><button className="primary-button" disabled={!guideVisible} onClick={()=>{const guideUrl=`https://studio-melk-next.vercel.app/guia/${jobType}/${guideMode}`;const message=[`Olá, ${profile.client}!`,`Preparamos um guia com informações importantes:`,guideUrl,guidePdf?`PDF complementar: ${guidePdf.name}`:"",guideVideo?`Vídeo explicativo: ${guideVideo}`:"",guideNewContent?"Há novo conteúdo disponível na sua área do cliente.":"","Qualquer dúvida, fale com o Studio Melk."].filter(Boolean).join("\n\n");window.open(`https://wa.me/?text=${encodeURIComponent(message)}`,"_blank","noopener,noreferrer");setNotice(`${guideMode === "album" ? "Guia do álbum" : "Guia do evento"} preparado para enviar${guidePortalActive ? " e anexado à área do cliente" : ""}.`)}}><Send size={15}/> Enviar guia completo</button><button className="outline-button" onClick={()=>setNotice(`${guideMode === "album" ? "Guia do álbum" : "Guia do evento"} ${guideReportActive ? "incluído no relatório e na ficha do cliente" : "mantido apenas no portal"}.`)}><FileText size={15}/> Incluir no relatório</button><button className="outline-button" onClick={async()=>{const url=`https://studio-melk-next.vercel.app/guia/${jobType}/${guideMode}`;try{await navigator.clipboard.writeText(url)}catch{}setNotice("Link fixo do guia copiado.")}}><Link2 size={15}/> Copiar link fixo</button></div></div>
      {guideMode==="quinzeDias"&&<div className="alignment-workspace"><div><strong>Checklist da ficha do evento</strong>{["Reunião agendada","Horários confirmados","Locais e Maps conferidos","Referências recebidas","Maquiadora alinhada","Equipe e funções confirmadas","Plano de chuva verificado","Produtos adicionais oferecidos"].map(item=><label key={item}><input type="checkbox"/> {item}</label>)}</div><label><strong>Bloco de notas do alinhamento</strong><textarea value={alignmentNotes} onChange={event=>setAlignmentNotes(event.target.value)} placeholder="Anote pedidos especiais, nomes importantes, restrições, referências e decisões da reunião..."/><button className="primary-button" onClick={()=>setNotice("Checklist e notas salvos na ficha do evento.")}><Save size={15}/> Salvar na ficha</button></label></div>}
    </section>
    <section className="commerce-store"><div className="store-intro"><div><h3>Uma história que merece permanecer</h3><p>Álbuns, livros e quadros transformam o que foi vivido em algo que a família pode abrir, tocar e revisitar. Monte uma vitrine com seus próprios produtos, valores, fotos e condições.</p></div><div className="store-proof"><strong>{products.filter(item=>item.active).length}</strong><span>produtos visíveis<br/>neste portal</span></div></div><div className="store-actions"><div><strong>Catálogo comercial</strong><span>Personalize a loja deste cliente e acompanhe cada pedido.</span></div><div><button className="outline-button" onClick={()=>setNotice("Perfil da empresa aberto na aba Produtos. Alterações serão usadas nos próximos portais.")}><ShoppingBag size={15}/> Produtos padrão</button><button className="outline-button" onClick={()=>{const name=`Modelo ${templates.length+1}`;setTemplates(items=>[...items,name]);setNotice(`${name} salvo com o catálogo atual.`)}}><Save size={15}/> Salvar modelo</button><button className="primary-button" onClick={()=>setProducts(items=>[...items,{id:String(Date.now()),title:"Nova oferta",description:"Explique o produto e sua vantagem para o cliente.",action:"Solicitar produto",active:true,price:"A combinar",paymentLink:"",photo:"",attachToReport:false,attachToPortal:true}])}><Plus size={15}/> Novo produto</button></div></div><div className="store-library"><span>Modelos salvos:</span>{templates.map(template=><button key={template} onClick={()=>setNotice(`${template} aplicado ao catálogo. Revise foto, valor e condições antes de compartilhar.`)}>{template}</button>)}<span className="saved-guides">Guias salvos: {savedGuideNames.join(" · ")}</span></div>
      <div className="offer-grid">{products.map(product=><article className={product.active?"":"is-disabled"} key={product.id}><div className="product-image" style={product.photo?{backgroundImage:`url(${product.photo})`}:undefined}><label><ImageIcon size={18}/><span>{product.photo?"Trocar foto":"Adicionar foto"}</span><input type="file" accept="image/*" onChange={event=>{const file=event.target.files?.[0];if(file)updateProduct(product.id,{photo:URL.createObjectURL(file)})}}/></label></div><div className="offer-switch"><ShoppingBag size={20}/><button aria-pressed={product.active} onClick={()=>updateProduct(product.id,{active:!product.active})}>{product.active?"Visível":"Oculto"}</button></div><input value={product.title} onChange={event=>updateProduct(product.id,{title:event.target.value})}/><textarea value={product.description} onChange={event=>updateProduct(product.id,{description:event.target.value})}/><label className="product-price">Valor ou chamada<input value={product.price} onChange={event=>updateProduct(product.id,{price:event.target.value})}/></label><label className="payment-link">Link de pagamento (opcional)<input value={product.paymentLink} placeholder="https://..." onChange={event=>updateProduct(product.id,{paymentLink:event.target.value})}/></label><div className="product-destination"><label><input type="checkbox" checked={product.attachToPortal} onChange={event=>updateProduct(product.id,{attachToPortal:event.target.checked})}/> Portal</label><label><input type="checkbox" checked={product.attachToReport} onChange={event=>updateProduct(product.id,{attachToReport:event.target.checked})}/> Relatório</label></div><div><button className="offer-cta" disabled={!product.active} onClick={()=>requestProduct(product)}>{product.action}</button><button className="link-button" onClick={()=>setNotice(`${product.title} ${product.attachToReport?"anexado ao relatório e ":""}${product.attachToPortal?"visível na área do cliente":"salvo apenas no catálogo"}.`)}><Link2 size={14}/> Aplicar</button></div></article>)}</div>
    </section></section>;
}

type AlbumPage = { id: string; name: string; url: string; kind: "capa" | "pagina" };
type AlbumStatus = "Rascunho" | "Enviado para aprovação" | "Correção solicitada" | "Aprovado" | "Finalizado";
type AlbumVolume = { id: string; name: string; format: string; pages: number; cover: string; box: boolean };
type AlbumCoverOption = {
  id: string;
  name: string;
  color: string;
  box: boolean;
  photo: string;
  composition: string;
  position: { x: number; y: number; zoom: number };
  text: string;
};

function AlbumWorkspace({ setNotice }: { setNotice: (message: string) => void }) {
  const [externalLink, setExternalLink] = useState("https://galeria.externa.com/selecao/nathalia-victor");
  const [pages, setPages] = useState<AlbumPage[]>([]);
  const [status, setStatus] = useState<AlbumStatus>("Rascunho");
  const [version, setVersion] = useState(1);
  const [format, setFormat] = useState("30×30 cm");
  const [minPages, setMinPages] = useState(30);
  const [maxPages, setMaxPages] = useState(60);
  const [albumPages, setAlbumPages] = useState(40);
  const [volumes, setVolumes] = useState<AlbumVolume[]>([
    { id: "principal", name: "Volume principal", format: "30×30 cm", pages: 40, cover: "Foto inteira", box: true },
  ]);
  const [coverColor, setCoverColor] = useState("Caramelo");
  const [composition, setComposition] = useState("1 foto inteira");
  const [box, setBox] = useState(true);
  const [coverPhoto, setCoverPhoto] = useState("");
  const [coverPosition, setCoverPosition] = useState({ x: 50, y: 50, zoom: 100 });
  const [coverText, setCoverText] = useState("Nathalia & Victor");
  const [viewerMode, setViewerMode] = useState<"linear" | "flip">("linear");
  const [viewerShowingCover, setViewerShowingCover] = useState(true);
  const [approvedPages, setApprovedPages] = useState<string[]>([]);
  const [referenceLink, setReferenceLink] = useState("");
  const [replacementPhoto, setReplacementPhoto] = useState("");
  const [coverOptions, setCoverOptions] = useState<AlbumCoverOption[]>([
    { id: "caramelo", name: "Capa 1 · Caramelo", color: "Caramelo", box: true, photo: "", composition: "1 foto inteira", position: { x: 50, y: 50, zoom: 100 }, text: "Nathalia & Victor" },
    { id: "verde", name: "Capa 2 · Verde floresta", color: "Verde floresta", box: true, photo: "", composition: "Foto + texto", position: { x: 50, y: 50, zoom: 100 }, text: "Nathalia & Victor" },
  ]);
  const [selectedCoverOption, setSelectedCoverOption] = useState("caramelo");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [correction, setCorrection] = useState("");
  const colors = ["Verde floresta", "Caramelo", "Areia", "Off-white", "Grafite", "Preto", "Vinho", "Azul petróleo"];
  const colorClass = (color: string) => color.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z]+/g, "-");
  const leatherColor = (color: string) => ({ "Verde floresta": "#25483b", Caramelo: "#9b6238", Areia: "#c9af83", "Off-white": "#ede6d9", Grafite: "#515154", Preto: "#202020", Vinho: "#6f2634", "Azul petróleo": "#1c5661" }[color] || "#9b6238");
  const total = 1850 + Math.max(0, albumPages - 30) * 48 + (box ? 490 : 0);
  const volumesTotal = volumes.reduce((sum, volume) => sum + 1850 + Math.max(0, volume.pages - 30) * 48 + (volume.box ? 490 : 0), 0);
  const updateVolume = (id: string, changes: Partial<AlbumVolume>) => setVolumes((items) => items.map((volume) => volume.id === id ? { ...volume, ...changes } : volume));
  const cover = pages.find((page) => page.kind === "capa");
  const internalPages = pages.filter((page) => page.kind === "pagina");
  const allViewerPages = [cover, ...internalPages].filter(Boolean) as AlbumPage[];
  const activeCoverOption = coverOptions.find((option) => option.id === selectedCoverOption) || coverOptions[0];
  const activeCoverPhoto = activeCoverOption?.photo || coverPhoto;
  const activeCoverPosition = activeCoverOption?.photo ? activeCoverOption.position : coverPosition;
  const activeCoverText = activeCoverOption?.text || coverText;

  function selectCoverOption(option: AlbumCoverOption) {
    setSelectedCoverOption(option.id);
    setCoverColor(option.color);
    setBox(option.box);
    setCoverPhoto(option.photo);
    setComposition(option.composition);
    setCoverPosition(option.position);
    setCoverText(option.text);
  }
  function saveCurrentCoverOption() {
    setCoverOptions((items) => items.map((item) => item.id === selectedCoverOption ? { ...item, color: coverColor, box, photo: coverPhoto, composition, position: coverPosition, text: coverText } : item));
    setNotice("Opção de capa salva. O cliente verá esta variação no mesmo link.");
  }
  function positionCoverFromPointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.type !== "pointerdown" && event.buttons !== 1) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    setCoverPosition((value) => ({ ...value, x, y }));
  }

  function addFiles(files: FileList | null, kind: "capa" | "pagina") {
    if (!files?.length) return;
    const additions = Array.from(files).map((file, index) => ({ id: `${Date.now()}-${index}`, name: file.name, url: URL.createObjectURL(file), kind }));
    setPages((items) => kind === "capa" ? [...items.filter((item) => item.kind !== "capa"), additions[0], ...items.filter((item) => item.kind === "pagina")] : [...items, ...additions]);
    setNotice(kind === "capa" ? "Capa atualizada. A foto ocupa toda a frente do álbum." : `${additions.length} página(s) adicionada(s) à versão ${version}.`);
  }
  function movePage(id: string, direction: -1 | 1) {
    setPages((items) => {
      const coverItem = items.find((item) => item.kind === "capa");
      const inner = items.filter((item) => item.kind === "pagina");
      const index = inner.findIndex((item) => item.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= inner.length) return items;
      [inner[index], inner[nextIndex]] = [inner[nextIndex], inner[index]];
      return coverItem ? [coverItem, ...inner] : inner;
    });
  }
  function publishForApproval() {
    if (!cover || !internalPages.length) { setNotice("Adicione a capa e ao menos uma página diagramada antes de enviar para aprovação."); return; }
    setStatus("Enviado para aprovação");
    setNotice(`Versão ${version} enviada para aprovação. O link público está pronto para compartilhar.`);
  }
  function requestCorrection() {
    setStatus("Correção solicitada");
    setNotice("Correção registrada nesta versão. O histórico do álbum foi preservado.");
  }
  function createNewVersion() {
    setVersion((number) => number + 1); setStatus("Rascunho"); setCorrection("");
    setNotice("Nova versão criada. A versão anterior permanece no histórico.");
  }

  return <section className="album-workspace">
    <div className="section-heading"><div><h2>Álbuns</h2><p>Apresentação e aprovação após a seleção feita em plataforma externa.</p></div><div className="actions"><button className="outline-button" onClick={() => setViewerOpen(true)}>Pré-visualizar cliente</button><button className="outline-button" onClick={async () => { try { await navigator.clipboard.writeText("https://studio-melk-next.vercel.app/album/nathalia-victor-7q2m"); } catch {} setNotice("Link exclusivo do álbum copiado."); }}><Link2 size={16} /> Copiar link</button><button className="primary-button" onClick={publishForApproval}><Send size={16} /> Enviar para aprovação</button></div></div>
    <div className="album-status-row"><span className={`album-status ${status.toLowerCase().replaceAll(" ", "-").replace("ç", "c")}`}>{status} · versão {version}</span><small>Vinculado ao contrato existente · Casamento Nathalia & Victor · 22/08/2026</small></div>
    <div className="album-grid">
      <main className="album-main">
        <section className="external-selection"><div><span className="album-icon">↗</span><h3>Seleção feita externamente</h3><p>Este link é apenas referência para o fotógrafo. O Flow não armazena nem seleciona fotos.</p></div><label>Link da galeria ou seleção externa<input value={externalLink} onChange={(event) => setExternalLink(event.target.value)} /></label><a className="outline-button" href={externalLink} target="_blank" rel="noreferrer">Abrir seleção externa <ExternalLink size={14} /></a></section>
        <section className="album-pages"><div className="album-section-title"><div><h3>Páginas do álbum</h3><p>Envie somente as páginas já diagramadas no seu programa de preferência.</p></div><label className="outline-button upload-button"><Plus size={15} /> Adicionar páginas<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => addFiles(event.target.files, "pagina")} /></label></div>
          <label className="album-drop-zone"><ImageIcon size={27} /><strong>Arraste páginas diagramadas ou selecione arquivos</strong><span>JPG, PNG ou WEBP · múltiplos arquivos · até 50 MB por arquivo</span><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => addFiles(event.target.files, "pagina")} /></label>
          <div className="album-page-strip"><div className="cover-slot"><strong>Capa</strong><label className="cover-page-upload" style={cover?.url ? { backgroundImage: `url(${cover.url})` } : undefined}><span>{cover ? "Trocar capa" : "Adicionar capa"}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => addFiles(event.target.files, "capa")} /></label></div><div className="inner-pages"><strong>Páginas do miolo ({internalPages.length || albumPages} páginas)</strong><div>{internalPages.length ? internalPages.map((page, index) => <article key={page.id} className="page-thumb"><button type="button" onClick={() => { setViewerIndex((cover ? 1 : 0) + index); setViewerOpen(true); }} style={{ backgroundImage: `url(${page.url})` }} aria-label={`Ver página ${index + 1}`}><span>{String(index + 1).padStart(2, "0")}</span></button><footer><button onClick={() => movePage(page.id, -1)} aria-label="Mover página para trás">←</button><button onClick={() => movePage(page.id, 1)} aria-label="Mover página para frente">→</button><button onClick={() => setPages((items) => items.filter((item) => item.id !== page.id))} aria-label="Excluir página">×</button></footer></article>) : <p className="empty-pages">As páginas diagramadas aparecerão aqui em ordem.</p>}</div></div></div>
        </section>
        <section className="album-history"><div><h3>Versões e aprovação</h3><button className="outline-button" onClick={createNewVersion}>Nova versão</button></div><div className="version-list"><button className={version === 1 ? "current" : ""} onClick={() => setNotice("Versão 1: histórico preservado para consulta.")}><strong>Versão 1</strong><span>Correção solicitada</span><small>Enviada em 12/05/2026</small></button><button className={version >= 2 ? "current" : ""} onClick={() => setNotice(`Versão ${version}: ${status.toLowerCase()}.`)}><strong>Versão {version}</strong><span>{status}</span><small>Atualizada agora</small></button></div><ol className="album-timeline"><li>Álbum criado</li><li>Páginas diagramadas enviadas</li><li>Cliente solicitou correção na página 12</li><li>Versão {version} pronta para aprovação</li></ol></section>
      </main>
      <aside className="album-settings"><section><h3>Orçamento do álbum</h3><label>Formato do volume atual<select value={format} onChange={(event) => setFormat(event.target.value)}><option>30×30 cm</option><option>23×31 cm</option><option>25×35 cm</option></select></label><div className="page-range"><label>Mínimo<input type="number" min="20" value={minPages} onChange={(event) => setMinPages(Number(event.target.value))} /></label><label>Máximo<input type="number" min={minPages} value={maxPages} onChange={(event) => setMaxPages(Number(event.target.value))} /></label></div><label>Páginas atuais<input type="number" min={minPages} max={maxPages} value={albumPages} onChange={(event) => setAlbumPages(Math.max(minPages, Math.min(maxPages, Number(event.target.value))))} /></label><div className="album-volume-config"><div><strong>Volumes no pedido</strong><small>Some volumes, capas e caixas como em uma proposta.</small></div>{volumes.map((volume, index) => <article key={volume.id}><input aria-label="Nome do volume" value={volume.name} onChange={(event) => updateVolume(volume.id, { name: event.target.value })}/><select value={volume.pages} onChange={(event) => updateVolume(volume.id, { pages: Number(event.target.value) })}><option value={30}>30 páginas</option><option value={40}>40 páginas</option><option value={50}>50 páginas</option><option value={60}>60 páginas</option></select><select value={volume.format} onChange={(event) => updateVolume(volume.id, { format: event.target.value })}><option>30×30 cm</option><option>23×31 cm</option><option>25×35 cm</option></select><select value={volume.cover} onChange={(event) => updateVolume(volume.id, { cover: event.target.value })}><option>Foto inteira</option><option>Foto + texto</option><option>Mosaico</option><option>Couro com gravação</option></select><label><input type="checkbox" checked={volume.box} onChange={(event) => updateVolume(volume.id, { box: event.target.checked })}/> Caixa</label>{volumes.length > 1 && <button type="button" aria-label={`Remover ${volume.name}`} onClick={() => setVolumes((items) => items.filter((item) => item.id !== volume.id))}>×</button>}<b>R$ {(1850 + Math.max(0, volume.pages - 30) * 48 + (volume.box ? 490 : 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</b></article>)}<button type="button" className="outline-button" onClick={() => setVolumes((items) => [...items, { id: `volume-${Date.now()}`, name: `Volume ${items.length + 1}`, format: "30×30 cm", pages: 30, cover: "Foto inteira", box: false }])}><Plus size={15}/> Adicionar volume</button></div><div className="cover-choice"><strong>Capa</strong><span>Foto inteira na frente · couro na lombada e no verso</span></div><div className="color-picker"><strong>Cor do couro</strong><div>{colors.map((color) => <button key={color} className={`${colorClass(color)} ${coverColor === color ? "selected" : ""}`} onClick={() => setCoverColor(color)} aria-label={color}><i />{color}</button>)}</div></div><label className="box-choice"><input type="checkbox" checked={box} onChange={(event) => setBox(event.target.checked)} /> Caixa toda em couro</label><div className="album-total"><span>{volumes.length} volume(s) configurado(s)</span><b>R$ {volumesTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</b></div><button className="outline-button full" onClick={() => setNotice("Volumes e orçamento do álbum salvos na ficha do cliente.")}>Salvar orçamento</button><button className="primary-button full" onClick={() => setNotice("Proposta de álbum com todos os volumes pronta para WhatsApp, e-mail ou link público.")}>Enviar proposta de álbum</button></section>
        <section className="cover-config">
          <h3>Capa e caixa</h3>
          <div className="cover-3d-preview" style={{ "--cover-leather": leatherColor(coverColor) } as React.CSSProperties} aria-label="Prévia da capa: verso e lombada em couro, frente com foto inteira">
            <div className="cover-back" /><div className="cover-spine">{coverText}</div>
            <div className="cover-front" onPointerDown={positionCoverFromPointer} onPointerMove={positionCoverFromPointer} style={coverPhoto ? { backgroundImage:`url(${coverPhoto})`,backgroundPosition:`${coverPosition.x}% ${coverPosition.y}%`,backgroundSize:`${coverPosition.zoom}%` } : undefined}><span>{coverText}</span></div>
          </div>
          <small className="cover-legend">Arraste a foto na frente para reposicionar · verso e lombada em couro</small>
          <label className="cover-photo-input" style={coverPhoto ? { backgroundImage: `url(${coverPhoto})`, backgroundPosition:`${coverPosition.x}% ${coverPosition.y}%`, backgroundSize:`${coverPosition.zoom}%` } : undefined}>
            <span>{coverPhoto ? "Trocar foto da frente" : "Selecionar foto para a capa inteira"}</span><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) setCoverPhoto(URL.createObjectURL(file)); }} />
          </label>
          <div className="composition-options">{["1 foto inteira", "2 fotos", "3 fotos", "Mosaico", "Foto + texto"].map((item) => <button className={composition === item ? "active" : ""} key={item} onClick={() => setComposition(item)}>{item}</button>)}</div>
          <label className="cover-title">Texto sobre a foto<input value={coverText} onChange={(event) => setCoverText(event.target.value)} placeholder="Nome ou frase da capa" /></label>
          <div className="crop-controls"><label>Posição horizontal<input type="range" min="0" max="100" value={coverPosition.x} onChange={(event) => setCoverPosition(value => ({...value,x:Number(event.target.value)}))} /></label><label>Posição vertical<input type="range" min="0" max="100" value={coverPosition.y} onChange={(event) => setCoverPosition(value => ({...value,y:Number(event.target.value)}))} /></label><label>Zoom<input type="range" min="100" max="220" value={coverPosition.zoom} onChange={(event) => setCoverPosition(value => ({...value,zoom:Number(event.target.value)}))} /></label></div>
          <div className="cover-options-editor"><strong>Opções para o cliente</strong><p>Envie mais de uma capa, cor e caixa no mesmo link para o cliente comparar.</p>{coverOptions.map(option=><button key={option.id} className={selectedCoverOption===option.id?"selected":""} onClick={()=>selectCoverOption(option)}><i style={{background:leatherColor(option.color)}} />{option.name}{option.box?" · caixa":""}</button>)}<button onClick={()=>{const id=`opcao-${Date.now()}`;setCoverOptions(items=>[...items,{id,name:`Capa ${items.length+1} · ${coverColor}`,color:coverColor,box,photo:coverPhoto,composition,position:coverPosition,text:coverText}]);setSelectedCoverOption(id);setNotice("Nova opção de capa adicionada para o cliente comparar.");}}>+ Adicionar esta opção</button></div>
          <button className="outline-button full" onClick={saveCurrentCoverOption}>Salvar alterações nesta capa</button>
          <p>O layout escolhido afeta apenas a frente. Verso e lombada continuam em couro {coverColor.toLowerCase()}.</p><button className="outline-button full" onClick={() => { setViewerShowingCover(true); setViewerOpen(true); }}>Ajustar recorte e visualizar</button>
        </section>
        <section className="album-guides"><h3>Guias e materiais</h3><p><FileText size={15} /> Guia de escolha das fotos.pdf</p><p><ExternalLink size={15} /> Vídeo: Como escolher fotos para o álbum</p></section>
      </aside>
    </div>
    {viewerOpen && <div className="album-viewer" role="dialog" aria-modal="true" aria-label="Prévia do álbum">
      <header><div><span>Studio Melk</span><h2>Álbum de Nathalia & Victor · versão {version}</h2><small>Confira a capa, o verso e cada página. Você pode aprovar ou pedir uma alteração pontual.</small></div><div><button className={viewerShowingCover ? "outline-button selected-mode" : "outline-button"} onClick={() => setViewerShowingCover(true)}>Capa e caixa</button>{allViewerPages.length > 0 && <button className={!viewerShowingCover ? "outline-button selected-mode" : "outline-button"} onClick={() => setViewerShowingCover(false)}>Páginas</button>}<button className={viewerMode === "linear" ? "outline-button selected-mode" : "outline-button"} onClick={() => setViewerMode("linear")}>Modo linear</button><button className={viewerMode === "flip" ? "outline-button selected-mode" : "outline-button"} onClick={() => setViewerMode("flip")}>Virada de página</button><button className="outline-button" onClick={() => document.documentElement.requestFullscreen?.()}>Tela cheia</button><button className="icon-button" onClick={() => setViewerOpen(false)} aria-label="Fechar">×</button></div></header>
      <div className="client-cover-options"><strong>Escolha a capa que prefere</strong>{coverOptions.map(option=><button key={option.id} className={selectedCoverOption===option.id?"selected":""} onClick={()=>selectCoverOption(option)}><i style={{background:leatherColor(option.color)}} />{option.name}{option.box?" · com caixa":""}</button>)}</div>
      <div className={`viewer-stage ${viewerMode}`}>
        {viewerShowingCover ? <div className="viewer-cover-only" style={{"--viewer-leather":leatherColor(activeCoverOption?.color||coverColor)} as React.CSSProperties}><div className="viewer-cover-back" /><div className="viewer-cover-spine">{activeCoverText}</div><div className="viewer-cover-front" style={activeCoverPhoto ? { backgroundImage:`url(${activeCoverPhoto})`,backgroundPosition:`${activeCoverPosition.x}% ${activeCoverPosition.y}%`,backgroundSize:`${activeCoverPosition.zoom}%` } : undefined}>{activeCoverText}</div><p>{activeCoverOption?.box?"Inclui caixa toda em couro na cor selecionada.":"Sem caixa selecionada."} A frente recebe a foto inteira; verso e lombada permanecem em couro.</p></div> : <><button className="viewer-arrow" onClick={() => setViewerIndex((index) => Math.max(0, index - 1))}>‹</button><figure className={viewerMode === "flip" ? "flip-page" : ""} style={{ backgroundImage: `url(${allViewerPages[Math.min(viewerIndex, allViewerPages.length - 1)]?.url})` }}><figcaption>{viewerIndex === 0 ? "Capa diagramada" : `Páginas ${viewerIndex * 2 - 1}–${viewerIndex * 2}`}</figcaption></figure><button className="viewer-arrow" onClick={() => setViewerIndex((index) => Math.min(allViewerPages.length - 1, index + 1))}>›</button></>}
      </div>
      <footer><div className="approval-help"><strong>Como aprovar</strong><span>Compare as capas, veja frente, verso e lombada. Nas páginas, aprove cada uma ou descreva o ajuste e inclua uma referência.</span></div><label>Correção nesta página<textarea value={correction} onChange={(event) => setCorrection(event.target.value)} placeholder="Ex.: trocar a foto da página 12 ou ajustar o texto…" /></label><label className="reference-input">Link ou número da foto<input value={referenceLink} onChange={(event) => setReferenceLink(event.target.value)} placeholder="Cole link ou informe o número" /></label><label className="reference-upload">Enviar foto de referência<input type="file" accept="image/*" onChange={(event) => { const file=event.target.files?.[0]; if(file) setReplacementPhoto(file.name); }} /><span>{replacementPhoto || "Escolher foto"}</span></label><button className="outline-button" disabled={viewerShowingCover} onClick={() => { const current=allViewerPages[viewerIndex]?.id; if(current) setApprovedPages(items => items.includes(current) ? items.filter(id=>id!==current) : [...items,current]); }}> {approvedPages.includes(allViewerPages[viewerIndex]?.id) ? "Página aprovada ✓" : "Aprovar esta página"}</button><button className="outline-button" onClick={requestCorrection}>Solicitar correção</button><button className="primary-button" onClick={() => { setStatus("Aprovado"); setNotice(`Álbum aprovado em versão ${version}.`); setViewerOpen(false); }}>Aprovar álbum</button></footer>
    </div>}
  </section>;
}

function FormsWorkspace({setNotice}:{setNotice:(message:string)=>void}) {
  const [forms,setForms]=useState<FormTemplate[]>(initialFormTemplates);
  const [selectedId,setSelectedId]=useState(forms[0].id);
  const [formKind,setFormKind]=useState<"contato"|"fechamento">("contato");
  const [kindActive,setKindActive]=useState({contato:true,fechamento:true});
  const [shareOpen,setShareOpen]=useState(false);
  const [shareTarget,setShareTarget]=useState("");
  const selected=forms.find(form=>form.id===selectedId)??forms[0];
  const closingFields=["Nome completo do contratante","CPF ou CNPJ","RG","WhatsApp","E-mail","Endereço completo","Tipo de evento ou trabalho","Data","Horário","Locais e endereços","Itens escolhidos na proposta","Valor total","Forma de pagamento","Número de parcelas","Datas e valores das parcelas","Observações para o contrato"];
  const effectiveFields=formKind==="contato"?selected.fields:closingFields;
  const update=(changes:Partial<FormTemplate>)=>setForms(items=>items.map(item=>item.id===selected.id?{...item,...changes}:item));
  const toggleFeatured=()=>{if(!selected.featured&&forms.filter(form=>form.featured).length>=6){setNotice("O limite é de 6 formulários em destaque. Os demais continuam acessíveis na lista.");return}update({featured:!selected.featured})};
  const publicUrl=`https://studio-melk-next.vercel.app/formulario/${selected.id}/${formKind}`;
  const share=async(action:"copy"|"whatsapp"|"email"|"embed"|"html")=>{if(action==="copy"){try{await navigator.clipboard.writeText(publicUrl)}catch{}setNotice("Link publicado copiado.")}if(action==="whatsapp"){window.open(`https://wa.me/${shareTarget.replace(/\D/g,"")}?text=${encodeURIComponent(`Olá! Preencha o formulário do Studio Melk: ${publicUrl}`)}`,"_blank","noopener,noreferrer");setNotice("Formulário preparado para envio por WhatsApp.")}if(action==="email"){window.location.href=`mailto:${encodeURIComponent(shareTarget)}?subject=${encodeURIComponent(`Formulário Studio Melk — ${selected.name}`)}&body=${encodeURIComponent(`Olá! Preencha o formulário pelo link: ${publicUrl}`)}`;}if(action==="embed"){const code=`<iframe src="${publicUrl}" title="Formulário Studio Melk" width="100%" height="760" frameborder="0"></iframe>`;try{await navigator.clipboard.writeText(code)}catch{}setNotice("Código para incorporar no site copiado.")}if(action==="html")setNotice("Arquivo HTML do formulário preparado para download.")};
  return <section className="forms-workspace"><div className="section-heading"><div><h2>Formulários publicados</h2><p>Contato simples e fechamento completo, ativos separadamente e adaptados a cada segmento.</p></div><button className="primary-button" onClick={()=>{const id=`form-${Date.now()}`;setForms(items=>[...items,{id,name:"Novo segmento",description:"Conte um pouco sobre o trabalho.",fields:["Nome","Data","Local"],featured:false,active:true}]);setSelectedId(id)}}><Plus size={17}/> Novo segmento</button></div><div className="form-kind-tabs"><button className={formKind==="contato"?"active":""} onClick={()=>setFormKind("contato")}><strong>Formulário de contato</strong><span>Rápido e sem complicação</span></button><button className={formKind==="fechamento"?"active":""} onClick={()=>setFormKind("fechamento")}><strong>Formulário de fechamento</strong><span>Cliente, evento, proposta, contrato e pagamento</span></button><label><input type="checkbox" checked={kindActive[formKind]} onChange={event=>setKindActive(item=>({...item,[formKind]:event.target.checked}))}/>{kindActive[formKind]?"Ativo e compartilhável":"Desativado"}</label></div><div className="forms-layout"><aside className="forms-list"><div className="featured-counter"><strong>{forms.filter(form=>form.featured).length} de 6</strong><span>em destaque</span></div>{forms.map(form=><button className={form.id===selected.id?"selected":""} key={form.id} onClick={()=>setSelectedId(form.id)}><span><strong>{form.name}</strong><small>{form.fields.length} campos iniciais · {form.active?"Publicado":"Oculto"}</small></span>{form.featured&&<em>Destaque</em>}</button>)}</aside><div className="form-builder"><div className="builder-toolbar"><div><span>{formKind==="contato"?"Contato inicial":"Fechamento e contrato"}</span><h3>{selected.name}</h3></div><div><button className="outline-button" onClick={toggleFeatured}>{selected.featured?"Retirar destaque":"Destacar"}</button><button className="primary-button" disabled={!kindActive[formKind]} onClick={()=>setShareOpen(value=>!value)}><Link2 size={15}/> Compartilhar</button></div></div>{shareOpen&&<div className="share-form-panel"><label>WhatsApp ou e-mail<input value={shareTarget} onChange={event=>setShareTarget(event.target.value)} placeholder="Digite o contato para enviar"/></label><div><button onClick={()=>void share("whatsapp")}><MessageCircle size={14}/> WhatsApp</button><button onClick={()=>void share("email")}><Mail size={14}/> E-mail</button><button onClick={()=>void share("copy")}><Link2 size={14}/> Copiar link</button><button onClick={()=>void share("embed")}>&lt;/&gt; Incorporar</button><button onClick={()=>void share("html")}><FileText size={14}/> Baixar HTML</button></div></div>}<label>Nome<input value={selected.name} onChange={e=>update({name:e.target.value})}/></label><label>Mensagem de abertura<textarea value={selected.description} onChange={e=>update({description:e.target.value})}/></label><div className="field-editor"><strong>{formKind==="contato"?"Campos simples e modificáveis":"Dados completos para gerar contrato"}</strong>{effectiveFields.map((field,index)=><div key={`${index}-${field}`}><span>{index+1}</span><input value={field} readOnly={formKind==="fechamento"} onChange={e=>update({fields:selected.fields.map((item,i)=>i===index?e.target.value:item)})}/>{formKind==="contato"&&<button aria-label="Excluir campo" onClick={()=>update({fields:selected.fields.filter((_,i)=>i!==index)})}>×</button>}</div>)}{formKind==="contato"&&<button className="outline-button" onClick={()=>update({fields:[...selected.fields,"Novo campo"]})}><Plus size={15}/> Adicionar campo</button>}</div><div className="builder-footer"><label><input type="checkbox" checked={selected.active} onChange={e=>update({active:e.target.checked})}/> Publicado</label><button className="outline-button" onClick={()=>void share("embed")}>&lt;/&gt; Código para site</button><button className="primary-button" onClick={()=>setNotice("Formulário salvo, publicado e conectado ao fluxo correto.")}><Save size={15}/> Salvar</button></div></div><aside className="form-preview"><span>Prévia do link publicado</span><h3>{selected.name}</h3><p>{selected.description}</p>{effectiveFields.slice(0,5).map(field=><label key={field}>{field}<input placeholder={`Informe ${field.toLowerCase()}`}/></label>)}<button onClick={()=>setNotice(formKind==="contato"?"Contato recebido como Novo lead.":"Fechamento recebido para gerar contrato, agenda e financeiro.")}><Send size={16}/> Enviar informações</button><small>{formKind==="contato"?`Origem: Formulário de contato · ${selected.name}`:`Destino: proposta aprovada → contrato → agenda → financeiro`}</small></aside></div></section>;
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
      place: String(event.locCerimonia || event.locFesta || "Local a confirmar"), mapUrl: String(event.mapUrl || ""), partyPlace: String(event.locFesta || ""), partyMapUrl: String(event.partyMapUrl || ""), brideMakingOf: String(event.bridalMakingOf || ""), groomMakingOf: String(event.groomMakingOf || ""), preWeddingDate: String(event.preWeddingDate || ""), preWeddingTime: String(event.preWeddingTime || ""), preWeddingPlace: String(event.preWeddingPlace || ""), route: String(event.roteiro || ""), tasks: String(event.tasks || ""), companyCost: String(event.companyCost || ""), editingCost: String(event.editingCost || ""), extraCosts: String(event.extraCosts || ""),
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
  const [proposalNotes, setProposalNotes] = useState<Record<string, string>>({});
  const [followedProposals, setFollowedProposals] = useState<Record<string, string>>({});
   const [eventWorkspaceOpen, setEventWorkspaceOpen] = useState(false);
   const [activeEventTab, setActiveEventTab] = useState<"Geral" | "Locais" | "Roteiro" | "Tarefas" | "Equipe" | "Custos">("Geral");
  const [newTeamMember, setNewTeamMember] = useState({ name: "", role: "" });
  const [paymentValues, setPaymentValues] = useState<Record<string, string>>({});
  const [selectedClientId, setSelectedClientId] = useState("");
  const [contractQuery, setContractQuery] = useState("");
  const [agendaYear, setAgendaYear] = useState("todos");
  const [agendaMode, setAgendaMode] = useState<"lista" | "cartoes">("lista");
  const [financePeriod, setFinancePeriod] = useState<"todos" | "30" | "90" | "ano">("todos");
  const [financeClientId, setFinanceClientId] = useState("todos");
  const [financeType, setFinanceType] = useState<"todos" | "entrada" | "saida">("todos");
  const [entryOpen, setEntryOpen] = useState(false);
  const [newFinancialEntry, setNewFinancialEntry] = useState({ type: "entrada", clientId: "", amount: "", date: new Date().toISOString().slice(0, 10), source: "Pix", account: "Conta 1", description: "" });
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
      locCerimonia: openEvent.place, mapUrl: openEvent.mapUrl || "", locFesta: openEvent.partyPlace || "", partyMapUrl: openEvent.partyMapUrl || "",
      bridalMakingOf: openEvent.brideMakingOf || "", groomMakingOf: openEvent.groomMakingOf || "", preWeddingDate: openEvent.preWeddingDate || "", preWeddingTime: openEvent.preWeddingTime || "", preWeddingPlace: openEvent.preWeddingPlace || "",
      services: openEvent.project, roteiro: openEvent.route || "", tasks: openEvent.tasks || "", companyCost: openEvent.companyCost || "", editingCost: openEvent.editingCost || "", extraCosts: openEvent.extraCosts || "",
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
  const financeClients = originalData.clients.map((client) => ({ id: String(client.id), name: String(client.nome || "Cliente") }));
  const paymentEntries = financialItems.filter((payment) => payment.status === "Pago").map((payment) => ({
    id: `pagamento-${String(payment.id)}`, type: "entrada", clientId: payment.clientId, clientName: payment.clientName,
    amount: Number(payment.valor || 0), date: String(payment.dataPagamento || payment.vencimento || ""), source: String(payment.formaPagamento || payment.forma || "Recebimento do contrato"), account: String(payment.conta || "Conta a definir"), description: `Parcela ${String(payment.parcela || "")}`,
  }));
  const registeredEntries = originalData.transactions.map((entry) => ({
    id: String(entry.id), type: String(entry.type || entry.tipo || "saida") === "entrada" ? "entrada" : "saida", clientId: String(entry.clientId || ""), clientName: String(entry.clientName || entry.cliente || "Sem cliente"),
    amount: Number(entry.amount || entry.valor || 0), date: String(entry.date || entry.data || ""), source: String(entry.source || entry.origem || "Não informado"), account: String(entry.account || entry.conta || "Conta a definir"), description: String(entry.description || entry.descricao || "Lançamento financeiro"),
  }));
  const today = new Date();
  const financialLedger = [...paymentEntries, ...registeredEntries].filter((entry) => {
    const entryDate = entry.date ? new Date(`${entry.date.slice(0, 10)}T12:00:00`) : null;
    const age = entryDate ? (today.getTime() - entryDate.getTime()) / 86400000 : Number.POSITIVE_INFINITY;
    const periodMatches = financePeriod === "todos" || (financePeriod === "30" && age <= 30) || (financePeriod === "90" && age <= 90) || (financePeriod === "ano" && entryDate?.getFullYear() === today.getFullYear());
    const clientMatches = financeClientId === "todos" || entry.clientId === financeClientId;
    const typeMatches = financeType === "todos" || entry.type === financeType;
    return periodMatches && clientMatches && typeMatches;
  }).sort((left, right) => String(right.date).localeCompare(String(left.date)));
  const filteredIncome = financialLedger.filter((entry) => entry.type === "entrada").reduce((total, entry) => total + entry.amount, 0);
  const filteredExpenses = financialLedger.filter((entry) => entry.type === "saida").reduce((total, entry) => total + entry.amount, 0);
  const revenueByClient = financeClients.map((client) => ({ ...client, total: financialLedger.filter((entry) => entry.type === "entrada" && entry.clientId === client.id).reduce((total, entry) => total + entry.amount, 0) })).filter((client) => client.total > 0).sort((left, right) => right.total - left.total);
  const saveFinancialEntry = async () => {
    const amount = Number(String(newFinancialEntry.amount).replace(",", "."));
    if (!amount || !newFinancialEntry.date || !newFinancialEntry.source || !newFinancialEntry.account) { setNotice("Preencha valor, data, origem e conta antes de salvar."); return; }
    const client = financeClients.find((item) => item.id === newFinancialEntry.clientId);
    await originalData.createDocument("transactions", { type: newFinancialEntry.type, clientId: client?.id || "", clientName: client?.name || "Sem cliente", amount, date: newFinancialEntry.date, source: newFinancialEntry.source, account: newFinancialEntry.account, description: newFinancialEntry.description, createdAt: new Date().toISOString() });
    setNewFinancialEntry({ type: "entrada", clientId: "", amount: "", date: new Date().toISOString().slice(0, 10), source: "Pix", account: "Conta 1", description: "" });
    setEntryOpen(false); setNotice("Movimentação financeira salva no banco principal.");
  };
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
  if (view === "Entregas") return <DeliverySalesWorkspace setNotice={setNotice} />;
  if (view === "Álbuns") return <AlbumWorkspace setNotice={setNotice} />;
  if (view === "Formulários") return <FormsWorkspace setNotice={setNotice} />;
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

  if (view === "Financeiro") return <section className="finance-layout">
    <div className="section-heading"><div><h2>Financeiro</h2><p>Entradas, saídas e contas de destino em uma leitura simples e por cliente.</p></div><button className="primary-button" onClick={() => setEntryOpen((value) => !value)}><Plus size={17} /> {entryOpen ? "Fechar lançamento" : "Nova movimentação"}</button></div>
    <div className="finance-filters" aria-label="Filtros financeiros"><label>Período<select value={financePeriod} onChange={(event) => setFinancePeriod(event.target.value as typeof financePeriod)}><option value="todos">Todo o período</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="ano">Este ano</option></select></label><label>Cliente<select value={financeClientId} onChange={(event) => setFinanceClientId(event.target.value)}><option value="todos">Todos os clientes</option>{financeClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label><label>Movimentação<select value={financeType} onChange={(event) => setFinanceType(event.target.value as typeof financeType)}><option value="todos">Entradas e saídas</option><option value="entrada">Só entradas</option><option value="saida">Só saídas</option></select></label></div>
    {entryOpen && <form className="financial-entry-form" onSubmit={(event) => { event.preventDefault(); void saveFinancialEntry(); }}><label>Tipo<select value={newFinancialEntry.type} onChange={(event) => setNewFinancialEntry((current) => ({ ...current, type: event.target.value }))}><option value="entrada">Entrada</option><option value="saida">Saída</option></select></label><label>Cliente <small>(opcional para saída geral)</small><select value={newFinancialEntry.clientId} onChange={(event) => setNewFinancialEntry((current) => ({ ...current, clientId: event.target.value }))}><option value="">Sem cliente</option>{financeClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label><label>Valor (R$)<input inputMode="decimal" value={newFinancialEntry.amount} onChange={(event) => setNewFinancialEntry((current) => ({ ...current, amount: event.target.value }))} placeholder="0,00" /></label><label>Data<input type="date" value={newFinancialEntry.date} onChange={(event) => setNewFinancialEntry((current) => ({ ...current, date: event.target.value }))} /></label><label>Origem / forma<select value={newFinancialEntry.source} onChange={(event) => setNewFinancialEntry((current) => ({ ...current, source: event.target.value }))}><option>Pix</option><option>Transferência</option><option>Dinheiro</option><option>Cartão</option><option>Boleto</option><option>Fornecedor</option><option>Despesa operacional</option><option>Outro</option></select></label><label>Conta de entrada/saída<select value={newFinancialEntry.account} onChange={(event) => setNewFinancialEntry((current) => ({ ...current, account: event.target.value }))}><option>Conta 1</option><option>Conta 2</option><option>Caixa</option><option>Cartão da empresa</option><option>Conta pessoal</option></select></label><label className="financial-entry-note">Descrição<input value={newFinancialEntry.description} onChange={(event) => setNewFinancialEntry((current) => ({ ...current, description: event.target.value }))} placeholder="Ex.: sinal do contrato, aluguel de equipamento…" /></label><div className="new-event-actions"><button type="button" className="outline-button" onClick={() => setEntryOpen(false)}>Cancelar</button><button className="primary-button" disabled={originalData.saving} type="submit"><Save size={16} /> Salvar movimentação</button></div></form>}
    <div className="money-summary"><article><span>Entradas no filtro</span><strong>R$ {filteredIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong><small>{financialLedger.filter((entry) => entry.type === "entrada").length} lançamento(s)</small></article><article className="expense-summary"><span>Saídas no filtro</span><strong>R$ {filteredExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong><small>{financialLedger.filter((entry) => entry.type === "saida").length} lançamento(s)</small></article><article className="money-action"><WalletCards size={22} /><strong>Saldo do período</strong><p>R$ {(filteredIncome - filteredExpenses).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></article></div>
    <div className="finance-detail-grid"><section className="simple-ledger"><div className="section-heading"><div><h2>Movimentações</h2><p>Veja a origem e a conta usada em cada lançamento.</p></div></div>{financialLedger.length ? financialLedger.map((entry) => <div className={`ledger-row ${entry.type === "saida" ? "is-expense" : ""}`} key={entry.id}><ReceiptText size={19} /><div><strong>{entry.description}</strong><span>{entry.clientName} · {entry.date || "Data não informada"}</span><small>{entry.source} → {entry.account}</small></div><b>{entry.type === "saida" ? "−" : "+"} R$ {entry.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</b><span className={`finance-type ${entry.type}`}>{entry.type}</span></div>) : <div className="availability-note"><CheckCircle2 size={18} /><span>Nenhuma movimentação no filtro escolhido.</span></div>}</section><aside className="client-revenue"><h2>Faturamento por cliente</h2><p>Entradas recebidas no período e filtros selecionados.</p>{revenueByClient.length ? revenueByClient.map((client) => <button key={client.id} onClick={() => setFinanceClientId(client.id)}><span><strong>{client.name}</strong><small>Ver só este cliente</small></span><b>R$ {client.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</b></button>) : <p className="empty-finance">Ainda não há entradas para separar por cliente.</p>}<div className="pending-finance"><strong>Em aberto</strong><span>R$ {pendingTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span><small>{pendingItems.length} parcela(s) pendente(s) no banco principal.</small></div></aside></div>
  </section>;

  if (view === "Contratos") {
    const searchedContracts = records.filter((event) => (event.contractUrl || event.integrationId || event.contractSigned) && `${event.title} ${event.client} ${event.date} ${event.project}`.toLowerCase().includes(contractQuery.toLowerCase()));
    return <section className="orders-layout"><div className="section-heading"><div><h2>Contratos e fichas</h2><p>Somente clientes com contrato aparecem aqui.</p></div><div className="actions"><label className="primary-button contract-upload"><Paperclip size={16} /> Importar contrato<input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={originalData.saving} onChange={async (changeEvent) => { const file = changeEvent.target.files?.[0]; if (!file) return; try { const id = await originalData.createDocument("events", { title: file.name.replace(/\.(pdf|docx?)$/i, ""), date: "", time: "", locCerimonia: "", status: "Pendente", team: [], services: "Contrato importado manualmente", createdAt: new Date().toISOString() }); await originalData.uploadContract(file, id); setOpenEventId(id); setNotice("Contrato importado. Abra a ficha para completar cliente, data e local."); } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível importar o contrato."); } finally { changeEvent.currentTarget.value = ""; } }} /></label><label className="search-field"><Search size={16} /><input value={contractQuery} onChange={(event) => setContractQuery(event.target.value)} placeholder="Buscar cliente, data ou ficha" /></label></div></div><div className="document-flow"><article><FileText size={23} /><h3>{searchedContracts.length} fichas</h3><p>Contratos recebidos ou importados.</p></article><ChevronRight /><article><ClipboardList size={23} /><h3>Arquivos</h3><p>PDF, DOC, assinatura e valores.</p></article><ChevronRight /><article><ReceiptText size={23} /><h3>Histórico</h3><p>Cliente, data e pagamento em um só lugar.</p></article></div><div className="contract-directory">{searchedContracts.length ? searchedContracts.map((event) => <article key={event.id} className="contract-row"><div><strong>{event.client}</strong><span>{event.title} · {event.date} · {event.time}</span><small>{event.project}</small></div><div><span className="stage-pill">{event.contractSigned ? "Assinado" : event.contract}</span><b>{event.value}</b></div><button className="outline-button" onClick={() => { setOpenEventId(event.id); setNotice(`Ficha localizada: ${event.title}. Abra Agenda para editar todos os dados.`); }}>Localizar ficha <ChevronRight size={15} /></button><button className="outline-button" disabled={originalData.saving} onClick={() => void moveToTrash(event)}><Trash2 size={15} /> Lixeira</button>{event.contractUrl && <a className="outline-button" href={event.contractUrl} target="_blank" rel="noreferrer">Abrir <ExternalLink size={15} /></a>}</article>) : <div className="availability-note"><FileText size={18} /><span>Nenhum contrato cadastrado. Eventos sem contrato ficam ocultos nesta aba.</span></div>}</div></section>;
  }
  const receivedProposals = flowRequests.filter((request) => request.status !== "Lixeira" && String(request.tipoRecebido || "proposal") !== "contract");
  return <section className="orders-layout"><div className="section-heading"><div><h2>Propostas · Recebidas</h2><p>Respostas recebidas por link publicado, HTML baixado ou envio direto do Flow.</p></div><button className="primary-button" onClick={() => setNotice("Novo documento preparado para o fluxo do Gerador.")}><Plus size={17} /> Criar proposta</button></div><div className="document-flow"><article><FileText size={23} /><h3>1. Proposta</h3><p>Cliente escolhe itens no Gerador.</p></article><ChevronRight /><article><ClipboardList size={23} /><h3>2. Recebida</h3><p>A origem e os dados ficam registrados.</p></article><ChevronRight /><article><ReceiptText size={23} /><h3>3. Contrato</h3><p>Ao virar contrato, cria agenda e financeiro.</p></article></div><div className="contract-directory">{receivedProposals.length ? receivedProposals.map((request) => { const id=String(request.id); const contractor = (request.dadosContratante || {}) as Record<string, unknown>; const eventData = (request.dadosEvento || {}) as Record<string, unknown>; const commercial = (request.dadosComerciais || {}) as Record<string, unknown>; const name=String(contractor.nome || "Cliente"); const phone=String(contractor.whatsapp || contractor.telefone || ""); const sourceUrl = String(request.sourceUrl || ""); const followupMessage=`Olá, ${name}! Gostaria de saber se conseguiu analisar nossa proposta${eventData.data ? ` para ${String(eventData.data)}` : ""}. Ficamos à disposição para ajustar qualquer detalhe.`; return <article key={id} className="contract-row proposal-received-row"><div><strong>{name}</strong><span>{String(request.tipoEvento || "Evento")} · {String(eventData.data || "Data a confirmar")}</span><small>{String(eventData.local || eventData.endereco || "Local a confirmar")} · {String(commercial.servico || "Serviço a confirmar")}</small></div><div><span className="stage-pill">{String(request.sourceFormat || "Recebida do Flow")}</span><small>{String(request.origem || "Studio Melk Flow")}</small><b>{Number(commercial.valorTotal || 0) ? `R$ ${Number(commercial.valorTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Valor a confirmar"}</b></div><div className="proposal-data-panel"><strong>Dados do cliente</strong><span><Phone size={13}/> {phone || "Telefone não informado"}</span><span><Mail size={13}/> {String(contractor.email || "E-mail não informado")}</span></div><div className="proposal-followup"><button className="outline-button" disabled={!phone} onClick={() => { const normalized=phone.replace(/\\D/g, ""); window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(followupMessage)}`, "_blank", "noopener,noreferrer"); const stamp=new Date().toLocaleString("pt-BR"); setFollowedProposals((all)=>({...all,[id]:stamp})); setNotice(`Follow-up preparado para ${name}.`); }}><MessageCircle size={15}/> {followedProposals[id] ? "Follow-up enviado" : "Follow-up WhatsApp"}</button>{sourceUrl && <a className="outline-button" href={sourceUrl} target="_blank" rel="noreferrer">Origem <ExternalLink size={15} /></a>}</div><label className="proposal-notes"><Pencil size={14}/><span>Anotações de progresso</span><textarea value={proposalNotes[id] ?? String(request.anotacoes || "")} onChange={(event)=>setProposalNotes((all)=>({...all,[id]:event.target.value}))} onBlur={()=>void originalData.patchDocument("solicitacoes", id, { anotacoes: proposalNotes[id] ?? "", atualizadoEm: new Date().toISOString() })} placeholder="Ex.: liguei, aguardando retorno, pediu ajuste..." /></label><button className="outline-button" disabled={originalData.saving} onClick={() => void moveFlowRequestToTrash(request as Record<string, unknown>)}><Trash2 size={15} /> Lixeira</button></article>; }) : <div className="availability-note"><FileText size={18} /><span>As propostas enviadas pelo Flow aparecerão aqui.</span></div>}</div></section>;
}
