"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./contratos.css";

const DEFAULT_TEMPLATE = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE FOTOGRAFIA E FILMAGEM

CONTRATANTE
Nome: {{NOME_CONTRATANTE}}
CPF: {{CPF}}
RG: {{RG}}
WhatsApp: {{WHATSAPP}}
E-mail: {{EMAIL}}
Endereço: {{ENDERECO}}

EVENTO
Noiva: {{NOIVA}}
Noivo: {{NOIVO}}
Data: {{DATA_EVENTO}}
Horário: {{HORARIO}}
Local: {{LOCAL_EVENTO}}
Endereço do evento: {{ENDERECO_EVENTO}}

SERVIÇOS CONTRATADOS
{{SERVICOS}}

VALOR E PAGAMENTO
Valor total: {{VALOR_TOTAL}}
Forma de pagamento: {{FORMA_PAGAMENTO}}
Parcelas: {{PARCELAS}}

PRESENTE ESPECIAL
{{PRESENTE_ESPECIAL}}

CONDIÇÕES
O presente contrato formaliza a contratação dos serviços descritos acima, conforme as condições, datas, horários e valores informados. As partes declaram que leram e concordam com o conteúdo deste contrato.

ASSINATURAS
CONTRATANTE: {{NOME_CONTRATANTE}}
STUDIO MELK FOTO E FILME: Marcio Melk

