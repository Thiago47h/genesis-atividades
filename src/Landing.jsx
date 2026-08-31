import { useEffect, useRef, useState } from 'react'

const chapters = [
  ['01', 'CRIE', 'Da ideia à atividade.', 'Defina conteúdo, série e objetivos. A estrutura nasce diante dos seus olhos, pronta para ser refinada.'],
  ['02', 'ADAPTE', 'Cada aluno aprende de um jeito.', 'A mesma proposta ganha comandos mais curtos, apoio visual e o ritmo adequado para cada estudante.'],
  ['03', 'EDITE', 'Você continua no controle.', 'Mova, reescreva, exclua ou acrescente questões. A inteligência artificial prepara; o professor decide.'],
  ['04', 'ENTREGUE', 'Pronto para a sala de aula.', 'Revise a versão final e exporte um Word organizado, profissional e pronto para imprimir.'],
]

const goToCreator = () => { window.location.href = '/app' }

function Logo({ compact = false }) {
  return <img className={`gl-logo ${compact ? 'compact' : ''}`} src="/logo-genesis.png" alt="Colégio Gênesis Life" />
}

function Visual({ index }) {
  if (index === 0) return <div className="gl-visual create"><div className="gl-form"><small>ANO ESCOLAR</small><b>4º ano</b><small>DISCIPLINA</small><b>Ciências</b><small>TEMA</small><b>Sistema Solar</b><button onClick={goToCreator}>Abrir o Criador →</button></div><div className="gl-paper"><em>CIÊNCIAS • 4º ANO</em><h3>Uma viagem pelo Sistema Solar</h3><p>O Sistema Solar é formado pelo Sol e pelos corpos celestes que giram ao seu redor.</p><div className="gl-question"><i>01</i> Qual estrela ilumina a Terra?</div><div className="gl-question"><i>02</i> Complete os nomes dos planetas.</div></div></div>
  if (index === 1) return <div className="gl-visual adapt"><div className="gl-profile"><small>PERFIL DE ADAPTAÇÃO</small><h3>Miguel • 4º ano</h3><span>✓ Comandos mais curtos</span><span>✓ Apoio visual</span><span>＋ Adicionar necessidade</span></div><div className="gl-before"><small>ANTES</small><s>Observe as informações apresentadas no texto-base e responda...</s><small>ADAPTADO</small><b>Leia o texto. Depois, marque a resposta correta.</b></div></div>
  if (index === 2) return <div className="gl-visual editor"><span className="gl-edit-tag">✎ Editando questão 2</span><div className="gl-question"><i>01</i> O Sol é uma estrela que ilumina a Terra.</div><div className="gl-question selected"><i>02</i> Quais são os planetas rochosos?<small>A) Terra e Marte &nbsp; B) Júpiter e Saturno</small></div><div className="gl-question"><i>03</i> Desenhe o planeta de que você mais gostou.</div><button>＋ Adicionar questão</button></div>
  return <div className="gl-visual deliver"><div className="gl-stack back"/><div className="gl-stack mid"/><div className="gl-paper final"><Logo compact/><h3>Uma viagem pelo Sistema Solar</h3><p>Nome: __________________________________</p><div className="gl-lines"/><span>↓ Documento Word</span></div></div>
}

export default function Landing() {
  const [active, setActive] = useState(0)
  const refs = useRef([])

  useEffect(() => {
    const observers = refs.current.map((node, index) => {
      if (!node) return null
      const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setActive(index), { threshold: .55 })
      observer.observe(node)
      return observer
    })
    return () => observers.forEach(observer => observer?.disconnect())
  }, [])

  return <main className="gl-site">
    <header className="gl-nav"><Logo compact/><button onClick={goToCreator}>Criar atividade <span>→</span></button></header>
    <section className="gl-hero"><div className="gl-orbit one"/><div className="gl-orbit two"/><span className="gl-kicker">✦ INTELIGÊNCIA PEDAGÓGICA</span><Logo/><h1>Atividades que<br/><em>entendem cada aluno.</em></h1><p>Crie, adapte e organize experiências pedagógicas com inteligência — sem abrir mão do seu olhar.</p><div className="gl-actions"><button onClick={() => document.querySelector('#experiencia')?.scrollIntoView({ behavior: 'smooth' })}>Conhecer a experiência ↓</button><button onClick={goToCreator}>Criar uma atividade</button></div><small className="gl-scroll">ROLE PARA DESCOBRIR</small></section>
    <section id="experiencia" className="gl-story"><aside className={active === 1 || active === 3 ? 'light' : ''}>{chapters.map((chapter, index) => <button className={active === index ? 'active' : ''} key={chapter[0]} onClick={() => refs.current[index]?.scrollIntoView({ behavior: 'smooth' })}><b>{chapter[0]}</b>{chapter[1]}</button>)}</aside>{chapters.map((chapter, index) => <section className={`gl-chapter c${index}`} key={chapter[0]} ref={node => refs.current[index] = node}><div className="gl-copy"><span>CAPÍTULO {chapter[0]} / {chapter[1]}</span><h2>{chapter[2]}</h2><p>{chapter[3]}</p></div><Visual index={index}/></section>)}</section>
    <section className="gl-cta"><span>GÊNESIS ATIVIDADES</span><h2>Menos tempo formatando.<br/><em>Mais tempo ensinando.</em></h2><p>Entre no Criador para montar, adaptar e revisar sua atividade em um espaço próprio.</p><button onClick={goToCreator}>Abrir o Criador →</button></section>
    <footer><Logo compact/><p>Ensinando valores, construindo o futuro.</p><span>GÊNESIS LIFE • 2026</span></footer>
  </main>
}
