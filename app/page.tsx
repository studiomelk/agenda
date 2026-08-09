"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight, CalendarDays, Check, ChevronRight, CircleDollarSign,
  ClipboardList, FileText, LayoutDashboard, MessageCircle, Plus,
  Search, ShieldCheck, Sparkles, UsersRound, MapPin, UserRoundCheck,
  ReceiptText, WalletCards, ExternalLink, CheckCircle2, Clock3
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { leadStages, type LeadStage } from "../lib/lead-intake";
import { importReadiness } from "../lib/solicitacao-normalizer";

type Lead = {
  id: string;
  name: string;
  initials: string;
  source: "Proposta" | "WhatsApp" | "Formulário";
  stage: LeadStage;
  event: string;
  date: string;
  value: string;
  next: string;
  tone: string;
};

const initialLeads: Lead[] = [
  { id: "L-024", name: "Nathalia & Victor", initials: "NV", source: "Proposta", stage: "Proposta enviada", event: "Casamento · Campinas", date: "18 out 2026", value: "R$ 8.400", next: "Retornar amanhã", tone: "rose" },
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
  const [leads, setLeads] = useState(initialLeads);
  const [query, setQuery] = useState("");
  const [activeView, setActiveView] = useState("Visão geral");
  const [selectedId, setSelectedId] = useState(initialLeads[0].id);
  const [notice, setNotice] = useState("A integração do Gerador será recebida aqui, sem gravar no banco atual.");
  const selected = leads.find((lead) => lead.id === selectedId) ?? leads[0];
  const filtered = useMemo(() => leads.filter((lead) =>
    `${lead.name} ${lead.event} ${lead.source}`.toLowerCase().includes(query.toLowerCase())), [leads, query]);
  const activeStages: LeadStage[] = ["Novo lead", "Qualificado", "Proposta enviada", "Negociação", "Aceita"];

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
        </> : activeView === "Importação" ? <ImportWorkspace setNotice={setNotice} /> : <OperationsWorkspace view={activeView} setNotice={setNotice} />}
      </section>
    </main>
  );
}

type OperationsWorkspaceProps = { view: string; setNotice: (message: string) => void };

function ImportWorkspace({ setNotice }: { setNotice: (message: string) => void }) {
  return <section className="import-layout">
    <div className="section-heading"><div><h2>Importação protegida</h2><p>Seus dados reais ficam no Firebase; esta tela só mostra o que está pronto para migrar.</p></div><span className="stage-pill">Cópia de teste</span></div>
    <div className="import-summary"><article><span>Origem conectada</span><strong>{importReadiness.source}</strong><small>Leitura conferida em 9 de agosto</small></article><article><span>Registros encontrados</span><strong>{importReadiness.recordsFound} solicitações</strong><small>Sem alteração no aplicativo atual</small></article><article><span>Destino</span><strong>Manager Next · staging</strong><small>Banco separado antes da publicação</small></article></div>
    <div className="import-checklist"><h3>Campos prontos para o fluxo</h3><p>O conversor já reconhece a estrutura usada pelo Gerador.</p><div>{importReadiness.fieldsReady.map((field) => <span key={field}><CheckCircle2 size={16} /> {field}</span>)}</div></div>
    <div className="import-next"><ShieldCheck size={22} /><div><h3>Próximo passo seguro</h3><p>Criar o banco privado de staging e importar as solicitações sem expor nomes, contatos ou contratos no site público.</p></div><button className="primary-button" onClick={() => setNotice("Banco de staging será conectado antes de importar os dados reais.")}>Preparar staging <ChevronRight size={17} /></button></div>
  </section>;
}

const events = [
  { id: "E-102", title: "Casamento · evento confirmado", date: "Sáb, 22 ago", time: "16:15", place: "Local confirmado", team: ["Foto", "Vídeo"], status: "Confirmado" },
  { id: "E-103", title: "Casamento · aguardando equipe", date: "Sáb, 12 set", time: "15:30", place: "Local confirmado", team: ["Foto", "Vídeo", "Edição"], status: "Atenção" },
  { id: "E-104", title: "Ensaio · proposta aceita", date: "Sex, 03 out", time: "09:00", place: "Local a combinar", team: ["Foto"], status: "Pendente" },
];

