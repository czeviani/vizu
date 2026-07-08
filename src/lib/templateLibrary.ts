import { v4 as uuid } from 'uuid';
import type { AISlideSpec, Presentation, TemplateDefinition } from '@/types/slide';
import { buildSlideFromSpec } from '@/lib/templates';
import { getThemeById } from '@/lib/themes';

// ── Negócios ────────────────────────────────────────────────────

const pitchStartup = (): TemplateDefinition => ({
  id: 'builtin-pitch-startup',
  name: 'Pitch de Startup',
  category: 'Negócios',
  themeId: 'midnight',
  isBuiltIn: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  deck: [
    {
      layout: 'cover',
      data: {
        title: 'Nome da Startup',
        subtitle: 'A solução que o mercado estava esperando',
        author: 'Fundador · 2024',
      },
    },
    {
      layout: 'content',
      data: {
        title: 'O Problema',
        bullets: [
          'Mercado atual não resolve X de forma eficiente',
          'Usuários perdem tempo e dinheiro com soluções fragmentadas',
          'Oportunidade de R$ 10 bilhões ignorada pelos grandes players',
        ],
      },
    },
    {
      layout: 'content',
      data: {
        title: 'Nossa Solução',
        bullets: [
          'Plataforma unificada que resolve X em minutos, não horas',
          'IA generativa reduz custo operacional em 60%',
          'Integração nativa com ferramentas já usadas pelo cliente',
        ],
      },
    },
    {
      layout: 'metrics',
      data: {
        title: 'Tração',
        metrics: [
          { value: '142', label: 'clientes pagantes', delta: '+38% no trimestre' },
          { value: 'R$ 5,2M', label: 'receita anual recorrente', delta: '+24%' },
          { value: '81', label: 'NPS', delta: '+14 pts' },
          { value: '2,4%', label: 'churn mensal', delta: '-0,7 pp' },
        ],
      },
    },
    {
      layout: 'comparison',
      data: {
        title: 'Nós vs. Concorrência',
        leftTitle: 'Nossa Solução',
        leftContent: 'Setup em 5 minutos\nPreço acessível\nSuporte 24/7\nIA embutida',
        rightTitle: 'Concorrentes',
        rightContent: 'Implementação complexa\nContratos longos\nSuporte limitado\nManual e lento',
      },
    },
    {
      layout: 'closing',
      data: {
        title: 'Vamos construir juntos?',
        subtitle: 'contato@startup.com · (11) 9 9999-0000',
      },
    },
  ],
});

const relatorioTrimestral = (): TemplateDefinition => ({
  id: 'builtin-relatorio-trimestral',
  name: 'Relatório Trimestral',
  category: 'Negócios',
  themeId: 'slate',
  isBuiltIn: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  deck: [
    {
      layout: 'cover',
      data: {
        title: 'Relatório Q3 2024',
        subtitle: 'Resultados e perspectivas para o próximo trimestre',
        author: 'Diretoria Executiva · Outubro 2024',
      },
    },
    {
      layout: 'metrics',
      data: {
        title: 'Destaques do Trimestre',
        metrics: [
          { value: 'R$ 5,2M', label: 'receita no trimestre', delta: '+24% vs. Q2' },
          { value: '142', label: 'novos contratos', delta: '+38%' },
          { value: '81', label: 'NPS', delta: '+14 pts' },
          { value: '2,4%', label: 'churn', delta: '-0,7 pp' },
        ],
      },
    },
    {
      layout: 'chart',
      data: {
        title: 'Receita por Trimestre (R$ milhões)',
        chart: {
          chartType: 'bar',
          labels: ['Q4 2023', 'Q1 2024', 'Q2 2024', 'Q3 2024'],
          series: [{ name: 'Receita', values: [3.4, 3.8, 4.2, 5.2] }],
        },
      },
    },
    {
      layout: 'comparison',
      data: {
        title: 'Q2 vs. Q3 — Indicadores Chave',
        leftTitle: 'Q2 2024',
        leftContent: 'Receita: R$ 4,2M\nNovos clientes: 103\nChurn: 3,1%\nNPS: 67',
        rightTitle: 'Q3 2024',
        rightContent: 'Receita: R$ 5,2M\nNovos clientes: 142\nChurn: 2,4%\nNPS: 81',
      },
    },
    {
      layout: 'content',
      data: {
        title: 'Próximos Passos — Q4',
        bullets: [
          'Expansão para mercado LATAM: Colombia e Chile em novembro',
          'Lançamento da API pública v2.0 com suporte GraphQL',
          'Contratação de 15 engenheiros para acelerar roadmap',
          'Meta de receita: R$ 6,8M até dezembro',
        ],
      },
    },
  ],
});

