import { NextResponse } from 'next/server';
import { ICON_NAMES } from '@/lib/iconPaths';

/**
 * GET /api/vizu-ai/icones
 *
 * Retorna o catálogo completo de ícones disponíveis, organizados por categoria.
 * Use o campo `id` ao referenciar um ícone no comando `adicionar_elemento`.
 */
export async function GET() {
  const categorias = [
    {
      id: 'status',
      nome: 'Status e Feedback',
      icones: ['Star', 'Heart', 'Check', 'X', 'AlertCircle', 'Info', 'Shield', 'Lock'],
      uso: 'Aprovação, avisos, status, segurança.',
    },
    {
      id: 'negocio',
      nome: 'Negócios e Finanças',
      icones: ['TrendingUp', 'TrendingDown', 'BarChart', 'PieChart', 'Activity', 'DollarSign', 'Percent', 'Briefcase'],
      uso: 'Métricas, crescimento, finanças, negócios.',
    },
    {
      id: 'pessoas',
      nome: 'Pessoas e Organizações',
      icones: ['Users', 'User', 'Building', 'Globe', 'Award'],
      uso: 'Equipes, empresa, alcance global, reconhecimento.',
    },
    {
      id: 'comunicacao',
      nome: 'Comunicação',
      icones: ['Mail', 'Phone', 'Link', 'Search', 'Filter'],
      uso: 'Contato, busca, filtragem, conexão.',
    },
    {
      id: 'tempo',
      nome: 'Tempo e Localização',
      icones: ['Calendar', 'Clock', 'Map', 'Flag'],
      uso: 'Datas, prazos, marcos, localização.',
    },
    {
      id: 'tecnologia',
      nome: 'Tecnologia e Dados',
      icones: ['Code', 'Layers', 'Grid', 'List', 'Package'],
      uso: 'Software, arquitetura, organização, dados.',
    },
    {
      id: 'acoes',
      nome: 'Ações e Navegação',
      icones: ['Download', 'Upload', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ChevronRight'],
      uso: 'Fluxo, navegação, importação/exportação.',
    },
    {
      id: 'conceitos',
      nome: 'Conceitos e Inspiração',
      icones: ['Zap', 'Target', 'Lightbulb', 'Rocket', 'Key'],
      uso: 'Energia, objetivos, inovação, acesso.',
    },
  ];

  const todos = ICON_NAMES.map((nome) => ({
    id: nome,
    categoria: encontrarCategoria(nome, categorias),
    uso_tipico: encontrarUso(nome),
  }));

  return NextResponse.json({
    icones: todos,
    categorias,
    total: todos.length,
    instrucoes: 'Use o campo "id" do ícone no parâmetro "nome_icone" do comando adicionar_elemento.',
    exemplo: {
      cmd: 'adicionar_elemento',
      slide_indice: 1,
      tipo: 'icon',
      props: {
        nome_icone: 'TrendingUp',
        cor: '#10b981',
        posicao: 'topo_direita',
        width: 80,
        height: 80,
      },
    },
  });
}

function encontrarCategoria(nome: string, categorias: { id: string; icones: string[] }[]): string {
  for (const cat of categorias) {
    if (cat.icones.includes(nome)) return cat.id;
  }
  return 'geral';
}

function encontrarUso(nome: string): string {
  const usos: Record<string, string> = {
    Star: 'Destaque, favorito, avaliação',
    Heart: 'Satisfação, NPS, engajamento',
    Check: 'Confirmação, meta atingida, aprovação',
    X: 'Erro, rejeição, remoção',
    AlertCircle: 'Atenção, alerta, risco',
    Info: 'Informação, dica, contexto',
    Zap: 'Energia, performance, velocidade',
    Target: 'Meta, objetivo, OKR',
    TrendingUp: 'Crescimento, melhoria, alta',
    TrendingDown: 'Queda, redução, oportunidade',
    Users: 'Equipe, comunidade, usuários',
    User: 'Usuário único, pessoa, perfil',
    Building: 'Empresa, escritório, corporativo',
    Globe: 'Global, alcance, expansão',
    Mail: 'Email, contato, comunicação',
    Phone: 'Telefone, suporte, atendimento',
    Calendar: 'Data, prazo, evento',
    Clock: 'Tempo, duração, urgência',
    Map: 'Localização, território, rota',
    Flag: 'Marco, conquista, país',
    Award: 'Prêmio, reconhecimento, conquista',
    Shield: 'Segurança, proteção, confiança',
    Lock: 'Segurança, privacidade, controle',
    Key: 'Acesso, solução, autenticação',
    Search: 'Busca, pesquisa, descoberta',
    Filter: 'Filtragem, segmentação, seleção',
    BarChart: 'Gráfico de barras, comparação',
    PieChart: 'Gráfico pizza, distribuição',
    Activity: 'Atividade, monitoramento, pulso',
    Download: 'Download, exportar, receber',
    Upload: 'Upload, importar, enviar',
    Link: 'Link, integração, conexão',
    Code: 'Tecnologia, API, desenvolvimento',
    Layers: 'Camadas, stack, arquitetura',
    Grid: 'Grade, estrutura, layout',
    List: 'Lista, itens, organização',
    ArrowRight: 'Próximo, avanço, fluxo',
    ArrowLeft: 'Anterior, retorno, navegação',
    ArrowUp: 'Alta, subida, crescimento',
    ArrowDown: 'Queda, descida, detalhe',
    ChevronRight: 'Expansão, drill-down, detalhe',
    Lightbulb: 'Ideia, inovação, insight',
    Rocket: 'Lançamento, growth, início',
    Briefcase: 'Negócio, trabalho, serviço',
    DollarSign: 'Financeiro, receita, custo',
    Percent: 'Taxa, desconto, crescimento',
    Package: 'Produto, entrega, pacote',
  };
  return usos[nome] ?? 'Ícone de uso geral';
}
