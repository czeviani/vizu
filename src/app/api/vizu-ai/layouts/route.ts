import { NextResponse } from 'next/server';

/**
 * GET /api/vizu-ai/layouts
 *
 * Retorna todos os layouts disponíveis com descrição dos elementos que contêm.
 * A IA deve consultar este endpoint antes de estruturar os slides.
 */
export async function GET() {
  const layouts = [
    {
      id: 'blank',
      nome: 'Em Branco',
      descricao: 'Canvas vazio. Use quando quiser posicionar todos os elementos manualmente.',
      elementos_gerados: [],
      campos_dados: [],
      uso_tipico: 'Slides com layout totalmente customizado.',
    },
    {
      id: 'cover',
      nome: 'Capa',
      descricao: 'Título grande centralizado-esquerdo, subtítulo, meta (autor/data) e forma decorativa no canto direito. Barra de acento na base.',
      elementos_gerados: [
        { papel: 'forma_acento', tipo: 'shape', descricao: 'Barra horizontal na base do slide (cor primary)', posicao: { x: 0, y: 532, width: 960, height: 8 } },
        { papel: 'titulo', tipo: 'text', descricao: 'Título principal (fontSize 52, bold)', posicao: { x: 80, y: 160, width: 800, height: 120 } },
        { papel: 'subtitulo', tipo: 'text', descricao: 'Subtítulo (fontSize 22, textSecondary)', posicao: { x: 80, y: 295, width: 660, height: 60 }, condicional: true },
        { papel: 'meta', tipo: 'text', descricao: 'Autor · Data (fontSize 14, uppercase, textSecondary)', posicao: { x: 80, y: 420, width: 400, height: 40 }, condicional: true },
        { papel: 'forma_decorativa', tipo: 'shape', descricao: 'Retângulo arredondado decorativo no canto superior direito (primary, opacity 8%)', posicao: { x: 680, y: 80, width: 240, height: 360 } },
      ],
      campos_dados: [
        { campo: 'titulo', portugues: 'titulo', obrigatorio: false, descricao: 'Título principal', exemplo: 'Estratégia Q3 2026' },
        { campo: 'subtitulo', portugues: 'subtitulo', obrigatorio: false, descricao: 'Subtítulo', exemplo: 'Revisão de Resultados' },
        { campo: 'autor', portugues: 'autor', obrigatorio: false, descricao: 'Nome do autor', exemplo: 'Caique Zeviani' },
        { campo: 'data', portugues: 'data', obrigatorio: false, descricao: 'Data ou período', exemplo: 'Junho 2026' },
      ],
      uso_tipico: 'Primeiro slide — identifica a apresentação.',
    },
    {
      id: 'section',
      nome: 'Seção',
      descricao: 'Fundo preenchido com cor primary, título centralizado em branco. Ideal para separar seções temáticas.',
      elementos_gerados: [
        { papel: 'fundo', tipo: 'shape', descricao: 'Retângulo cobrindo 100% do slide (cor primary)', posicao: { x: 0, y: 0, width: 960, height: 540 } },
        { papel: 'titulo', tipo: 'text', descricao: 'Título centralizado (fontSize 44, bold, branco)', posicao: { x: 80, y: 210, width: 800, height: 120 } },
        { papel: 'subtitulo', tipo: 'text', descricao: 'Subtítulo centralizado (fontSize 18, branco 80%)', posicao: { x: 160, y: 340, width: 640, height: 50 }, condicional: true },
      ],
      campos_dados: [
        { campo: 'titulo', portugues: 'titulo', obrigatorio: false, descricao: 'Título da seção', exemplo: 'Resultados Financeiros' },
        { campo: 'subtitulo', portugues: 'subtitulo', obrigatorio: false, descricao: 'Subtítulo ou descrição', exemplo: 'Janeiro – Junho 2026' },
      ],
      uso_tipico: 'Divisor entre seções temáticas da apresentação.',
    },
    {
      id: 'content',
      nome: 'Conteúdo',
      descricao: 'Barra vertical de acento à esquerda do título, título, linha divisória horizontal e área de bullets/conteúdo.',
      elementos_gerados: [
        { papel: 'barra_titulo', tipo: 'shape', descricao: 'Barra vertical 4px (cor primary)', posicao: { x: 80, y: 56, width: 4, height: 44 } },
        { papel: 'titulo', tipo: 'text', descricao: 'Título do slide (fontSize 30, bold)', posicao: { x: 96, y: 52, width: 784, height: 52 } },
        { papel: 'divisor', tipo: 'shape', descricao: 'Linha horizontal 1px (cor border)', posicao: { x: 80, y: 114, width: 800, height: 1 } },
        { papel: 'bullets', tipo: 'text', descricao: 'Lista de bullets (fontSize 20, lineHeight 1.8)', posicao: { x: 80, y: 134, width: 800, height: 340 }, condicional: true },
      ],
      campos_dados: [
        { campo: 'titulo', portugues: 'titulo', obrigatorio: false, descricao: 'Título do slide', exemplo: 'Principais Resultados' },
        { campo: 'bullets', portugues: 'bullets', obrigatorio: false, descricao: 'Array de bullets (cada item vira "• item")', exemplo: ['Revenue +18%', 'NPS 72'] },
        { campo: 'conteudo', portugues: 'conteudo', obrigatorio: false, descricao: 'Conteúdo livre (fallback se bullets vazio)', exemplo: 'Texto corrido do slide' },
      ],
      uso_tipico: 'Slides de conteúdo padrão com lista de pontos.',
    },
    {
      id: 'comparison',
      nome: 'Comparação',
      descricao: 'Dois painéis lado a lado com header colorido (primary/accent) e espaço para conteúdo em cada painel.',
      elementos_gerados: [
        { papel: 'titulo', tipo: 'text', descricao: 'Título superior centralizado (fontSize 28)', posicao: { x: 80, y: 36, width: 800, height: 52 }, condicional: true },
        { papel: 'painel_esquerdo', tipo: 'shape', descricao: 'Card do painel esquerdo (surface + borda)', posicao: { x: 40, y: 104, width: 420, height: 400 } },
        { papel: 'barra_esquerda', tipo: 'shape', descricao: 'Barra superior do painel esq (cor primary)', posicao: { x: 40, y: 104, width: 420, height: 8 } },
        { papel: 'titulo_esquerdo', tipo: 'text', descricao: 'Título do painel esquerdo (fontSize 22)', posicao: { x: 56, y: 124, width: 388, height: 48 } },
        { papel: 'conteudo_esquerdo', tipo: 'text', descricao: 'Bullets do painel esquerdo', posicao: { x: 56, y: 180, width: 388, height: 300 }, condicional: true },
        { papel: 'painel_direito', tipo: 'shape', descricao: 'Card do painel direito (surface + borda)', posicao: { x: 500, y: 104, width: 420, height: 400 } },
        { papel: 'barra_direita', tipo: 'shape', descricao: 'Barra superior do painel dir (cor accent)', posicao: { x: 500, y: 104, width: 420, height: 8 } },
        { papel: 'titulo_direito', tipo: 'text', descricao: 'Título do painel direito (fontSize 22)', posicao: { x: 516, y: 124, width: 388, height: 48 } },
        { papel: 'conteudo_direito', tipo: 'text', descricao: 'Bullets do painel direito', posicao: { x: 516, y: 180, width: 388, height: 300 }, condicional: true },
      ],
      campos_dados: [
        { campo: 'titulo', portugues: 'titulo', obrigatorio: false, descricao: 'Título central acima dos painéis', exemplo: 'Comparação de Abordagens' },
        { campo: 'leftTitle', portugues: 'titulo_esq', obrigatorio: false, descricao: 'Título painel esquerdo', exemplo: 'Opção A' },
        { campo: 'leftContent', portugues: 'conteudo_esq', obrigatorio: false, descricao: 'Conteúdo painel esq (quebras de linha separadas por \\n)', exemplo: 'Ponto 1\nPonto 2' },
        { campo: 'rightTitle', portugues: 'titulo_dir', obrigatorio: false, descricao: 'Título painel direito', exemplo: 'Opção B' },
        { campo: 'rightContent', portugues: 'conteudo_dir', obrigatorio: false, descricao: 'Conteúdo painel dir', exemplo: 'Ponto 1\nPonto 2' },
      ],
      uso_tipico: 'Antes/depois, opção A vs B, prós e contras.',
    },
    {
      id: 'quote',
      nome: 'Citação',
      descricao: 'Fundo surface com barra vertical esquerda em primary. Citação em itálico centralizada, atribuição abaixo.',
      elementos_gerados: [
        { papel: 'fundo', tipo: 'shape', descricao: 'Retângulo de fundo (cor surface)', posicao: { x: 0, y: 0, width: 960, height: 540 } },
        { papel: 'barra_lateral', tipo: 'shape', descricao: 'Barra vertical esquerda 8px (cor primary)', posicao: { x: 0, y: 0, width: 8, height: 540 } },
        { papel: 'citacao', tipo: 'text', descricao: 'Texto da citação (fontSize 28, itálico, centralizado)', posicao: { x: 100, y: 170, width: 760, height: 160 } },
        { papel: 'atribuicao', tipo: 'text', descricao: 'Atribuição (fontSize 16, cor primary)', posicao: { x: 100, y: 350, width: 760, height: 40 }, condicional: true },
      ],
      campos_dados: [
        { campo: 'quote', portugues: 'citacao', obrigatorio: false, descricao: 'Texto da citação (sem aspas — adicionadas automaticamente)', exemplo: 'A excelência não é um destino, é uma jornada.' },
        { campo: 'attribution', portugues: 'atribuicao', obrigatorio: false, descricao: 'Autor da citação', exemplo: 'Aristóteles' },
      ],
      uso_tipico: 'Quebra de ritmo, inspiração, depoimento de cliente.',
    },
    {
      id: 'closing',
      nome: 'Encerramento',
      descricao: 'Fundo escuro (cor text), linha de acento no topo, título grande centralizado em branco.',
      elementos_gerados: [
        { papel: 'fundo', tipo: 'shape', descricao: 'Retângulo escuro (cor text)', posicao: { x: 0, y: 0, width: 960, height: 540 } },
        { papel: 'linha_topo', tipo: 'shape', descricao: 'Linha horizontal no topo 6px (cor primary)', posicao: { x: 0, y: 0, width: 960, height: 6 } },
        { papel: 'titulo', tipo: 'text', descricao: 'Título grande (fontSize 56, bold, branco)', posicao: { x: 80, y: 160, width: 800, height: 120 } },
        { papel: 'subtitulo', tipo: 'text', descricao: 'Subtítulo (fontSize 20, branco 60%)', posicao: { x: 160, y: 295, width: 640, height: 60 }, condicional: true },
      ],
      campos_dados: [
        { campo: 'titulo', portugues: 'titulo', obrigatorio: false, descricao: 'Título de encerramento', exemplo: 'Obrigado' },
        { campo: 'subtitulo', portugues: 'subtitulo', obrigatorio: false, descricao: 'Call-to-action ou contato', exemplo: 'caique@empresa.com' },
      ],
      uso_tipico: 'Último slide — agradecimento, contato, próximos passos.',
    },
  ];

  return NextResponse.json({ layouts, total: layouts.length });
}