const propostaComercial = (): TemplateDefinition => ({
  id: 'builtin-proposta-comercial',
  name: 'Proposta Comercial',
  category: 'Negócios',
  themeId: 'ocean',
  isBuiltIn: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  deck: [
    {
      layout: 'cover',
      data: {
        title: 'Proposta de Parceria',
        subtitle: 'Soluções personalizadas para acelerar seus resultados',
        author: 'Equipe Comercial · 2024',
      },
    },
    {
      layout: 'content',
      data: {
        title: 'Entendemos seu Desafio',
        bulletIcons: ['Clock', 'EyeOff', 'TrendingDown'],
        bullets: [
          'Processos manuais consomem tempo valioso da equipe',
          'Falta de visibilidade em tempo real dos indicadores',
          'Dificuldade de escalar sem aumentar custo proporcional',
        ],
      },
    },
    {
      layout: 'content',
      data: {
        title: 'Nossa Proposta de Valor',
        bulletIcons: ['Rocket', 'BarChart3', 'Timer', 'ShieldCheck'],
        bullets: [
          'Implementação em até 30 dias com acompanhamento dedicado',
          'Dashboard em tempo real integrado ao seu ERP existente',
          'Redução de 40% no tempo de processos administrativos',
          'ROI comprovado em 6 meses — garantia contratual',
        ],
      },
    },
    {
      layout: 'table',
      data: {
        title: 'Planos e Investimento',
        columns: [
          { heading: 'Plano', rows: ['Essencial', 'Profissional', 'Enterprise'] },
          { heading: 'Usuários', rows: ['Até 10', 'Até 50', 'Ilimitado'] },
          { heading: 'Implementação', rows: ['15 dias', '30 dias', '45 dias'] },
          { heading: 'Investimento/mês', rows: ['R$ 1.900', 'R$ 4.900', 'Sob consulta'] },
        ],
      },
    },
    {
      layout: 'closing',
      data: {
        title: 'Próximo Passo: Reunião de Kick-off',
        subtitle: 'Estamos prontos para começar quando você quiser',
      },
    },
  ],
});

// ── Educação ─────────────────────────────────────────────────────

const aulaIntrodutoria = (): TemplateDefinition => ({
  id: 'builtin-aula-introdutoria',
  name: 'Aula Introdutória',
  category: 'Educação',
  themeId: 'forest',
  isBuiltIn: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  deck: [
    {
      layout: 'cover',
      data: {
        title: 'Introdução ao Tema',
        subtitle: 'Fundamentos, conceitos e aplicações práticas',
        author: 'Prof. Nome Sobrenome · Disciplina',
      },
    },
    {
      layout: 'agenda',
      data: {
        title: 'O que vamos aprender hoje',
        bullets: [
          'Conceitos fundamentais e definições essenciais',
          'Contexto histórico e evolução do tema',
          'Aplicações práticas no dia a dia profissional',
          'Exercícios para fixar o conteúdo',
        ],
      },
    },
    {
      layout: 'section',
      data: {
        title: 'Parte 1: Fundamentos',
        subtitle: 'Base conceitual para entender o restante da aula',
      },
    },
    {
      layout: 'content',
      data: {
        title: 'Conceitos-chave',
        bullets: [
          'Conceito A: definição clara e objetiva do primeiro pilar',
          'Conceito B: como ele se relaciona com o anterior',
          'Conceito C: a síntese que une os dois anteriores',
        ],
      },
    },
    {
      layout: 'closing',
      data: {
        title: 'Dúvidas?',
        subtitle: 'Próxima aula: aprofundamento em casos práticos',
      },
    },
  ],
});

