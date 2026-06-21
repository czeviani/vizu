import { NextResponse } from 'next/server';

/**
 * GET /api/vizu-ai/comandos
 *
 * Retorna a referência completa de todos os comandos disponíveis no endpoint /execute.
 */
export async function GET() {
  const comandos = [
    {
      cmd: 'criar_apresentacao',
      descricao: 'Inicializa uma nova apresentação do zero. Deve ser o primeiro comando quando não há apresentação inicial.',
      parametros: [
        { nome: 'nome', tipo: 'string', obrigatorio: true, descricao: 'Título da apresentação' },
        { nome: 'tema', tipo: 'string', obrigatorio: false, descricao: 'ID do tema (slate, midnight, forest, rose, ocean, mono). Padrão: slate' },
        { nome: 'autor', tipo: 'string', obrigatorio: false, descricao: 'Nome do autor' },
        { nome: 'descricao', tipo: 'string', obrigatorio: false, descricao: 'Descrição da apresentação' },
        { nome: 'tags', tipo: 'string[]', obrigatorio: false, descricao: 'Tags para categorização' },
      ],
      efeito: 'Cria um objeto Presentation com ID novo, slides vazio e tema selecionado.',
      exemplo: { cmd: 'criar_apresentacao', nome: 'Revisão Q3 2026', tema: 'midnight', autor: 'Caique Zeviani' },
    },
    {
      cmd: 'definir_titulo',
      descricao: 'Altera o título da apresentação em qualquer momento.',
      parametros: [
        { nome: 'titulo', tipo: 'string', obrigatorio: true, descricao: 'Novo título' },
      ],
      efeito: 'Atualiza presentation.title.',
      exemplo: { cmd: 'definir_titulo', titulo: 'Estratégia de Crescimento 2026' },
    },
    {
      cmd: 'definir_tema',
      descricao: 'Troca o tema da apresentação por ID preset ou personaliza cores e fontes.',
      parametros: [
        { nome: 'tema', tipo: 'string', obrigatorio: true, descricao: 'ID do tema preset ou "custom" para cores manuais' },
        { nome: 'cores', tipo: 'ThemeColors parcial', obrigatorio: false, descricao: 'Override de tokens de cor' },
        { nome: 'fontes', tipo: '{ heading?, body? }', obrigatorio: false, descricao: 'Override de fontes' },
      ],
      efeito: 'Atualiza presentation.theme. Não propaga automaticamente para elementos já criados.',
      exemplo: { cmd: 'definir_tema', tema: 'forest', cores: { accent: '#ff6b35' } },
    },
    {
      cmd: 'adicionar_slide',
      descricao: 'Adiciona um slide usando um dos 7 layouts disponíveis com dados para preencher os elementos do template.',
      parametros: [
        { nome: 'layout', tipo: 'LayoutType', obrigatorio: true, descricao: 'blank | cover | section | content | comparison | quote | closing' },
        { nome: 'dados', tipo: 'DadosSlide', obrigatorio: false, descricao: 'Campos em português (titulo, subtitulo, autor, data, bullets, conteudo, titulo_esq, conteudo_esq, titulo_dir, conteudo_dir, citacao, atribuicao) ou inglês (title, subtitle, ...)' },
        { nome: 'background', tipo: 'SlideBackground parcial', obrigatorio: false, descricao: 'Override do fundo (type: color|gradient|image)' },
        { nome: 'posicao', tipo: 'number', obrigatorio: false, descricao: 'Índice de inserção (0 = primeiro). Padrão: final da lista' },
      ],
      efeito: 'Gera um Slide com elementos pré-posicionados pelo template e insere na posição indicada.',
      exemplo: {
        cmd: 'adicionar_slide',
        layout: 'content',
        dados: { titulo: 'Principais Métricas', bullets: ['Receita +40%', 'NPS 84', 'Churn 1.2%'] },
      },
    },
    {
      cmd: 'remover_slide',
      descricao: 'Remove um slide da apresentação.',
      parametros: [
        { nome: 'slide_id', tipo: 'string', obrigatorio: false, descricao: 'UUID do slide' },
        { nome: 'slide_indice', tipo: 'number', obrigatorio: false, descricao: 'Índice 0-based. Padrão se nenhum fornecido: último slide' },
      ],
      notas: 'Forneça slide_id OU slide_indice.',
      efeito: 'Remove o slide e todos os seus elementos.',
      exemplo: { cmd: 'remover_slide', slide_indice: 2 },
    },
    {
      cmd: 'duplicar_slide',
      descricao: 'Duplica um slide gerando novos UUIDs para o slide e todos os elementos.',
      parametros: [
        { nome: 'slide_id', tipo: 'string', obrigatorio: false },
        { nome: 'slide_indice', tipo: 'number', obrigatorio: false },
      ],
      efeito: 'Insere o clone imediatamente após o slide original.',
      exemplo: { cmd: 'duplicar_slide', slide_indice: 0 },
    },
    {
      cmd: 'mover_slide',
      descricao: 'Move um slide para uma posição específica.',
      parametros: [
        { nome: 'slide_id', tipo: 'string', obrigatorio: false },
        { nome: 'slide_indice', tipo: 'number', obrigatorio: false },
        { nome: 'para_posicao', tipo: 'number', obrigatorio: true, descricao: 'Novo índice 0-based' },
      ],
      efeito: 'Reposiciona o slide na lista.',
      exemplo: { cmd: 'mover_slide', slide_indice: 3, para_posicao: 1 },
    },
    {
      cmd: 'reordenar_slides',
      descricao: 'Reordena todos os slides fornecendo um array com os IDs na nova ordem.',
      parametros: [
        { nome: 'ordem', tipo: 'string[]', obrigatorio: true, descricao: 'Array com todos os slide IDs na ordem desejada' },
      ],
      efeito: 'Slides não incluídos no array são descartados.',
      exemplo: { cmd: 'reordenar_slides', ordem: ['id-slide-3', 'id-slide-1', 'id-slide-2'] },
    },
    {
      cmd: 'editar_slide',
      descricao: 'Edita propriedades de um slide (fundo e notas). Não toca nos elementos.',
      parametros: [
        { nome: 'slide_id', tipo: 'string', obrigatorio: false },
        { nome: 'slide_indice', tipo: 'number', obrigatorio: false },
        { nome: 'background', tipo: 'SlideBackground parcial', obrigatorio: false, descricao: 'Novo fundo. Merge com fundo existente' },
        { nome: 'notas', tipo: 'string', obrigatorio: false, descricao: 'Notas do apresentador' },
      ],
      exemplos: [
        { cmd: 'editar_slide', slide_indice: 0, background: { type: 'color', color: '#1e293b' } },
        { cmd: 'editar_slide', slide_indice: 2, background: { type: 'gradient', gradient: { from: '#3b82f6', to: '#1e293b', direction: 135 } } },
      ],
    },
    {
      cmd: 'adicionar_elemento',
      descricao: 'Adiciona um elemento customizado a um slide. Use quando o layout não oferece o elemento desejado.',
      parametros: [
        { nome: 'slide_id', tipo: 'string', obrigatorio: false },
        { nome: 'slide_indice', tipo: 'number', obrigatorio: false, descricao: 'Padrão: último slide' },
        { nome: 'tipo', tipo: 'ElementType', obrigatorio: true, descricao: 'text | shape | icon | image | line' },
        {
          nome: 'props',
          tipo: 'PropsElemento',
          obrigatorio: true,
          descricao: 'Propriedades do elemento. Aceita posicao semântica OU x/y/width/height absolutos.',
          campos_por_tipo: {
            text: ['conteudo (obrig)', 'estilo.fontFamily', 'estilo.fontSize', 'estilo.fontWeight', 'estilo.color', 'estilo.textAlign', 'x/y/width/height ou posicao'],
            shape: ['forma (obrig)', 'preenchimento (obrig)', 'borda', 'sombra', 'x/y/width/height ou posicao'],
            icon: ['nome_icone (obrig)', 'cor (obrig)', 'x/y/width/height ou posicao'],
            image: ['src (obrig)', 'alt', 'ajuste', 'x/y/width/height ou posicao'],
            line: ['cor', 'espessura', 'estilo_linha', 'seta_inicio', 'seta_fim', 'x/y/width/height'],
          },
        },
      ],
      posicoes_semanticas: [
        'centro', 'topo', 'rodape', 'col_esquerda', 'col_direita',
        'topo_esquerda', 'topo_direita', 'canto_inferior_esq', 'canto_inferior_dir',
        'largura_total', 'area_conteudo',
      ],
      exemplos: [
        {
          descricao: 'Adicionar ícone no canto superior direito',
          cmd: 'adicionar_elemento', slide_indice: 1, tipo: 'icon',
          props: { nome_icone: 'TrendingUp', cor: '#10b981', posicao: 'topo_direita', width: 60, height: 60 },
        },
        {
          descricao: 'Adicionar número grande destacado no centro',
          cmd: 'adicionar_elemento', slide_indice: 2, tipo: 'text',
          props: {
            conteudo: '+40%',
            posicao: 'centro',
            estilo: { fontSize: 96, fontWeight: 800, color: '#10b981', textAlign: 'center' },
          },
        },
        {
          descricao: 'Adicionar linha separadora',
          cmd: 'adicionar_elemento', slide_indice: 0, tipo: 'line',
          props: { cor: '#e2e8f0', espessura: 2, x: 80, y: 400, width: 800, height: 2 },
        },
      ],
    },
    {
      cmd: 'editar_elemento',
      descricao: 'Edita propriedades de um elemento existente. Faz deep merge — apenas os campos fornecidos são alterados.',
      parametros: [
        { nome: 'slide_id', tipo: 'string', obrigatorio: false },
        { nome: 'slide_indice', tipo: 'number', obrigatorio: false, descricao: 'Padrão: último slide' },
        { nome: 'elemento_id', tipo: 'string', obrigatorio: false, descricao: 'UUID do elemento' },
        { nome: 'elemento_indice', tipo: 'number', obrigatorio: false, descricao: 'Índice 0-based do elemento no slide' },
        { nome: 'props', tipo: 'Record<string, unknown>', obrigatorio: true, descricao: 'Propriedades a atualizar (deep merge)' },
      ],
      notas: 'Forneça elemento_id OU elemento_indice.',
      exemplos: [
        { cmd: 'editar_elemento', slide_indice: 0, elemento_indice: 1, props: { content: 'Novo Título', style: { fontSize: 60 } } },
        { cmd: 'editar_elemento', slide_indice: 1, elemento_id: 'uuid-do-elemento', props: { opacity: 0.8 } },
      ],
    },
    {
      cmd: 'remover_elemento',
      descricao: 'Remove um elemento de um slide.',
      parametros: [
        { nome: 'slide_id', tipo: 'string', obrigatorio: false },
        { nome: 'slide_indice', tipo: 'number', obrigatorio: false },
        { nome: 'elemento_id', tipo: 'string', obrigatorio: false },
        { nome: 'elemento_indice', tipo: 'number', obrigatorio: false },
      ],
      exemplo: { cmd: 'remover_elemento', slide_indice: 2, elemento_indice: 0 },
    },
  ];

  return NextResponse.json({
    endpoint: 'POST /api/vizu-ai/execute',
    total_comandos: comandos.length,
    comandos,
    notas_gerais: [
      'Os comandos são executados em ordem. O estado é acumulado entre comandos.',
      'slide_indice e elemento_indice são 0-based.',
      'Quando slide_id e slide_indice ambos omitidos em edição/remoção, usa o último slide.',
      'O endpoint retorna o JSON completo da apresentação + log de execução + array de erros.',
      'Erros em um comando não interrompem os comandos seguintes (execução parcial com HTTP 207).',
    ],
  });
}