function OperationsWorkspace({ view, setNotice }: OperationsWorkspaceProps) {
  const [openEventId, setOpenEventId] = useState(events[0].id);
  const [featuredEvents, setFeaturedEvents] = useState<string[]>([events[0].id]);
  const openEvent = events.find((event) => event.id === openEventId) ?? events[0];
  if (view === "Agenda") return <section className="operations-grid">
    <div className="operations-main"><div className="section-heading"><div><h2>Agenda de produção</h2><p>Um evento, uma equipe e um lugar para tudo.</p></div><button className="primary-button" onClick={() => setNotice("Novo evento será criado no ambiente de desenvolvimento.")}><Plus size={17} /> Novo evento</button></div>
      <div className="agenda-list">{events.map((event) => <article className={`event-card ${featuredEvents.includes(event.id) ? "is-featured" : ""}`} key={event.id} onClick={() => setOpenEventId(event.id)}><div className="event-date"><strong>{event.date.split(", ")[1]}</strong><span>{event.date.split(", ")[0]}</span></div><div className="event-copy"><span className={`status-dot ${event.status.toLowerCase()}`}>{event.status}</span><h3>{event.title}</h3><p><Clock3 size={15} /> {event.time} <span /> <MapPin size={15} /> {event.place}</p><div className="assignment-row">{event.team.map((role) => <span key={role}><UserRoundCheck size={14} /> {role}</span>)}</div></div><div className="event-actions"><button className="outline-button" onClick={(e) => { e.stopPropagation(); setFeaturedEvents((items) => items.includes(event.id) ? items.filter((id) => id !== event.id) : [...items, event.id]); }}>{featuredEvents.includes(event.id) ? "Em destaque" : "Destacar"}</button><button className="outline-button" onClick={(e) => { e.stopPropagation(); setNotice("Resumo do evento pronto para compartilhar com a equipe."); }}><MessageCircle size={16} /> Compartilhar</button><button className="text-button" onClick={(e) => { e.stopPropagation(); setOpenEventId(event.id); }}>Ver ficha <ChevronRight size={16} /></button></div></article>)}</div>
    </div><aside className="task-panel event-sheet"><div className="sheet-heading"><div><span>Ficha do evento</span><h2>{openEvent.title}</h2></div><button className="sheet-close" onClick={() => setNotice("Ficha fechada. Clique em qualquer cartão para abrir novamente.")} aria-label="Fechar ficha">×</button></div><div className="sheet-section"><strong>Cliente</strong><p>Dados de contato e preferências do atendimento.</p><div className="sheet-actions"><button className="sheet-button" onClick={() => setNotice("Área do cliente aberta: pagamentos, contrato e histórico.")}>Ver área do cliente</button><button className="sheet-button" onClick={() => setNotice("Agendamento de ensaio preparado para este cliente.")}>Agendar ensaio</button></div></div><div className="sheet-section"><strong>Quando e onde</strong><p><CalendarDays size={16} /> {openEvent.date}, {openEvent.time}</p><p><MapPin size={16} /> {openEvent.place}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(openEvent.place)}`} target="_blank" rel="noreferrer">Abrir no Google Maps <ExternalLink size={14} /></a></div><div className="sheet-section"><strong>Equipe e atribuições</strong>{openEvent.team.map((role) => <p key={role}><UserRoundCheck size={16} /> {role} definido</p>)}<button className="sheet-button" onClick={() => setNotice("Agenda individual da equipe aberta para ajuste.")}>Editar equipe</button></div><div className="sheet-section"><strong>Pagamento e contrato</strong><p><CheckCircle2 size={16} /> Sinal registrado</p><p><Clock3 size={16} /> Próxima parcela a acompanhar</p><div className="sheet-actions"><button className="sheet-button" onClick={() => setNotice("Contrato aberto para consulta.")}>Abrir contrato</button><button className="sheet-button" onClick={() => setNotice("Resumo de pagamentos aberto.")}>Ver o que pagou</button></div></div><button className="share-sheet" onClick={() => setNotice("Dados do evento preparados para compartilhar com a equipe.")}><MessageCircle size={18} /> Compartilhar dados com equipe</button></aside>
  </section>;

  if (view === "Equipe") return <section className="team-layout"><div className="section-heading"><div><h2>Equipe e disponibilidade</h2><p>Veja quem está livre antes de confirmar um evento.</p></div><button className="primary-button" onClick={() => setNotice("Novo membro será incluído na equipe de teste.")}><Plus size={17} /> Adicionar pessoa</button></div><div className="team-grid">{[{name:"Profissional de foto",role:"Fotografia",load:"Livre no próximo evento",tone:"rose"},{name:"Profissional de vídeo",role:"Videomaker",load:"1 evento confirmado",tone:"teal"},{name:"Edição",role:"Pós-produção",load:"2 entregas esta semana",tone:"violet"},{name:"Assistente",role:"Apoio de produção",load:"Livre no próximo evento",tone:"gold"}].map((member) => <article className="member-card" key={member.role}><span className={`avatar large ${member.tone}`}>{member.role.slice(0,1)}</span><div><h3>{member.name}</h3><p>{member.role}</p></div><strong>{member.load}</strong><button className="outline-button" onClick={() => setNotice(`Agenda de ${member.role} aberta.`)}><CalendarDays size={15} /> Ver agenda</button></article>)}</div><div className="availability-note"><UserRoundCheck size={18} /><span><strong>Regra simples:</strong> se a pessoa já estiver em outro evento no mesmo horário, o sistema avisa antes de confirmar.</span></div></section>;

  if (view === "Financeiro") return <section className="finance-layout"><div className="section-heading"><div><h2>Financeiro simples</h2><p>Veja só o que entrou, o que falta entrar e o próximo passo.</p></div><button className="primary-button" onClick={() => setNotice("Recebimento registrado somente nesta demonstração.")}><Plus size={17} /> Registrar recebimento</button></div><div className="money-summary"><article><span>Já entrou</span><strong>R$ 6.200</strong><small>Pagamentos confirmados</small></article><article><span>Falta receber</span><strong>R$ 12.450</strong><small>Próximas parcelas e sinais</small></article><article className="money-action"><WalletCards size={22} /><strong>Próximo passo</strong><p>Enviar lembrete de pagamento antes do evento.</p></article></div><div className="simple-ledger"><div className="section-heading"><div><h2>O que precisa da sua atenção</h2><p>Sem termos contábeis.</p></div></div>{[{title:"Sinal do evento",value:"R$ 1.680",when:"Vence em 2 dias",state:"Cobrar"},{title:"Recibo pronto para enviar",value:"R$ 2.200",when:"Pagamento confirmado",state:"Enviar"},{title:"Parcela do contrato",value:"R$ 3.400",when:"Vence na próxima semana",state:"Lembrar"}].map((item) => <div className="ledger-row" key={item.title}><ReceiptText size={19} /><div><strong>{item.title}</strong><span>{item.when}</span></div><b>{item.value}</b><button className="outline-button" onClick={() => setNotice(`${item.state}: fluxo de teste preparado.`)}>{item.state}</button></div>)}</div></section>;

  return <section className="orders-layout"><div className="section-heading"><div><h2>{view === "Pedidos" ? "Pedidos e contratos" : "Propostas"}</h2><p>Uma trilha clara, sem duplicar informações.</p></div><button className="primary-button" onClick={() => setNotice("Novo documento preparado para o fluxo do Gerador.")}><Plus size={17} /> Criar {view === "Pedidos" ? "pedido" : "proposta"}</button></div><div className="document-flow"><article><FileText size={23} /><h3>1. Proposta</h3><p>Cliente escolhe itens no Gerador.</p></article><ChevronRight /><article><ClipboardList size={23} /><h3>2. Pedido</h3><p>Itens e valor ficam organizados.</p></article><ChevronRight /><article><ReceiptText size={23} /><h3>3. Contrato e recibo</h3><p>Assinatura e pagamento viram histórico.</p></article></div><div className="document-table"><div><strong>Pronto para o próximo passo</strong><span>Proposta recebida pelo fluxo de teste</span></div><button className="outline-button" onClick={() => setNotice("Abrir proposta: integração com o Gerador será o próximo passo.")}>Abrir <ExternalLink size={15} /></button></div></section>;
}
