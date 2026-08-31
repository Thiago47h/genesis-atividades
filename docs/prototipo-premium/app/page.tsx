"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Check, CirclePlus, Download, GripVertical, LayoutDashboard, Library, Menu, PenLine, Plus, Settings2, Sparkles, Users, WandSparkles, X } from "lucide-react";

const chapters = [
  { number: "01", label: "CRIE", title: "Da ideia à atividade.", text: "Defina conteúdo, série e objetivos. A estrutura nasce diante dos seus olhos, pronta para ser refinada." },
  { number: "02", label: "ADAPTE", title: "Cada aluno aprende de um jeito.", text: "Transforme a mesma proposta com comandos mais curtos, apoio visual, fonte ampliada e ritmo adequado." },
  { number: "03", label: "EDITE", title: "Você continua no controle.", text: "Mova, reescreva, duplique ou substitua questões. A inteligência artificial prepara; o professor decide." },
  { number: "04", label: "ENTREGUE", title: "Pronto para a sala de aula.", text: "Revise como aluno ou professor e exporte um Word profissional, organizado e pronto para imprimir." },
];

function BrandMark({ small = false }: { small?: boolean }) {
  return <img className={`brand-mark ${small ? "small" : ""}`} src="/genesis-life-logo.png" alt="Colégio Gênesis Life"/>;
}

function QuestionCard({ index, children, accent = false }: { index: number; children: React.ReactNode; accent?: boolean }) {
  return <div className={`question-card ${accent ? "accent" : ""}`}><GripVertical size={16} className="grip"/><span className="question-number">{String(index).padStart(2,"0")}</span><div>{children}</div></div>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observers = chapterRefs.current.map((node, index) => {
      if (!node) return null;
      const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setActiveChapter(index); }, { threshold: .56 });
      observer.observe(node); return observer;
    });
    return () => observers.forEach(observer => observer?.disconnect());
  }, []);

  const scrollToStory = () => document.getElementById("story")?.scrollIntoView({ behavior: "smooth" });
  const openCreator = () => { window.location.href = "/criar"; };

  return <main>
    <header className="topbar"><button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu size={20}/></button><BrandMark small /><button className="ghost-button" onClick={openCreator}>Criar atividade <ArrowRight size={16}/></button></header>
    <aside className={`side-menu ${menuOpen ? "open" : ""}`}><button className="close-button" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X/></button><BrandMark/><nav><a className="active"><LayoutDashboard/>Visão geral</a><a onClick={openCreator}><WandSparkles/>Criar atividade</a><a><Library/>Biblioteca</a><a><Users/>Alunos e PEI</a><a><Settings2/>Configurações</a></nav></aside>
    {menuOpen && <button className="menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"/>}

    <section className="hero"><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="eyebrow"><Sparkles size={14}/> INTELIGÊNCIA PEDAGÓGICA</div><BrandMark/><h1>Atividades que<br/><span>entendem cada aluno.</span></h1><p>Crie, adapte e organize experiências pedagógicas com inteligência — sem abrir mão do seu olhar.</p><div className="hero-actions"><button className="primary-button" onClick={scrollToStory}>Conhecer a experiência <ArrowDown size={18}/></button><button className="text-button" onClick={openCreator}>Criar uma atividade</button></div><div className="scroll-cue"><span/>ROLE PARA DESCOBRIR</div></section>

    <section id="story" className="story-shell"><div className="chapter-rail">{chapters.map((chapter,index)=><button key={chapter.number} className={activeChapter===index?"active":""} onClick={()=>chapterRefs.current[index]?.scrollIntoView({behavior:"smooth"})}><span>{chapter.number}</span>{chapter.label}</button>)}</div>
      <section ref={el=>{chapterRefs.current[0]=el}} className="chapter chapter-create"><div className="chapter-copy"><span>CAPÍTULO 01 / CRIE</span><h2>Da ideia à<br/>atividade.</h2><p>{chapters[0].text}</p></div><div className="visual visual-create"><div className="setup-card"><label>Ano escolar</label><strong>4º ano</strong><label>Disciplina</label><strong>Ciências</strong><label>Tema</label><strong>Sistema Solar</strong><button onClick={openCreator}><WandSparkles size={16}/> Abrir o Criador</button></div><div className="paper mini-paper"><div className="paper-kicker">CIÊNCIAS • 4º ANO</div><h3>Uma viagem pelo Sistema Solar</h3><div className="line long"/><div className="line"/><div className="line short"/><QuestionCard index={1}>Qual estrela ilumina a Terra?</QuestionCard><QuestionCard index={2}>Complete os nomes dos planetas.</QuestionCard></div></div></section>
      <section ref={el=>{chapterRefs.current[1]=el}} className="chapter chapter-adapt"><div className="chapter-copy"><span>CAPÍTULO 02 / ADAPTE</span><h2>Cada aluno<br/>aprende de um jeito.</h2><p>{chapters[1].text}</p></div><div className="visual adaptation-visual"><div className="adapt-card"><div><Users/><span>Perfil de adaptação</span></div><h3>Miguel • 4º ano</h3><button className="selected"><Check/>Comandos mais curtos</button><button className="selected"><Check/>Apoio visual</button><button><Plus/>Adicionar necessidade</button></div><div className="before-after"><span>ANTES</span><p>Observe as informações apresentadas no texto-base e responda...</p><i/><span>ADAPTADO</span><strong>Leia o texto. Depois, marque a resposta correta.</strong></div></div></section>
      <section ref={el=>{chapterRefs.current[2]=el}} className="chapter chapter-edit"><div className="chapter-copy"><span>CAPÍTULO 03 / EDITE</span><h2>Você continua<br/>no controle.</h2><p>{chapters[2].text}</p></div><div className="visual editor-visual"><div className="floating-tool"><PenLine size={16}/> Editando questão 2</div><QuestionCard index={1}>O Sol é uma estrela que ilumina a Terra.</QuestionCard><QuestionCard index={2} accent>Quais são os planetas rochosos?<div className="options">A) Terra e Marte &nbsp; B) Júpiter e Saturno</div></QuestionCard><QuestionCard index={3}>Desenhe o planeta de que você mais gostou.</QuestionCard><div className="insert-line"><CirclePlus/>Adicionar questão</div></div></section>
      <section ref={el=>{chapterRefs.current[3]=el}} className="chapter chapter-deliver"><div className="chapter-copy"><span>CAPÍTULO 04 / ENTREGUE</span><h2>Pronto para a<br/>sala de aula.</h2><p>{chapters[3].text}</p></div><div className="visual deliver-visual"><div className="document-stack"><div/><div/><article><BrandMark small/><h3>Uma viagem pelo Sistema Solar</h3><p>Nome: __________________________________</p><div className="doc-lines"/><div className="doc-lines short"/><div className="download-pill"><Download size={18}/> Documento Word</div></article></div></div></section>
    </section>

    <section className="final-cta"><span>GÊNESIS ATIVIDADES</span><h2>Menos tempo formatando.<br/><em>Mais tempo ensinando.</em></h2><p>Entre no Criador para montar, adaptar e revisar sua atividade em um espaço próprio.</p><button className="primary-button" onClick={openCreator}>Abrir o Criador <ArrowRight/></button></section>
    <footer className="page-footer"><BrandMark small/><p>Ensinando valores, construindo o futuro.</p><span>CONCEITO VISUAL • 2026</span></footer>
  </main>;
}
