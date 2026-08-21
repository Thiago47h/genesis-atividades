export const SERIES_OPTIONS = {
  "Educação Infantil": ["Infantil I", "Infantil II", "Infantil III"],
  "Fundamental I": ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano"],
  "Fundamental II": ["6º ano", "7º ano", "8º ano", "9º ano"],
};

export const DISCIPLINAS = {
  "Educação Infantil": ["Linguagem", "Matemática", "Natureza e Sociedade", "Artes", "Movimento"],
  "Fundamental I": ["Português", "Matemática", "Ciências", "História", "Geografia", "Artes", "Ed. Física", "Inglês", "Espanhol"],
  "Fundamental II": ["Português", "Matemática", "Ciências", "História", "Geografia", "Artes", "Ed. Física", "Inglês", "Espanhol"],
};

export const TIPOS_QUESTAO = [
  { id: "alternativas", label: "Alternativas (A, B, C)", icon: "🔘" },
  { id: "complete", label: "Complete a frase", icon: "✏️" },
  { id: "relacione", label: "Relacione as colunas", icon: "🔗" },
  { id: "texto", label: "Procure no texto", icon: "📖" },
  { id: "desenhe", label: "Desenhe", icon: "🎨" },
  { id: "criatividade", label: "Use sua criatividade", icon: "💡" },
  { id: "outro", label: "Outro (descreva abaixo)", icon: "📝" },
];

export const TEMAS_SUGERIDOS = {
  "Português": ["Tipos de frases", "Substantivos", "Sinais de pontuação", "Interpretação de texto", "Ordem alfabética", "Sílabas"],
  "Matemática": ["Adição e subtração", "Tabuada", "Formas geométricas", "Medidas de tempo", "Números pares e ímpares", "Frações"],
  "Ciências": ["Corpo humano", "Animais vertebrados", "Ciclo da água", "Sistema solar", "Plantas", "Alimentação saudável"],
  "História": ["Povos indígenas", "Independência do Brasil", "Linha do tempo", "Cultura africana", "Festas populares"],
  "Geografia": ["Meios de transporte", "Bairro e cidade", "Regiões do Brasil", "Relevo", "Clima"],
  "Artes": ["Cores primárias", "Releitura de obra", "Arte indígena", "Música e ritmo"],
  "Linguagem": ["Vogais", "Nome próprio", "Rimas", "Histórias", "Parlendas"],
  "Natureza e Sociedade": ["Animais", "Estações do ano", "Família", "Higiene"],
  "Movimento": ["Brincadeiras", "Coordenação motora", "Jogos cooperativos"],
  "Ed. Física": ["Esportes coletivos", "Jogos populares", "Saúde e movimento"],
  "Inglês": ["Greetings", "Colors and numbers", "Animals", "Family members", "Food"],
  "Espanhol": ["Saludos", "Colores y números", "Animales", "La familia", "Los alimentos", "El cuerpo humano"],
};