const materialTreinamento = (): TemplateDefinition => ({
  id: 'builtin-material-treinamento',
  name: 'Material de Treinamento',
  category: 'Educação',
  themeId: 'slate',
  isBuiltIn: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  deck: [
    {
      layout: 'cover',
      data: {
        title: 'Treinamento: Nome do Programa',
        subtitle: 'Capacitação corporativa — módulo inicial',
        author: 'RH & Desenvolvimento · 2024',
      },
    },
    {
      layout: 'content',
      data: {
        title: 'Objetivos do Treinamento',
        bullets: [
          'Compreender os processos internos da organização',
          'Dominar as ferramentas utilizadas no dia a dia',
          'Conhecer as políticas e cultura da empresa',
          'Estar pronto para atuar com autonomia em 30 dias',
        ],
      },
    },
    {
      layout: 'comparison',
      data: {
        title: 'Antes vs. Depois do Treinamento',
        leftTitle: 'Antes',
        leftContent: 'Processos desconhecidos\nDependência constante\nErros evitáveis\nBaixa produtividade',
        rightTitle: 'Depois',
        rightContent: 'Processos dominados\nAutonomia completa\nQualidade garantida\nAlta performance',
      },
    },
    {
      layout: 'agenda',
      data: {
        title: 'Agenda do Programa',
        bullets: [
          'Semana 1: Onboarding e cultura organizacional',
          'Semana 2: Ferramentas e sistemas internos',
          'Semana 3: Processos e fluxos de trabalho',
          'Semana 4: Projeto prático com mentor',
        ],
      },
    },
  ],
});

const apresentacaoAcademica = (): TemplateDefinition => ({
  id: 'builtin-apresentacao-academica',
  name: 'Apresentação Acadêmica',
  category: 'Educação',
  themeId: 'mono',
  isBuiltIn: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  deck: [
    {
      layout: 'cover',
      data: {
        title: 'Título do Trabalho Acadêmico',
        subtitle: 'Subtítulo ou área de pesquisa',
        author: 'Autor · Instituição · 2024',
      },
    },
    {
      layout: 'content',
      data: {
        title: 'Introdução e Justificativa',
        bullets: [
          'Contextualização do problema de pesquisa',
          'Relevância e lacuna identificada na literatura',
          'Pergunta de pesquisa norteadora do trabalho',
        ],
      },
    },
    {
      layout: 'content',
      data: {
        title: 'Metodologia',
        bullets: [
          'Abordagem: pesquisa qualitativa exploratória',
          'Corpus: 47 artigos selecionados via revisão sistemática',
          'Análise: codificação temática com software NVivo',
        ],
      },
    },
    {
      layout: 'chart',
      data: {
        title: 'Distribuição das Categorias Temáticas',
        chart: {
          chartType: 'pie',
          labels: ['Categoria A', 'Categoria B', 'Categoria C'],
          series: [{ name: 'Ocorrências', values: [19, 16, 12] }],
        },
      },
    },
    {
      layout: 'content',
      data: {
        title: 'Resultados e Discussão',
        bullets: [
          'Três categorias temáticas emergentes dos dados',
          'Convergência com autores X e Y; divergência com Z',
          'Implicações teóricas e práticas identificadas',
        ],
      },
    },
    {
      layout: 'closing',
      data: {
        title: 'Obrigado',
        subtitle: 'autor@instituicao.edu.br',
      },
    },
  ],
});

// ── Criativo ─────────────────────────────────────────────────────

const portfolioCriativo = (): TemplateDefinition => ({
  id: 'builtin-portfolio-criativo',
  name: 'Portfolio Criativo',
  category: 'Criativo',
  themeId: 'rose',
  isBuiltIn: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  deck: [
    {
      layout: 'cover',
      data: {
        title: 'Meu Portfolio',
        subtitle: 'Design · Branding · Experiência do Usuário',
        author: 'Seu Nome · 2024',
      },
    },
    {
      layout: 'content',
      data: {
        title: 'Sobre Mim',
        bullets: [
          '7 anos criando experiências digitais que encantam usuários',
          'Especialidade em branding e sistemas de design escaláveis',
          'Clientes em 3 países — tech, moda e serviços financeiros',
          'Formação em Comunicação Visual + MBA em UX',
        ],
      },
    },
    {
      layout: 'section',
      data: {
        title: 'Projetos Selecionados',
        subtitle: '2022 — 2024',
      },
    },
    {
      layout: 'image-split',
      data: {
        title: 'Projeto Destaque: Rebrand FinTech',
        image: { alt: 'Mockup do rebrand FinTech' },
        bullets: [
          'Redesign completo de identidade visual e aplicações',
          'Nova paleta, tipografia e sistema de ícones proprietário',
          'Resultado: +34% em reconhecimento de marca (pesquisa pós-lançamento)',
        ],
      },
    },
    {
      layout: 'closing',
      data: {
        title: 'Vamos criar algo incrível?',
        subtitle: 'hello@seuportfolio.com',
      },
    },
  ],
});