Data da assinatura: {{DATA_ASSINATURA}}
`;

const fields = [
  ["NOME_CONTRATANTE","Contratante"],["CPF","CPF"],["RG","RG"],["WHATSAPP","WhatsApp"],["EMAIL","E-mail"],
  ["ENDERECO","Endereço"],["NOIVA","Noiva"],["NOIVO","Noivo"],["DATA_EVENTO","Data do evento"],
  ["HORARIO","Horário"],["LOCAL_EVENTO","Local"],["ENDERECO_EVENTO","Endereço do evento"],
  ["SERVICOS","Serviços contratados"],["VALOR_TOTAL","Valor total"],["FORMA_PAGAMENTO","Forma de pagamento"],
  ["PARCELAS","Parcelas"],["PRESENTE_ESPECIAL","Presente especial"],["DATA_ASSINATURA","Data da assinatura"],
] as const;

function today() { return new Intl.DateTimeFormat("pt-BR").format(new Date()); }
function replaceTemplate(t: string, data: Record<string,string>) {
  return t.replace(/{{\\s*([A-Z0-9_]+)\\s*}}/g, (_, key) => data[key] ?? "");
}
function parseMoney(v:string) {
  if (!v) return "";
  if (v.includes("R$")) return v;
  const n = Number(v.replace(/\\./g,"").replace(",","."));
  return Number.isFinite(n) ? n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) : v;
}
function parsePasted(text:string) {
  const out:Record<string,string> = {};
  const find=(keys:string[])=>{
    for(const k of keys){
      const safe=k.replace(/[.*+?^$()|[\\]\\\\]/g,"\\\\$&");
      const re = new RegExp("^\\\\s*"+safe+"\\\\s*[:=-]\\\\s*(.+)$","im");
      const m=text.match(re); if(m) return m[1].trim();
    }
    return "";
  };
  out.NOME_CONTRATANTE=find(["Nome","Contratante","Cliente"]);
  out.CPF=find(["CPF"]); out.RG=find(["RG"]); out.WHATSAPP=find(["WhatsApp","Telefone","Celular"]);
  out.EMAIL=find(["E-mail","Email"]); out.ENDERECO=find(["Endereço"]);
  out.NOIVA=find(["Noiva"]); out.NOIVO=find(["Noivo"]); out.DATA_EVENTO=find(["Data do evento","Data"]);
  out.HORARIO=find(["Horário","Horario"]); out.LOCAL_EVENTO=find(["Local do evento","Local"]);
  out.ENDERECO_EVENTO=find(["Endereço do evento","Endereço do local"]);
  out.SERVICOS=find(["Serviços contratados","Serviços","Servico"]);
  out.VALOR_TOTAL=parseMoney(find(["Valor total","Total","Investimento"]));
  out.FORMA_PAGAMENTO=find(["Forma de pagamento","Pagamento"]);
  out.PARCELAS=find(["Parcelas","Parcelamento"]);
  out.PRESENTE_ESPECIAL=find(["Presente especial","Presente"]);
  return out;
}

export default function ContratosPage() {
  const [template,setTemplate]=useState(DEFAULT_TEMPLATE);
  const [data,setData]=useState<Record<string,string>>({DATA_ASSINATURA:today()});
  const [paste,setPaste]=useState("");
  const [step,setStep]=useState<"preencher"|"revisar"|"assinar"|"final">("preencher");
  const [clientSigned,setClientSigned]=useState(false);
  const [studioSigned,setStudioSigned]=useState(false);
  const [saved,setSaved]=useState(false);
  const canvas=useRef<HTMLCanvasElement|null>(null);
  const drawing=useRef(false);

  useEffect(()=> {
    try {
      const t=localStorage.getItem("melk_contrato_template"); if(t) setTemplate(t);
      const d=localStorage.getItem("melk_contrato_data"); if(d) setData(JSON.parse(d));
    } catch {}
  },[]);
  useEffect(()=> {
    localStorage.setItem("melk_contrato_template",template);
    localStorage.setItem("melk_contrato_data",JSON.stringify(data));
  },[template,data]);

  const documentText=useMemo(()=>replaceTemplate(template,data),[template,data]);
  const signed=clientSigned && studioSigned;

  function update(k:string,v:string){ setData(d=>({...d,[k]:v})); }
  function pasteData(){
    const parsed=parsePasted(paste);
    setData(d=>({...d,...Object.fromEntries(Object.entries(parsed).filter(([,v])=>v))}));
    setPaste("");
  }
  function startDraw(e:React.PointerEvent){
    const c=canvas.current; if(!c) return; drawing.current=true; c.setPointerCapture(e.pointerId);
    const r=c.getBoundingClientRect(); const ctx=c.getContext("2d"); if(!ctx)return;
    ctx.lineWidth=2; ctx.lineCap="round"; ctx.strokeStyle="#151515"; ctx.beginPath(); ctx.moveTo(e.clientX-r.left,e.clientY-r.top);
  }
  function draw(e:React.PointerEvent){
    if(!drawing.current)return; const c=canvas.current; if(!c)return; const r=c.getBoundingClientRect(); const ctx=c.getContext("2d"); if(!ctx)return;
    ctx.lineTo(e.clientX-r.left,e.clientY-r.top); ctx.stroke();
  }
  function endDraw(){drawing.current=false}
  function clearSignature(){const c=canvas.current; if(c)c.getContext("2d")?.clearRect(0,0,c.width,c.height); setClientSigned(false)}
  function generateFinal(){
    if(!signed)return;
    setStep("final");
    setTimeout(()=>window.print(),300);
  }

  return <main className="contract-app">
    <header className="contract-top">
      <div><div className="brand">STUDIO MELK</div><span>Gerador de Contratos</span></div>
      <div className="flow">{["preencher","revisar","assinar","final"].map((s,i)=><div key={s} className={step===s?"flow-on":(i<["preencher","revisar","assinar","final"].indexOf(step)?"flow-done":"")}>{i+1}. {s==="preencher"?"Preencher":s==="revisar"?"Revisar":s==="assinar"?"Assinar":"PDF final"}</div>)}</div>
    </header>

    <section className="contract-grid">
      <aside className="panel editor no-print">
        <div className="panel-title"><h2>Dados do contrato</h2><span>{saved?"Salvo":"Rascunho"}</span></div>
        <textarea className="paste" value={paste} onChange={e=>setPaste(e.target.value)} placeholder={"Cole aqui os dados do cliente do jeito que você recebe no WhatsApp.\\n\\nEx.:\\nNome: Gabrielly Caroline Flor Borges\\nCPF: 000...\\nNoiva: Gabrielly\\nNoivo: Gustavo\\nData do evento: 16/10/2027"} />
        <button className="secondary" onClick={pasteData}>Interpretar dados colados</button>
        <div className="fields">{fields.map(([k,label])=><label key={k}>{label}<textarea rows={k==="SERVICOS"||k==="PRESENTE_ESPECIAL"?3:1} value={data[k]||""} onChange={e=>update(k,e.target.value)} /></label>)}</div>
        <div className="buttons"><button className="secondary" onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),1200)}}>Salvar rascunho</button><button className="primary" onClick={()=>setStep("revisar")}>Gerar contrato</button></div>
      </aside>

      <section className="preview-area">
        <div className="preview-toolbar no-print">
          <div><b>{step==="final"?"Contrato final":"Pré-visualização"}</b><small>O documento fica congelado quando o processo de assinatura começa.</small></div>
          <button className="secondary" onClick={()=>setTemplate(DEFAULT_TEMPLATE)}>Restaurar template base</button>
        </div>
        <article className="paper">
          <div className="paper-head"><strong>STUDIO MELK FOTO E FILME</strong><span>CONTRATO</span></div>
          <pre>{documentText}</pre>
          {step==="assinar" || step==="final" ? <div className="signature-block">
            <div><div className="signature-line">{clientSigned?"✓ Assinado eletronicamente":"Aguardando assinatura do contratante"}</div><small>CONTRATANTE</small></div>
            <div><div className="signature-line">{studioSigned?"✓ Assinado eletronicamente":"Aguardando assinatura do Studio Melk"}</div><small>STUDIO MELK FOTO E FILME</small></div>
          </div>:null}
        </article>

        <div className="bottom-actions no-print">
          {step==="revisar" && <><button className="secondary" onClick={()=>setStep("preencher")}>Voltar e editar</button><button className="primary" onClick={()=>setStep("assinar")}>Congelar e iniciar assinatura</button></>}
          {step==="assinar" && <div className="sign-panel">
            <div><b>Assinatura do contratante</b><small>Desenhe abaixo. Este passo já funciona no navegador; depois podemos conectar Clicksign/ZapSign.</small>
              <canvas ref={canvas} width={520} height={150} onPointerDown={startDraw} onPointerMove={draw} onPointerUp={endDraw} onPointerCancel={endDraw}/>
              <div><button className="secondary" onClick={clearSignature}>Limpar</button><button className="primary" onClick={()=>setClientSigned(true)}>Confirmar assinatura do cliente</button></div>
            </div>
            <div className="studio-sign"><b>Studio Melk</b><p>Assinatura manual/automática</p><button className="primary" disabled={!clientSigned} onClick={()=>setStudioSigned(true)}>{studioSigned?"Studio Melk assinado":"Assinar como Studio Melk"}</button></div>
          </div>}
          {step==="final" && <div className="final-actions"><b>Contrato assinado e congelado.</b><button className="primary" onClick={()=>window.print()}>Gerar / salvar PDF final</button></div>}
        </div>
      </section>
    </section>

    <section className="template-editor no-print">
      <div><h2>Template do contrato</h2><p>Substitua pelo seu contrato oficial. Use campos como <code>{{"{{NOME_CONTRATANTE}}"}}</code> para preenchimento automático.</p></div>
      <textarea value={template} onChange={e=>setTemplate(e.target.value)} />
    </section>
  </main>
}
