import { v4 as uuid } from 'uuid';
import type { Slide, Presentation } from '@/types/slide';
import { buildSlideFromSpec } from '@/lib/templates';
import { getThemeById } from '@/lib/themes';

export interface VisuTemplate {
  id: string;
  name: string;
  category: 'Negócios' | 'Educação' | 'Criativo' | 'Minimalista';
  slides: Slide[];
  themeId: string;
  isBuiltIn: boolean;
  createdAt: string;
}

// ── Negócios ────────────────────────────────────────────────────

const pitchStartup = (): VisuTemplate => {
  const theme = getThemeById('midnight');
  return {
    id: 'builtin-pitch-startup',
    name: 'Pitch de Startup',
    category: 'Negócios',
    themeId: 'midnight',
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    slides: [
      buildSlideFromSpec({
        layout: 'cover',
        data: {
          title: 'Nome da Startup',
          subtitle: 'A solução que o mercado estava esperando',
          author: 'Fundador · 2024',
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'O Problema',
          bullets: [
            'Mercado atual não resolve X de forma eficiente',
            'Usuários perdem tempo e dinheiro com soluções fragmentadas',
            'Oportunidade de R$ 10 bilhões ignorada pelos grandes players',
          ],
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'Nossa Solução',
          bullets: [
            'Plataforma unificada que resolve X em minutos, não horas',
            'IA generativa reduz custo operacional em 60%',
            'Integração nativa com ferramentas já usadas pelo cliente',
          ],
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'comparison',
        data: {
          title: 'Nós vs. Concorrência',
          leftTitle: 'Nossa Solução',
          leftContent: 'Setup em 5 minutos\nPreço acessível\nSuporte 24/7\nIA embutida',
          rightTitle: 'Concorrentes',
          rightContent: 'Implementação complexa\nContratos longos\nSuporte limitado\nManual e lento',
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'closing',
        data: {
          title: 'Vamos construir juntos?',
          subtitle: 'contato@startup.com · (11) 9 9999-0000',
        },
      }, theme),
    ],
  };
};

const relatorioTrimestral = (): VisuTemplate => {
  const theme = getThemeById('slate');
  return {
    id: 'builtin-relatorio-trimestral',
    name: 'Relatório Trimestral',
    category: 'Negócios',
    themeId: 'slate',
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    slides: [
      buildSlideFromSpec({
        layout: 'cover',
        data: {
          title: 'Relatório Q3 2024',
          subtitle: 'Resultados e perspectivas para o próximo trimestre',
          author: 'Diretoria Executiva · Outubro 2024',
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'Destaques do Trimestre',
          bullets: [
            'Receita cresceu 24% em relação ao Q2 — meta superada',
            'Novos clientes: 142 contratos fechados (+38%)',
            'NPS subiu de 67 para 81 pontos',
            'Lançamento do módulo Analytics com alta adesão',
          ],
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'comparison',
        data: {
          title: 'Q2 vs. Q3 — Indicadores Chave',
          leftTitle: 'Q2 2024',
          leftContent: 'Receita: R$ 4,2M\nNovos clientes: 103\nChurn: 3,1%\nNPS: 67',
          rightTitle: 'Q3 2024',
          rightContent: 'Receita: R$ 5,2M\nNovos clientes: 142\nChurn: 2,4%\nNPS: 81',
        },
      }, theme),
      buildSlideFromSpec({
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
      }, theme),
    ],
  };
};

const propostaComercial = (): VisuTemplate => {
  const theme = getThemeById('ocean');
  return {
    id: 'builtin-proposta-comercial',
    name: 'Proposta Comercial',
    category: 'Negócios',
    themeId: 'ocean',
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    slides: [
      buildSlideFromSpec({
        layout: 'cover',
        data: {
          title: 'Proposta de Parceria',
          subtitle: 'Soluções personalizadas para acelerar seus resultados',
          author: 'Equipe Comercial · 2024',
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'Entendemos seu Desafio',
          bullets: [
            'Processos manuais consomem tempo valioso da equipe',
            'Falta de visibilidade em tempo real dos indicadores',
            'Dificuldade de escalar sem aumentar custo proporcional',
          ],
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'Nossa Proposta de Valor',
          bullets: [
            'Implementação em até 30 dias com acompanhamento dedicado',
            'Dashboard em tempo real integrado ao seu ERP existente',
            'Redução de 40% no tempo de processos administrativos',
            'ROI comprovado em 6 meses — garantia contratual',
          ],
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'closing',
        data: {
          title: 'Próximo Passo: Reunião de Kick-off',
          subtitle: 'Estamos prontos para começar quando você quiser',
        },
      }, theme),
    ],
  };
};

// ── Educação ─────────────────────────────────────────────────────

const aulaIntrodutoria = (): VisuTemplate => {
  const theme = getThemeById('forest');
  return {
    id: 'builtin-aula-introdutoria',
    name: 'Aula Introdutória',
    category: 'Educação',
    themeId: 'forest',
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    slides: [
      buildSlideFromSpec({
        layout: 'cover',
        data: {
          title: 'Introdução ao Tema',
          subtitle: 'Fundamentos, conceitos e aplicações práticas',
          author: 'Prof. Nome Sobrenome · Disciplina',
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'O que vamos aprender hoje',
          bullets: [
            'Conceitos fundamentais e definições essenciais',
            'Contexto histórico e evolução do tema',
            'Aplicações práticas no dia a dia profissional',
            'Exercícios para fixar o conteúdo',
          ],
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'section',
        data: {
          title: 'Parte 1: Fundamentos',
          subtitle: 'Base conceitual para entender o restante da aula',
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'Conceitos-chave',
          bullets: [
            'Conceito A: definição clara e objetiva do primeiro pilar',
            'Conceito B: como ele se relaciona com o anterior',
            'Conceito C: a síntese que une os dois anteriores',
          ],
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'closing',
        data: {
          title: 'Dúvidas?',
          subtitle: 'Próxima aula: aprofundamento em casos práticos',
        },
      }, theme),
    ],
  };
};

const materialTreinamento = (): VisuTemplate => {
  const theme = getThemeById('slate');
  return {
    id: 'builtin-material-treinamento',
    name: 'Material de Treinamento',
    category: 'Educação',
    themeId: 'slate',
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    slides: [
      buildSlideFromSpec({
        layout: 'cover',
        data: {
          title: 'Treinamento: Nome do Programa',
          subtitle: 'Capacitação corporativa — módulo inicial',
          author: 'RH & Desenvolvimento · 2024',
        },
      }, theme),
      buildSlideFromSpec({
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
      }, theme),
      buildSlideFromSpec({
        layout: 'comparison',
        data: {
          title: 'Antes vs. Depois do Treinamento',
          leftTitle: 'Antes',
          leftContent: 'Processos desconhecidos\nDependência constante\nErros evitáveis\nBaixa produtividade',
          rightTitle: 'Depois',
          rightContent: 'Processos dominados\nAutonomia completa\nQualidade garantida\nAlta performance',
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'Agenda do Programa',
          bullets: [
            'Semana 1: Onboarding e cultura organizacional',
            'Semana 2: Ferramentas e sistemas internos',
            'Semana 3: Processos e fluxos de trabalho',
            'Semana 4: Projeto prático com mentor',
          ],
        },
      }, theme),
    ],
  };
};

const apresentacaoAcademica = (): VisuTemplate => {
  const theme = getThemeById('mono');
  return {
    id: 'builtin-apresentacao-academica',
    name: 'Apresentação Acadêmica',
    category: 'Educação',
    themeId: 'mono',
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    slides: [
      buildSlideFromSpec({
        layout: 'cover',
        data: {
          title: 'Título do Trabalho Acadêmico',
          subtitle: 'Subtítulo ou área de pesquisa',
          author: 'Autor · Instituição · 2024',
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'Introdução e Justificativa',
          bullets: [
            'Contextualização do problema de pesquisa',
            'Relevância e lacuna identificada na literatura',
            'Pergunta de pesquisa norteadora do trabalho',
          ],
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'Metodologia',
          bullets: [
            'Abordagem: pesquisa qualitativa exploratória',
            'Corpus: 47 artigos selecionados via revisão sistemática',
            'Análise: codificação temática com software NVivo',
          ],
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'Resultados e Discussão',
          bullets: [
            'Três categorias temáticas emergentes dos dados',
            'Convergência com autores X e Y; divergência com Z',
            'Implicações teóricas e práticas identificadas',
          ],
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'closing',
        data: {
          title: 'Obrigado',
          subtitle: 'autor@instituicao.edu.br',
        },
      }, theme),
    ],
  };
};

// ── Criativo ─────────────────────────────────────────────────────

const portfolioCriativo = (): VisuTemplate => {
  const theme = getThemeById('rose');
  return {
    id: 'builtin-portfolio-criativo',
    name: 'Portfolio Criativo',
    category: 'Criativo',
    themeId: 'rose',
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    slides: [
      buildSlideFromSpec({
        layout: 'cover',
        data: {
          title: 'Meu Portfolio',
          subtitle: 'Design · Branding · Experiência do Usuário',
          author: 'Seu Nome · 2024',
        },
      }, theme),
      buildSlideFromSpec({
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
      }, theme),
      buildSlideFromSpec({
        layout: 'section',
        data: {
          title: 'Projetos Selecionados',
          subtitle: '2022 — 2024',
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'Projeto Destaque: Rebrand FinTech',
          bullets: [
            'Redesign completo de identidade visual e aplicações',
            'Nova paleta, tipografia e sistema de ícones proprietário',
            'Resultado: +34% em reconhecimento de marca (pesquisa pós-lançamento)',
          ],
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'closing',
        data: {
          title: "Vamos criar algo incrível?",
          subtitle: 'hello@seuportfolio.com',
        },
      }, theme),
    ],
  };
};

const lancamentoProduto = (): VisuTemplate => {
  const theme = getThemeById('midnight');
  return {
    id: 'builtin-lancamento-produto',
    name: 'Lançamento de Produto',
    category: 'Criativo',
    themeId: 'midnight',
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    slides: [
      buildSlideFromSpec({
        layout: 'cover',
        data: {
          title: 'Apresentando: Nome do Produto',
          subtitle: 'A experiência que vai mudar como você faz X',
          author: 'Equipe de Produto · Lançamento 2024',
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'quote',
        data: {
          quote: 'A melhor experiência é aquela que o usuário nem percebe — simplesmente funciona.',
          attribution: 'Princípio de design do produto',
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'Funcionalidades Principais',
          bullets: [
            'Interface fluida — zero curva de aprendizado',
            'Sincronização em tempo real entre todos os dispositivos',
            'Personalização inteligente que aprende com o uso',
            'Offline-first — funciona sem conexão com internet',
          ],
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'closing',
        data: {
          title: 'Disponível agora',
          subtitle: 'produto.com · Plano gratuito para sempre',
        },
      }, theme),
    ],
  };
};

const propostaBranding = (): VisuTemplate => {
  const theme = getThemeById('rose');
  return {
    id: 'builtin-proposta-branding',
    name: 'Proposta de Branding',
    category: 'Criativo',
    themeId: 'rose',
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    slides: [
      buildSlideFromSpec({
        layout: 'cover',
        data: {
          title: 'Proposta de Identidade Visual',
          subtitle: 'Construindo uma marca que ressoa e permanece',
          author: 'Estúdio de Design · 2024',
        },
      }, theme),
      buildSlideFromSpec({
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
      }, theme),
      buildSlideFromSpec({
        layout: 'comparison',
        data: {
          title: 'Posicionamento da Marca',
          leftTitle: 'Percepção Atual',
          leftContent: 'Visual desatualizado\nMensagem inconsistente\nIdentidade fraca\nBaixa memorabilidade',
          rightTitle: 'Novo Posicionamento',
          rightContent: 'Visual moderno e único\nVoz clara e coesa\nIdentidade forte\nMarca memorável',
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'Cronograma e Entregáveis',
          bullets: [
            'Semana 1-2: Pesquisa, briefing e referências',
            'Semana 3-4: Conceitos iniciais e apresentação',
            'Semana 5-6: Refinamento e ajustes finais',
            'Semana 7: Entrega do pacote completo + manual de marca',
          ],
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'closing',
        data: {
          title: 'Pronto para transformar sua marca?',
          subtitle: 'studio@branding.com · +55 11 9 9000-0000',
        },
      }, theme),
    ],
  };
};

// ── Minimalista ──────────────────────────────────────────────────

const reuniaoExecutiva = (): VisuTemplate => {
  const theme = getThemeById('mono');
  return {
    id: 'builtin-reuniao-executiva',
    name: 'Reunião Executiva',
    category: 'Minimalista',
    themeId: 'mono',
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    slides: [
      buildSlideFromSpec({
        layout: 'cover',
        data: {
          title: 'Reunião de Diretoria',
          subtitle: 'Pauta estratégica — revisão mensal',
          author: 'CEO · Outubro 2024',
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'Pauta de Hoje',
          bullets: [
            '1. Revisão de resultados do mês anterior',
            '2. Aprovação do orçamento Q4',
            '3. Decisão sobre expansão geográfica',
            '4. Atualização sobre contratações estratégicas',
          ],
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'Pontos de Atenção',
          bullets: [
            'Margem operacional abaixo do target: ação necessária',
            'Dois headcounts críticos ainda em aberto',
            'Prazo do contrato com fornecedor X vence em novembro',
          ],
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'closing',
        data: {
          title: 'Próxima reunião: 14/11',
          subtitle: 'Ata será enviada em até 24h',
        },
      }, theme),
    ],
  };
};

const statusReport = (): VisuTemplate => {
  const theme = getThemeById('slate');
  return {
    id: 'builtin-status-report',
    name: 'Status Report',
    category: 'Minimalista',
    themeId: 'slate',
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    slides: [
      buildSlideFromSpec({
        layout: 'cover',
        data: {
          title: 'Status do Projeto',
          subtitle: 'Atualização semanal — semana 42/2024',
          author: 'Gerente de Projeto',
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'Resumo Executivo',
          bullets: [
            'Status geral: no prazo e dentro do orçamento',
            'Marcos concluídos esta semana: 3 de 3 planejados',
            'Riscos ativos: 1 risco médio em monitoramento',
            'Próximo marco: entrega da fase 2 em 15 dias',
          ],
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'comparison',
        data: {
          title: 'Planejado vs. Realizado',
          leftTitle: 'Planejado',
          leftContent: 'Sprint: 8 tarefas\nBug fixes: 5\nReuniões: 3\nDocumentação: 2 docs',
          rightTitle: 'Realizado',
          rightContent: 'Sprint: 9 tarefas\nBug fixes: 7\nReuniões: 3\nDocumentação: 2 docs',
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'Próxima Semana',
          bullets: [
            'Iniciar testes de integração com sistema legado',
            'Code review das features de autenticação',
            'Reunião de alinhamento com stakeholder na quinta',
          ],
        },
      }, theme),
    ],
  };
};

const onePageLimpo = (): VisuTemplate => {
  const theme = getThemeById('ocean');
  return {
    id: 'builtin-onepager-limpo',
    name: 'One-pager Limpo',
    category: 'Minimalista',
    themeId: 'ocean',
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    slides: [
      buildSlideFromSpec({
        layout: 'cover',
        data: {
          title: 'Nome da Iniciativa',
          subtitle: 'Uma frase que resume o valor da proposta',
          author: 'Equipe · 2024',
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'content',
        data: {
          title: 'O Essencial',
          bullets: [
            'O quê: descrição objetiva do que se propõe fazer',
            'Por quê: problema real que justifica a iniciativa',
            'Como: abordagem de execução em linhas gerais',
            'Quando: prazo e marcos esperados',
          ],
        },
      }, theme),
      buildSlideFromSpec({
        layout: 'quote',
        data: {
          quote: 'Clareza é a forma mais poderosa de comunicação executiva.',
          attribution: 'Princípio da comunicação eficaz',
        },
      }, theme),
    ],
  };
};

// ── Array de templates embutidos ─────────────────────────────────

export const BUILT_IN_TEMPLATES: VisuTemplate[] = [
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
];

// ── localStorage helpers ─────────────────────────────────────────

const STORAGE_KEY = 'vizu_templates';

export function getTemplateStorage(): VisuTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as VisuTemplate[];
  } catch {
    return [];
  }
}

export function saveTemplate(t: VisuTemplate): void {
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

export function getAllTemplates(): VisuTemplate[] {
  return [...BUILT_IN_TEMPLATES, ...getTemplateStorage()];
}

// ── Cria presentation a partir de template ───────────────────────

function deepCloneWithNewIds(slides: Slide[]): Slide[] {
  return slides.map((slide) => ({
    ...slide,
    id: uuid(),
    elements: slide.elements.map((el) => ({ ...el, id: uuid() })),
  }));
}

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
    slides: deepCloneWithNewIds(template.slides),
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: '1.0',
    },
  };

  return presentation;
}
