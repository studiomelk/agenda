"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight, CalendarDays, Check, ChevronRight, CircleDollarSign,
  ClipboardList, FileText, LayoutDashboard, MessageCircle, Plus,
  Search, ShieldCheck, Sparkles, UsersRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { leadStages, type LeadStage } from "../lib/lead-intake";

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
  [ClipboardList, "Contratos"], [CalendarDays, "Agenda"], [CircleDollarSign, "Financeiro"],
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
      </section>
    </main>
  );
}
