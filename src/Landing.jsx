import React, { useEffect, useRef, useState } from 'react'
import './landing.css'

const chapters = [
  { n: '01', tag: 'CRIE', title: 'Da ideia à atividade.', text: 'Defina conteúdo, série e objetivos. A estrutura nasce diante dos seus olhos, pronta para ser refinada.' },
  { n: '02', tag: 'ADAPTE', title: 'Cada aluno aprende de um jeito.', text: 'Transforme a mesma proposta com comandos mais curtos, apoio visual, fonte ampliada e ritmo adequado.' },
  { n: '03', tag: 'EDITE', title: 'Você continua no controle.', text: 'Mova, reescreva, duplique ou substitua questões. A inteligência artificial prepara; o professor decide.' },
  { n: '04', tag: 'ENTREGUE', title: 'Pronto para a sala de aula.', text: 'Revise o conteúdo e exporte um Word profissional, organizado e pronto para imprimir.' },
]

function Logo({ compact = false }) {
  return <img className={`gl-logo ${compact ? 'compact' : ''}`} src="/logo-genesis.png" alt="Colégio Gênesis Life" />
}

export default function Landing() {
  const [active, setActive] = useState(0)
  const [menu, setMenu] = useState(false)
  const refs = useRef([])

  useEffect(() => {
    const observers = refs.current.map((node, index) => {
      if (!node) return null
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setActive(index)
      }, { threshold: 0.55 })
      observer.observe(node)
      return observer
    })
    return () => observers.forEach(observer => observer?.disconnect())
  }, [])

  const openApp = () => { window.location.href = '/app' }
  const goStory = () => document.getElementById('experiencia')?.scrollIntoView({ behavior: 'smooth' })

  return <main className="gl-landing">
    <header className="gl-topbar">
      <button className="gl-menu-button" onClick={() => setMenu(true)} aria-label="Abrir menu">☰</button>
      <Logo compact />
      <button className="gl-top-action" onClick={openApp}>Criar atividade <span>→</span></button>
    </header>

    <aside className={`gl-drawer ${menu ? 'open' : ''}`}>
      <button className="gl-close" onClick={() => setMenu(false)} aria-label="Fechar menu">×</button>
      <Logo />
      <nav>
        <button className="active" onClick={() => { setMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Visão geral</button>
        <button onClick={openApp}>Criar atividade</button>
        <button onClick={openApp}>Biblioteca</button>
        <button onClick={openApp}>Alunos e PEI</button>
      </nav>
    </aside>
    {menu && <button className="gl-backdrop" onClick={() => setMenu(false)} aria-label="Fechar menu" />}

    <section className="gl-hero">
      <div className="gl-orbit one" /><div className="gl-orbit two" />
      <span className="gl-eyebrow">INTELIGÊNCIA PEDAGÓGICA</span>
      <Logo />
      <h1>Atividades que<br/><em>entendem cada aluno.</em></h1>
      <p>Crie, adapte e organize experiências pedagógicas com inteligência — sem abrir mão do seu olhar.</p>
      <div className="gl-actions">
        <button className="gl-primary" onClick={goStory}>Conhecer a experiência <span>↓</span></button>
        <button className="gl-link" onClick={openApp}>Criar uma atividade</button>
      </div>
      <small>ROLE PARA DESCOBRIR</small>
    </section>

    <section id="experiencia" className="gl-story">
      <nav className="gl-rail">{chapters.map((c, i) => <button key={c.n} className={active === i ? 'active' : ''} onClick={() => refs.current[i]?.scrollIntoView({ behavior: 'smooth' })}><span>{c.n}</span>{c.tag}</button>)}</nav>

      <section ref={el => refs.current[0] = el} className="gl-chapter dark">
        <div className="gl-copy"><span>CAPÍTULO 01 / CRIE</span><h2>Da ideia à<br/>atividade.</h2><p>{chapters[0].text}</p></div>
        <div className="gl-create-demo">
          <article className="gl-config"><label>Ano escolar</label><strong>4º ano</strong><label>Disciplina</label><strong>Ciências</strong><label>Tema</label><strong>Sistema Solar</strong><button onClick={openApp}>Abrir o Criador</button></article>
          <article className="gl-paper"><small>CIÊNCIAS • 4º ANO</small><h3>Uma viagem pelo Sistema Solar</h3><i/><i/><i className="short"/><div><b>01</b> Qual estrela ilumina a Terra?</div><div><b>02</b> Complete os nomes dos planetas.</div></article>
        </div>
      </section>

      <section ref={el => refs.current[1] = el} className="gl-chapter light">
        <div className="gl-copy"><span>CAPÍTULO 02 / ADAPTE</span><h2>Cada aluno<br/>aprende de um jeito.</h2><p>{chapters[1].text}</p></div>
        <div className="gl-adapt-demo"><article><span>PERFIL DE ADAPTAÇÃO</span><h3>Miguel • 4º ano</h3><button>✓ Comandos mais curtos</button><button>✓ Apoio visual</button><button className="muted">+ Adicionar necessidade</button></article><aside><small>ANTES</small><p>Observe as informações apresentadas no texto-base e responda...</p><hr/><small>ADAPTADO</small><strong>Leia o texto. Depois, marque a resposta correta.</strong></aside></div>
      </section>

      <section ref={el => refs.current[2] = el} className="gl-chapter dark gl-edit">
        <div className="gl-copy"><span>CAPÍTULO 03 / EDITE</span><h2>Você continua<br/>no controle.</h2><p>{chapters[2].text}</p></div>
        <div className="gl-question-list"><span className="gl-editing">EDITANDO QUESTÃO 2</span><article><b>01</b> O Sol é uma estrela que ilumina a Terra.</article><article className="selected"><b>02</b><div>Quais são os planetas rochosos?<small>A) Terra e Marte &nbsp; B) Júpiter e Saturno</small></div></article><article><b>03</b> Desenhe o planeta de que você mais gostou.</article><button>＋ Adicionar questão</button></div>
      </section>

      <section ref={el => refs.current[3] = el} className="gl-chapter light">
        <div className="gl-copy"><span>CAPÍTULO 04 / ENTREGUE</span><h2>Pronto para a<br/>sala de aula.</h2><p>{chapters[3].text}</p></div>
        <div className="gl-document"><article><Logo compact/><h3>Uma viagem pelo Sistema Solar</h3><p>Nome: __________________________________</p><i/><i/><i/><span>Documento Word</span></article></div>
      </section>
    </section>

    <section className="gl-final"><span>GÊNESIS ATIVIDADES</span><h2>Menos tempo formatando.<br/><em>Mais tempo ensinando.</em></h2><p>Entre no Criador para montar, adaptar e revisar sua atividade.</p><button className="gl-primary" onClick={openApp}>Abrir o Criador <span>→</span></button></section>
    <footer className="gl-footer"><Logo compact/><p>Ensinando valores, construindo o futuro.</p><span>GÊNESIS LIFE • 2026</span></footer>
  </main>
}