const lancamentoProduto = (): TemplateDefinition => ({
  id: 'builtin-lancamento-produto',
  name: 'Lançamento de Produto',
  category: 'Criativo',
  themeId: 'midnight',
  isBuiltIn: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  deck: [
    {
      layout: 'cover',
      data: {
        title: 'Apresentando: Nome do Produto',
        subtitle: 'A experiência que vai mudar como você faz X',
        author: 'Equipe de Produto · Lançamento 2024',
      },
    },
    {
      layout: 'quote',
      data: {
        quote: 'A melhor experiência é aquela que o usuário nem percebe — simplesmente funciona.',
        attribution: 'Princípio de design do produto',
      },
    },
    {
      layout: 'content',
      data: {
        title: 'Funcionalidades Principais',
        bulletIcons: ['Sparkles', 'RefreshCw', 'Wand2', 'WifiOff'],
        bullets: [
          'Interface fluida — zero curva de aprendizado',
          'Sincronização em tempo real entre todos os dispositivos',
          'Personalização inteligente que aprende com o uso',
          'Offline-first — funciona sem conexão com internet',
        ],
      },
    },
    {
      layout: 'metrics',
      data: {
        title: 'Beta Fechado — Resultados',
        metrics: [
          { value: '2.400', label: 'usuários na lista de espera' },
          { value: '4,8/5', label: 'avaliação média no beta' },
          { value: '92%', label: 'ativação na primeira semana' },
        ],
      },
    },
    {
      layout: 'closing',
      data: {
        title: 'Disponível agora',
        subtitle: 'produto.com · Plano gratuito para sempre',
      },
    },
  ],
});

const propostaBranding = (): TemplateDefinition => ({
  id: 'builtin-proposta-branding',
  name: 'Proposta de Branding',
  category: 'Criativo',
  themeId: 'rose',
  isBuiltIn: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  deck: [
    {
      layout: 'cover',
      data: {
        title: 'Proposta de Identidade Visual',
        subtitle: 'Construindo uma marca que ressoa e permanece',
        author: 'Estúdio de Design · 2024',
      },
    },
    {
      layout: 'content',
      data: {
        title: 'O que está incluso',
        bullets: [
          'Logotipo principal e variações (horizontal, vertical, ícone)',
          'Paleta de cores com códigos HEX, RGB e CMYK',
          'Tipografia primária e secundária com guia de uso',
          'Mockups em papelaria, digital e sinalização',
        ],
      },
    },
    {
      layout: 'comparison',
      data: {
        title: 'Posicionamento da Marca',
        leftTitle: 'Percepção Atual',
        leftContent: 'Visual desatualizado\nMensagem inconsistente\nIdentidade fraca\nBaixa memorabilidade',
        rightTitle: 'Novo Posicionamento',
        rightContent: 'Visual moderno e único\nVoz clara e coesa\nIdentidade forte\nMarca memorável',
      },
    },
    {
      layout: 'agenda',
      data: {
        title: 'Cronograma e Entregáveis',
        bullets: [
          'Semana 1-2: Pesquisa, briefing e referências',
          'Semana 3-4: Conceitos iniciais e apresentação',
          'Semana 5-6: Refinamento e ajustes finais',
          'Semana 7: Entrega do pacote completo + manual de marca',
        ],
      },
    },
    {
      layout: 'closing',
      data: {
        title: 'Pronto para transformar sua marca?',
        subtitle: 'studio@branding.com · +55 11 9 9000-0000',
      },
    },
  ],
});

// ── Minimalista ──────────────────────────────────────────────────

