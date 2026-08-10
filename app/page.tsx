"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight, CalendarDays, Check, ChevronRight, CircleDollarSign,
  ClipboardList, FileText, LayoutDashboard, MessageCircle, Plus,
  Search, ShieldCheck, Sparkles, UsersRound, MapPin, UserRoundCheck,
  ReceiptText, WalletCards, ExternalLink, CheckCircle2, Clock3, Pencil, Paperclip, Share2, Mail, Phone, UserRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { leadStages, type LeadStage } from "../lib/lead-intake";
import { importReadiness } from "../lib/solicitacao-normalizer";
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
  [ClipboardList, "Pedidos"], [CalendarDays, "Agenda"], [UserRoundCheck, "Equipe"],
  [CircleDollarSign, "Financeiro"], [ShieldCheck, "Importação"],
];

export default function Page() {
  const originalData = useOriginalStudioData();
  const [leads, setLeads] = useState(initialLeads);
  const [query, setQuery] = useState("");
  const [activeView, setActiveView] = useState("Visão geral");
  const [selectedId, setSelectedId] = useState(initialLeads[0].id);
  const [accessKey, setAccessKey] = useState("");
  const [notice, setNotice] = useState("A integração do Gerador será recebida aqui, sem gravar no banco atual.");
  const selected = leads.find((lead) => lead.id === selectedId) ?? leads[0];
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
        if (imported.length) { setLeads(imported); setSelectedId(imported[0].id); }
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
        source: "Gerador" as const,
        stage: (request.status === "Pendente" ? "Novo lead" : "Qualificado") as LeadStage,
        event: String(request.tipoEvento || "Evento a confirmar"),
        date: String(eventData.data || "Data a confirmar"),
        value: rawValue ? `R$ ${rawValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Valor a confirmar",
        next: request.status === "Pendente" ? "Revisar solicitação" : "Abrir cadastro",
        tone: ["rose", "teal", "violet", "gold", "blue"][index % 5],
        email: String(contractor.email || ""), phone: String(contractor.whatsapp || ""),
        service: String(commercial.servico || ""), venue: String(eventData.local || eventData.localFesta || ""),
      } satisfies Lead;
    });
    setLeads(sourceLeads);
    setSelectedId(sourceLeads[0].id);
    setNotice(`${sourceLeads.length} solicitações reais carregadas do banco principal do Studio Melk.`);
  }, [originalData.requests]);

  function advanceLead() {
    const position = leadStages.indexOf(selected.stage);
    const nextStage = leadStages[Math.min(position + 1, leadStages.length - 1)];
    setLeads((all) => all.map((lead) => lead.id === selected.id ? { ...lead, stage: nextStage, next: "Etapa atualizada agora" } : lead));
    setNotice(`${selected.name} avançou para “${nextStage}” nesta demonstração.`);
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
          <div className="safe-note"><ShieldCheck size={16} /><span>Ambiente de desenvolvimento<br /><small>produção preservada</small></span></div>
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
                return <div className="stage" key={stage}><div className="stage-title"><span>{stage}</span><b>{stageLeads.length}</b></div>
                  {stageLeads.length ? stageLeads.map((lead) => <button key={lead.id} className="lead-card" onClick={() => setSelectedId(lead.id)}>
                    <span className={`avatar ${lead.tone}`}>{lead.initials}</span><span><strong>{lead.name}</strong><small>{lead.event}</small><i>{lead.value}</i></span>
                  </button>) : <div className="empty-stage">Sem leads nesta etapa</div>}
                </div>;
              })}
            </div>
          </div>

          <aside className="detail-panel" aria-label="Detalhe do lead selecionado">
            <div className="detail-top"><span className={`avatar large ${selected.tone}`}>{selected.initials}</span><button className="icon-button small" aria-label="Mais opções">•••</button></div>
            <h2>{selected.name}</h2><p className="lead-id">{selected.id} · chegou por {selected.source}</p>
            <div className="stage-status"><span>Etapa atual</span><strong>{selected.stage}</strong></div>
            <dl><div><dt>Evento</dt><dd>{selected.event}</dd></div><div><dt>Data prevista</dt><dd>{selected.date}</dd></div><div><dt>Proposta</dt><dd>{selected.value}</dd></div><div><dt>Próxima ação</dt><dd>{selected.next}</dd></div></dl>
            <div className="timeline"><h3>Atividade recente</h3><p><span className="dot" />Lead criado a partir de {selected.source.toLowerCase()}<small>Hoje, 10:24</small></p><p><span className="dot muted" />Dados do evento organizados<small>Hoje, 10:25</small></p></div>
            <button className="primary-button full" onClick={advanceLead}>Avançar no funil <ChevronRight size={17} /></button>
          </aside>
        </section>

        <section className="leads-table-section">
          <div className="section-heading"><div><h2>Leads recentes</h2><p>Base de trabalho da equipe comercial.</p></div><label className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar lead, evento ou origem" /></label></div>
          <div className="table-wrap"><table><thead><tr><th>Lead</th><th>Origem</th><th>Etapa</th><th>Evento</th><th>Próxima ação</th></tr></thead><tbody>
            {filtered.map((lead) => <tr key={lead.id} onClick={() => setSelectedId(lead.id)} className={selected.id === lead.id ? "row-selected" : ""}><td><span className={`avatar table-avatar ${lead.tone}`}>{lead.initials}</span><strong>{lead.name}</strong></td><td>{lead.source}</td><td><span className="stage-pill">{lead.stage}</span></td><td>{lead.date}</td><td>{lead.next}<ChevronRight size={15} /></td></tr>)}
          </tbody></table></div>
        </section>
        </> : activeView === "Importação" ? <ImportWorkspace setNotice={setNotice} onUnlock={setAccessKey} originalData={originalData} /> : <OperationsWorkspace view={activeView} setNotice={setNotice} leads={leads} originalData={originalData} />}
      </section>
    </main>
  );
}

type OperationsWorkspaceProps = { view: string; setNotice: (message: string) => void; leads: Lead[]; originalData: OriginalStudioData };

function ImportWorkspace({ setNotice, onUnlock, originalData }: { setNotice: (message: string) => void; onUnlock: (password: string) => void; originalData: OriginalStudioData }) {
  const [password, setPassword] = useState("");
  return <section className="import-layout">
    <div className="section-heading"><div><h2>Banco principal conectado</h2><p>Leitura direta do Firebase usado pelo aplicativo anterior, sem alterar seus registros.</p></div><span className="stage-pill">Dados reais</span></div>
    <div className="import-summary"><article><span>Origem conectada</span><strong>Studio Melk · Firebase principal</strong><small>{originalData.error ? "Conexão precisa de revisão" : "Conexão automática ativa"}</small></article><article><span>Dados localizados</span><strong>{originalData.events.length} eventos · {originalData.clients.length} clientes</strong><small>{originalData.orders.length} pedidos e {originalData.transactions.length} movimentações</small></article><article><span>Equipe e solicitações</span><strong>{originalData.teamMembers.length} profissionais · {originalData.requests.length} leads</strong><small>O aplicativo anterior permanece preservado</small></article></div>
    <div className="import-checklist"><h3>Campos prontos para o fluxo</h3><p>O conversor já reconhece a estrutura usada pelo Gerador.</p><div>{importReadiness.fieldsReady.map((field) => <span key={field}><CheckCircle2 size={16} /> {field}</span>)}</div></div>
    <div className="import-next"><ShieldCheck size={22} /><div><h3>{originalData.loading ? "Carregando banco principal" : "Banco principal disponível"}</h3><p>{originalData.error ? `Falha de leitura: ${originalData.error}` : "Não é necessária uma senha adicional. Os dados são autenticados pelo mesmo Firebase do aplicativo anterior."}</p></div></div>
  </section>;
}

type EventRecord = { id: string; title: string; date: string; time: string; place: string; status: string; client: string; email: string; phone: string; project: string; value: string; team: { role: string; person: string }[]; contract: "Link do CRM" | "PDF anexado" | "Pendente"; paid: string; remaining: string };
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

function OperationsWorkspace({ view, setNotice, leads, originalData }: OperationsWorkspaceProps) {
  const importedRecords: EventRecord[] = leads.filter((lead) => lead.source === "Gerador").map((lead) => ({
    id: `project-${lead.id}`, title: lead.event, date: lead.date, time: "Horário a confirmar", place: lead.venue || "Local a confirmar", status: lead.stage === "Aceita" ? "Confirmado" : "Pendente",
    client: lead.name, email: lead.email || "E-mail não informado", phone: lead.phone || "Telefone não informado", project: lead.service || "Serviço a confirmar", value: lead.value,
    team: [{ role: "Fotografia", person: "A definir" }, { role: "Vídeo", person: "A definir" }], contract: "Pendente", paid: "—", remaining: lead.value,
  }));
  const originalRecords: EventRecord[] = originalData.events.map((event) => {
    const client = originalData.clients.find((item) => item.id === event.clientId);
    const order = originalData.orders.find((item) => item.clientId === event.clientId);
    const payments = Array.isArray(client?.pagamentos) ? client.pagamentos as Array<Record<string, unknown>> : [];
    const paidValue = payments.filter((payment) => payment.status === "Pago").reduce((total, payment) => total + Number(payment.valor || 0), 0);
    const totalValue = Number(order?.valorTotal || 0);
    const team = Array.isArray(event.team) ? event.team as Array<Record<string, unknown>> : [];
    return {
      id: String(event.id), title: String(event.title || "Evento sem título"),
      date: event.date ? new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(new Date(`${event.date}T12:00:00`)) : "Data a confirmar",
      time: String(event.time || "Horário a confirmar"),
      place: String(event.locCerimonia || event.locFesta || "Local a confirmar"),
      status: String(event.status || "Pendente"), client: String(client?.nome || event.title || "Cliente não informado"),
      email: String(client?.email || "E-mail não informado"), phone: String(client?.whatsapp || "Telefone não informado"),
      project: String(order?.servicos || event.services || "Projeto não informado"),
      value: totalValue ? `R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Valor não informado",
      team: team.length ? team.map((member) => ({ role: String(member.role || "Equipe"), person: String(member.name || "A definir") })) : [{ role: "Equipe", person: "A definir" }],
      contract: order ? "Link do CRM" : "Pendente",
      paid: paidValue ? `R$ ${paidValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Não informado",
      remaining: totalValue ? `R$ ${Math.max(0, totalValue - paidValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Não informado",
    };
  });
  const baseRecords: EventRecord[] = originalRecords.length ? originalRecords : [...recoveredEventRecords, ...importedRecords];
  const [openEventId, setOpenEventId] = useState(baseRecords[0]?.id ?? events[0].id);
  const [featuredEvents, setFeaturedEvents] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [eventEdits, setEventEdits] = useState<Record<string, Partial<EventRecord>>>({});
  const records = baseRecords.map((event) => ({ ...event, ...eventEdits[event.id] }));
  const openEvent = records.find((event) => event.id === openEventId) ?? records[0];
  const updateOpenEvent = (field: keyof EventRecord, value: string) => {
    if (!openEvent) return;
    setEventEdits((all) => ({ ...all, [openEvent.id]: { ...all[openEvent.id], [field]: value } }));
  };
  const shareEvent = async (event: EventRecord) => {
    const text = `${event.title}\n${event.date} · ${event.time}\n${event.place}\nEquipe: ${event.team.map((member) => `${member.role}: ${member.person}`).join(" · ")}`;
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
  if (view === "Agenda") return <section className="operations-grid">
    <div className="operations-main"><div className="section-heading"><div><h2>Agenda de produção</h2><p>Um evento, uma equipe e um lugar para tudo.</p></div><button className="primary-button" onClick={() => setNotice("Novo evento será criado no ambiente de desenvolvimento.")}><Plus size={17} /> Novo evento</button></div>
      <div className="agenda-list">{records.map((event) => <article className={`event-card ${openEventId === event.id ? "is-open" : ""} ${featuredEvents.includes(event.id) ? "is-featured" : ""}`} key={event.id} onClick={() => { setOpenEventId(event.id); setEditing(false); }}><div className="event-date"><strong>{event.date.split(", ")[1] || event.date}</strong><span>{event.date.split(", ")[0] || "Projeto"}</span></div><div className="event-copy"><div className="event-kicker"><span className={`status-dot ${event.status.toLowerCase()}`}>{event.status}</span>{featuredEvents.includes(event.id) && <span className="featured-label">Em destaque</span>}</div><h3>{event.title}</h3><p><Clock3 size={15} /> {event.time} <span /> <MapPin size={15} /> {event.place}</p><div className="assignment-row">{event.team.map(({role,person}) => <span key={`${role}-${person}`}><UserRoundCheck size={14} /> {role}: {person}</span>)}</div><div className="event-health"><span><UsersRound size={14} /> {event.team.length} atribuições</span><span><FileText size={14} /> {event.contract}</span><span><CircleDollarSign size={14} /> {event.paid === "Não informado" ? "Financeiro a configurar" : `Pago: ${event.paid}`}</span></div></div><div className="event-actions"><button className="outline-button" aria-pressed={featuredEvents.includes(event.id)} onClick={(e) => { e.stopPropagation(); setFeaturedEvents((items) => items.includes(event.id) ? items.filter((id) => id !== event.id) : [...items, event.id]); }}>{featuredEvents.includes(event.id) ? "Remover destaque" : "Destacar"}</button><button className="outline-button" onClick={(e) => { e.stopPropagation(); void shareEvent(event); }}><Share2 size={16} /> Compartilhar</button><button className="text-button" onClick={(e) => { e.stopPropagation(); setOpenEventId(event.id); setEditing(false); }}>Abrir ficha <ChevronRight size={16} /></button></div></article>)}</div>
    </div><aside className="task-panel event-sheet"><div className="sheet-heading"><div><span>Ficha completa do projeto</span><h2>{openEvent.title}</h2></div><button className={`sheet-close ${editing ? "is-editing" : ""}`} onClick={() => setEditing(!editing)} aria-label="Editar ficha" aria-pressed={editing}><Pencil size={15} /></button></div><div className="sheet-summary"><span>{openEvent.status}</span><span>{openEvent.team.length} pessoas na equipe</span><span>{openEvent.contract}</span></div>{editing && <form className="edit-form" onSubmit={(event) => { event.preventDefault(); setEditing(false); setNotice("Ficha atualizada nesta prévia. A gravação permanente entra com o banco unificado."); }}><div className="edit-form-heading"><Pencil size={15} /><span>Editar ficha nesta prévia</span></div><label>Nome do projeto<input value={openEvent.title} onChange={(event) => updateOpenEvent("title", event.target.value)} /></label><label>Cliente ou casal<input value={openEvent.client} onChange={(event) => updateOpenEvent("client", event.target.value)} /></label><div className="form-pair"><label>Data<input value={openEvent.date} onChange={(event) => updateOpenEvent("date", event.target.value)} /></label><label>Horário<input value={openEvent.time} onChange={(event) => updateOpenEvent("time", event.target.value)} /></label></div><label>Local<input value={openEvent.place} onChange={(event) => updateOpenEvent("place", event.target.value)} /></label><label>Projeto contratado<input value={openEvent.project} onChange={(event) => updateOpenEvent("project", event.target.value)} /></label><button className="save-preview-button" type="submit"><Check size={16} /> Concluir edição</button></form>}<div className="sheet-section"><strong>Cliente e casal</strong><p><UserRound size={16} /> {openEvent.client}</p><p><Mail size={16} /> {openEvent.email}</p><p><Phone size={16} /> {openEvent.phone}</p><div className="sheet-actions"><button className="sheet-button" onClick={() => setNotice("Área do cliente preparada: pagamentos, contrato, histórico e próximos agendamentos.")}>Área do cliente</button><button className="sheet-button" onClick={() => setNotice("Novo ensaio preparado na ficha; será confirmado ao ligar o calendário e o banco.")}>Agendar ensaio</button></div></div><div className="sheet-section"><strong>Projeto contratado</strong><p><ClipboardList size={16} /> {openEvent.project}</p><p><CircleDollarSign size={16} /> {openEvent.value}</p><p><CalendarDays size={16} /> {openEvent.date}, {openEvent.time}</p><p><MapPin size={16} /> {openEvent.place}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(openEvent.place)}`} target="_blank" rel="noreferrer">Abrir no Google Maps <ExternalLink size={14} /></a></div><div className="sheet-section"><strong>Equipe e atribuições</strong>{openEvent.team.map(({role,person}) => <p key={`${role}-${person}`}><UserRoundCheck size={16} /> <b>{role}:</b> {person}</p>)}<button className="sheet-button" onClick={() => setNotice("Atribuições da equipe serão editáveis junto do banco unificado.")}>Editar equipe</button></div><div className="sheet-section"><strong>Contrato e pagamentos</strong><p><FileText size={16} /> Contrato: {openEvent.contract}</p><p><CheckCircle2 size={16} /> Já pago: {openEvent.paid}</p><p><Clock3 size={16} /> Falta receber: {openEvent.remaining}</p><div className="sheet-actions"><button className="sheet-button" onClick={() => setNotice("Contrato: a ficha aceitará link do CRM ou PDF quando o armazenamento estiver conectado.")}>Abrir contrato</button><button className="sheet-button" onClick={() => setNotice("Anexo preparado: o PDF será guardado no banco unificado, não apenas neste navegador.")}><Paperclip size={14} /> Anexar PDF</button></div></div><button className="share-sheet" onClick={() => void shareEvent(openEvent)}><Share2 size={18} /> Compartilhar dados com equipe</button></aside>
  </section>;

  if (view === "Equipe") { const actualTeam = originalData.teamMembers.length ? originalData.teamMembers.map((member) => String(member.name || member.nome || "Profissional")) : [...recoveredTeam]; return <section className="team-layout"><div className="section-heading"><div><h2>Equipe e disponibilidade</h2><p>Profissionais carregados do banco principal.</p></div><button className="primary-button" onClick={() => setNotice("Cadastro de profissional será gravado no banco principal após a etapa de escrita segura.")}><Plus size={17} /> Adicionar pessoa</button></div><div className="team-grid">{actualTeam.map((name, index) => { const assignments = originalRecords.flatMap((event) => event.team).filter((member) => member.person === name); const roles = [...new Set(assignments.map((member) => member.role))].join(" e ") || "Função a definir"; return <article className="member-card" key={`${name}-${index}`}><span className={`avatar large ${["rose","teal","violet","gold","blue"][index % 5]}`}>{name.slice(0,1)}</span><div><h3>{name}</h3><p>{roles}</p></div><strong>{assignments.length} atribuições no banco</strong><button className="outline-button" onClick={() => setNotice(`Agenda de ${name} aberta com ${assignments.length} atribuições.`)}><CalendarDays size={15} /> Ver agenda</button></article>; })}</div><div className="availability-note"><UserRoundCheck size={18} /><span><strong>Regra simples:</strong> se a pessoa já estiver em outro evento no mesmo horário, o sistema avisa antes de confirmar.</span></div></section>; }

  if (view === "Financeiro") return <section className="finance-layout"><div className="section-heading"><div><h2>Financeiro simples</h2><p>Veja só o que entrou, o que falta entrar e o próximo passo.</p></div><button className="primary-button" onClick={() => setNotice("Recebimento registrado somente nesta demonstração.")}><Plus size={17} /> Registrar recebimento</button></div><div className="money-summary"><article><span>Já entrou</span><strong>R$ 6.200</strong><small>Pagamentos confirmados</small></article><article><span>Falta receber</span><strong>R$ 12.450</strong><small>Próximas parcelas e sinais</small></article><article className="money-action"><WalletCards size={22} /><strong>Próximo passo</strong><p>Enviar lembrete de pagamento antes do evento.</p></article></div><div className="simple-ledger"><div className="section-heading"><div><h2>O que precisa da sua atenção</h2><p>Sem termos contábeis.</p></div></div>{[{title:"Sinal do evento",value:"R$ 1.680",when:"Vence em 2 dias",state:"Cobrar"},{title:"Recibo pronto para enviar",value:"R$ 2.200",when:"Pagamento confirmado",state:"Enviar"},{title:"Parcela do contrato",value:"R$ 3.400",when:"Vence na próxima semana",state:"Lembrar"}].map((item) => <div className="ledger-row" key={item.title}><ReceiptText size={19} /><div><strong>{item.title}</strong><span>{item.when}</span></div><b>{item.value}</b><button className="outline-button" onClick={() => setNotice(`${item.state}: fluxo de teste preparado.`)}>{item.state}</button></div>)}</div></section>;

  return <section className="orders-layout"><div className="section-heading"><div><h2>{view === "Pedidos" ? "Pedidos e contratos" : "Propostas"}</h2><p>Uma trilha clara, sem duplicar informações.</p></div><button className="primary-button" onClick={() => setNotice("Novo documento preparado para o fluxo do Gerador.")}><Plus size={17} /> Criar {view === "Pedidos" ? "pedido" : "proposta"}</button></div><div className="document-flow"><article><FileText size={23} /><h3>1. Proposta</h3><p>Cliente escolhe itens no Gerador.</p></article><ChevronRight /><article><ClipboardList size={23} /><h3>2. Pedido</h3><p>Itens e valor ficam organizados.</p></article><ChevronRight /><article><ReceiptText size={23} /><h3>3. Contrato e recibo</h3><p>Assinatura e pagamento viram histórico.</p></article></div><div className="document-table"><div><strong>Pronto para o próximo passo</strong><span>Proposta recebida pelo fluxo de teste</span></div><button className="outline-button" onClick={() => setNotice("Abrir proposta: integração com o Gerador será o próximo passo.")}>Abrir <ExternalLink size={15} /></button></div></section>;
}
