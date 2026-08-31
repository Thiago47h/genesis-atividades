"use client";

import { useState } from "react";
import { ArrowLeft, Check, ChevronDown, Download, Eye, Image as ImageIcon, LayoutDashboard, Library, Plus, Save, Settings2, Sparkles, Users, WandSparkles } from "lucide-react";

function BrandMark({ small = false }: { small?: boolean }) {
  return <img className={`brand-mark ${small ? "small" : ""}`} src="/genesis-life-logo.png" alt="Colégio Gênesis Life"/>;
}

export default function CriarAtividade() {
  const [studentView, setStudentView] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(2);
  return <main className="creator-page">
    <header className="creator-header">
      <button onClick={() => { window.location.href = "/"; }}><ArrowLeft/>Voltar para apresentação</button>
      <div><BrandMark small/><span>CRIADOR DE ATIVIDADES</span></div>
      <div className="creator-header-actions"><span>Rascunho salvo</span><button><Save/>Salvar</button><button className="download-button"><Download/>Baixar Word</button></div>
    </header>
    <div className="workspace creator-workspace">
      <aside className="workspace-nav"><BrandMark small/><nav><button className="active" title="Criar atividade"><WandSparkles/></button><button title="Início"><LayoutDashboard/></button><button title="Biblioteca"><Library/></button><button title="Alunos"><Users/></button></nav><button title="Configurações"><Settings2/></button></aside>
      <section className="workspace-settings"><div className="panel-title"><span>NOVA ATIVIDADE</span><h3>Sistema Solar</h3><p>4º ano • Ciências</p></div><div className="step-dots"><i className="done"/><i className="active"/><i/><i/></div><label>Tipos de questão</label>{["Alternativas","Complete","Desenho"].map((item,index)=><button className="setting-row" key={item}><span>{index+1}</span>{item}<b>{index===0?"2":"1"}</b></button>)}<button className="add-type"><Plus/> Adicionar tipo</button><div className="adaptation-mini"><Sparkles/><div><strong>Adaptação ativa</strong><span>Comandos curtos • Apoio visual</span></div><ChevronDown/></div></section>
      <section className="workspace-canvas"><div className="canvas-toolbar"><span>Prévia da atividade</span><div className="view-toggle"><button className={studentView?"active":""} onClick={()=>setStudentView(true)}>Aluno</button><button className={!studentView?"active":""} onClick={()=>setStudentView(false)}>Professor</button></div><button><Eye/>100%</button></div><div className="paper full-paper"><div className="school-header"><BrandMark small/><div><strong>ATIVIDADE DE CIÊNCIAS</strong><span>4º ANO • SISTEMA SOLAR</span></div></div><div className="student-fields">Nome: ________________________________ Data: ____/____/_____</div><h3>Uma viagem pelo Sistema Solar</h3><p>O Sistema Solar é formado pelo Sol e por todos os corpos que giram ao seu redor. O Sol é uma estrela e fornece luz e calor para os planetas.</p>{["Qual é a estrela do Sistema Solar?","Marque os dois planetas rochosos.","Complete: A Terra gira ao redor do ________."].map((q,index)=><button key={q} onClick={()=>setSelectedQuestion(index+1)} className={`paper-question ${selectedQuestion===index+1?"selected":""}`}><span>{index+1}</span><div><strong>{q}</strong>{index<2&&<small>○ Terra &nbsp;&nbsp; ○ Sol &nbsp;&nbsp; ○ Lua</small>}{!studentView&&<em>Resposta: {index===0?"Sol":index===1?"Terra e Marte":"Sol"}</em>}</div></button>)}</div></section>
      <aside className="workspace-tools"><div className="tools-head"><span>QUESTÃO {selectedQuestion}</span><button>•••</button></div><label>Enunciado</label><textarea value={selectedQuestion===1?"Qual é a estrela do Sistema Solar?":selectedQuestion===2?"Marque os dois planetas rochosos.":"Complete: A Terra gira ao redor do ________."} readOnly/><label>Espaço de resposta</label><div className="segmented"><button>Curto</button><button className="active">Médio</button><button>Longo</button></div><button className="tool-action"><ImageIcon/>Adicionar imagem</button><button className="tool-action"><Sparkles/>Gerar outra versão</button><div className="save-status"><Check/>Todas as alterações foram salvas</div></aside>
      <footer className="workspace-footer"><span>3 questões • 2 páginas estimadas</span><div><button className="save-button"><Save/>Salvar</button><button className="download-button"><Download/>Baixar Word</button></div></footer>
    </div>
  </main>;
}