const reuniaoExecutiva = (): TemplateDefinition => ({
  id: 'builtin-reuniao-executiva',
  name: 'Reunião Executiva',
  category: 'Minimalista',
  themeId: 'mono',
  isBuiltIn: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  deck: [
    {
      layout: 'cover',
      data: {
        title: 'Reunião de Diretoria',
        subtitle: 'Pauta estratégica — revisão mensal',
        author: 'CEO · Outubro 2024',
      },
    },
    {
      layout: 'agenda',
      data: {
        title: 'Pauta de Hoje',
        bullets: [
          'Revisão de resultados do mês anterior',
          'Aprovação do orçamento Q4',
          'Decisão sobre expansão geográfica',
          'Atualização sobre contratações estratégicas',
        ],
      },
    },
    {
      layout: 'content',
      data: {
        title: 'Pontos de Atenção',
        bullets: [
          'Margem operacional abaixo do target: ação necessária',
          'Dois headcounts críticos ainda em aberto',
          'Prazo do contrato com fornecedor X vence em novembro',
        ],
      },
    },
    {
      layout: 'closing',
      data: {
        title: 'Próxima reunião: 14/11',
        subtitle: 'Ata será enviada em até 24h',
      },
    },
  ],
});

const statusReport = (): TemplateDefinition => ({
  id: 'builtin-status-report',
  name: 'Status Report',
  category: 'Minimalista',
  themeId: 'slate',
  isBuiltIn: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  deck: [
    {
      layout: 'cover',
      data: {
        title: 'Status do Projeto',
        subtitle: 'Atualização semanal — semana 42/2024',
        author: 'Gerente de Projeto',
      },
    },
    {
      layout: 'metrics',
      data: {
        title: 'Resumo Executivo',
        metrics: [
          { value: 'No prazo', label: 'status geral' },
          { value: '3/3', label: 'marcos concluídos na semana' },
          { value: '1', label: 'risco médio em monitoramento' },
          { value: '15 dias', label: 'para o próximo marco' },
        ],
      },
    },
    {
      layout: 'table',
      data: {
        title: 'Planejado vs. Realizado',
        columns: [
          { heading: 'Indicador', rows: ['Sprint (tarefas)', 'Bug fixes', 'Reuniões', 'Documentação'] },
          { heading: 'Planejado', rows: ['8', '5', '3', '2 docs'] },
          { heading: 'Realizado', rows: ['9', '7', '3', '2 docs'] },
        ],
      },
    },
    {
      layout: 'content',
      data: {
        title: 'Próxima Semana',
        bullets: [
          'Iniciar testes de integração com sistema legado',
          'Code review das features de autenticação',
          'Reunião de alinhamento com stakeholder na quinta',
        ],
      },
    },
  ],
});

const onePageLimpo = (): TemplateDefinition => ({
  id: 'builtin-onepager-limpo',
  name: 'One-pager Limpo',
  category: 'Minimalista',
  themeId: 'ocean',
  isBuiltIn: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  deck: [
    {
      layout: 'cover',
      data: {
        title: 'Nome da Iniciativa',
        subtitle: 'Uma frase que resume o valor da proposta',
        author: 'Equipe · 2024',
      },
    },
    {
      layout: 'agenda',
      data: {
        title: 'O Essencial',
        bullets: [
          'O quê: descrição objetiva do que se propõe fazer',
          'Por quê: problema real que justifica a iniciativa',
          'Como: abordagem de execução em linhas gerais',
          'Quando: prazo e marcos esperados',
        ],
      },
    },
    {
      layout: 'quote',
      data: {
        quote: 'Clareza é a forma mais poderosa de comunicação executiva.',
        attribution: 'Princípio da comunicação eficaz',
      },
    },
  ],
});

// ── Institucional ───────────────────────────────────────────────

const institucionalGerdau = (): TemplateDefinition => ({
  id: 'builtin-institucional-gerdau',
  name: 'Institucional Gerdau',
  category: 'Institucional',
  themeId: 'gerdau',
  isBuiltIn: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  deck: [
    {
      layout: 'cover',
      data: {
        title: 'Apresentação Institucional',
        subtitle: 'Gerdau — Aço para o desenvolvimento sustentável',
        author: 'Comunicação Corporativa · 2026',
      },
    },
    {
      layout: 'agenda',
      data: {
        title: 'Agenda',
        bullets: [
          'Quem somos',
          'Nossa jornada e presença global',
          'Resultados do período',
          'Nós vs. mercado',
          'Compromisso com a sustentabilidade',
          'Próximos passos',
        ],
      },
    },
    {
      layout: 'section',
      data: { title: '01 · Quem Somos', subtitle: 'Mais de 120 anos construindo o futuro' },
    },
    {
      layout: 'content',
      data: {
        title: 'Quem Somos',
        bulletIcons: ['Factory', 'Globe', 'Users', 'Recycle'],
        bullets: [
          'Uma das maiores produtoras de aço das Américas',
          'Presença industrial em mais de 10 países',
          'Mais de 30 mil colaboradores comprometidos com a excelência',
          'Líder em reciclagem de sucata metálica na América Latina',
        ],
      },
    },
    {
      layout: 'section',
      data: { title: '02 · Resultados', subtitle: 'Desempenho do período' },
    },
    {
      layout: 'metrics',
      data: {
        title: 'Resultados do Período',
        metrics: [
          { value: '↑', label: 'receita líquida', delta: 'crescimento consistente' },
          { value: '↑', label: 'EBITDA ajustado', delta: 'acima do guidance' },
          { value: '↓ CO2/t', label: 'emissões por tonelada produzida' },
          { value: '↑', label: 'investimento em inovação e descarbonização' },
        ],
      },
    },
    {
      layout: 'comparison',
      data: {
        title: 'Nós vs. Mercado',
        leftTitle: 'Gerdau',
        leftContent: 'Produção verticalizada\nAço com maior teor reciclado\nPresença em 10+ países\nInvestimento contínuo em ESG',
        rightTitle: 'Média do Setor',
        rightContent: 'Cadeia fragmentada\nMenor índice de reciclagem\nPresença regional limitada\nESG como iniciativa pontual',
      },
    },
    {
      layout: 'quote',
      data: {
        quote: 'Aço é a base do desenvolvimento. Nosso compromisso é construir esse futuro de forma sustentável.',
        attribution: 'Liderança Executiva Gerdau',
      },
    },
    {
      layout: 'closing',
      data: { title: 'Obrigado', subtitle: 'contato@gerdau.com · gerdau.com' },
    },
  ],
});

// ── Array de templates embutidos ─────────────────────────────────

export const BUILT_IN_TEMPLATES: TemplateDefinition[] = [
  pitchStartup(),
  relatorioTrimestral(),
  propostaComercial(),
  aulaIntrodutoria(),
  materialTreinamento(),
  apresentacaoAcademica(),
  portfolioCriativo(),
  lancamentoProduto(),
  propostaBranding(),
  reuniaoExecutiva(),
  statusReport(),
  onePageLimpo(),
  institucionalGerdau(),
];

// ── localStorage helpers ─────────────────────────────────────────

const STORAGE_KEY = 'vizu_templates';

export function getTemplateStorage(): TemplateDefinition[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as TemplateDefinition[];
  } catch {
    return [];
  }
}

export function saveTemplate(t: TemplateDefinition): void {
  if (typeof window === 'undefined') return;
  const all = getTemplateStorage();
  const idx = all.findIndex((x) => x.id === t.id);
  if (idx >= 0) {
    all[idx] = t;
  } else {
    all.push(t);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteTemplate(id: string): void {
  if (typeof window === 'undefined') return;
  const all = getTemplateStorage().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getAllTemplates(): TemplateDefinition[] {
  return [...BUILT_IN_TEMPLATES, ...getTemplateStorage()];
}

// ── Preview: materializa o deck em Slide[] real (mesmo motor da IA) ──

export function materializeTemplate(template: TemplateDefinition): import('@/types/slide').Slide[] {
  const theme = getThemeById(template.themeId);
  return template.deck.map((spec: AISlideSpec) => buildSlideFromSpec(spec, theme));
}

// ── Cria presentation a partir de template ───────────────────────

export function createPresentationFromTemplate(templateId: string): Presentation | null {
  const all = getAllTemplates();
  const template = all.find((t) => t.id === templateId);
  if (!template) return null;

  const theme = getThemeById(template.themeId);
  const now = new Date().toISOString();

  const presentation: Presentation = {
    id: uuid(),
    title: template.name,
    theme,
    slides: template.deck.map((spec) => buildSlideFromSpec(spec, theme)),
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: '1.0',
    },
  };

  return presentation;
}
