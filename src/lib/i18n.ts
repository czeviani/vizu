// PT-BR strings for Vizu
export const t = {
  // App
  app_name: 'Vizu',

  // Home
  home_title: 'Minhas Apresentações',
  home_new_btn: 'Nova Apresentação',
  home_search_placeholder: 'Buscar apresentações…',
  home_empty_title: 'Nenhuma apresentação ainda',
  home_empty_sub: 'Crie sua primeira apresentação para começar',
  home_empty_btn: '+ Nova Apresentação',
  home_result: (q: string) => `Resultados para "${q}"`,
  home_count: (n: number) => `${n} apresentaç${n !== 1 ? 'ões' : 'ão'}`,

  // New / Delete modals
  modal_new: 'Nova Apresentação',
  modal_delete: 'Excluir Apresentação',
  modal_delete_confirm: 'Esta ação não pode ser desfeita. Tem certeza?',
  label_title: 'Título',
  label_theme: 'Tema',
  btn_cancel: 'Cancelar',
  btn_create: 'Criar',
  btn_delete: 'Excluir',

  // Card menu
  card_open: 'Abrir',
  card_duplicate: 'Duplicar',
  card_delete: 'Excluir',

  // Theme toggle
  theme_light: 'claro',
  theme_dark: 'escuro',
  theme_auto: 'auto',

  // Toolbar
  toolbar_undo: 'Desfazer (Ctrl+Z)',
  toolbar_redo: 'Refazer (Ctrl+Shift+Z)',
  toolbar_text: 'Texto',
  toolbar_image: 'Imagem',
  toolbar_shape: 'Forma',
  toolbar_icon: 'Ícone',
  toolbar_zoom_out: 'Diminuir zoom',
  toolbar_zoom_in: 'Aumentar zoom',
  toolbar_zoom_fit: 'Ajustar (Ctrl+0)',
  toolbar_preview: 'Visualizar',
  toolbar_export: 'Exportar .pptx',
  toolbar_exporting: 'Exportando…',
  toolbar_saved: 'Salvo',
  toolbar_rename_hint: 'Clique para renomear',
  toolbar_grid: 'Grade',
  toolbar_add: 'Inserir',

  // Icon picker
  icon_search: 'Buscar ícones…',

  // Shapes
  shape_rectangle: 'Retângulo',
  shape_rounded: 'Arredondado',
  shape_circle: 'Círculo',
  shape_triangle: 'Triângulo',
  shape_diamond: 'Diamante',
  shape_star: 'Estrela',
  shape_arrow_right: 'Seta →',
  shape_arrow_left: 'Seta ←',

  // Slide panel
  slides_add: 'Adicionar Slide',
  layout_blank: 'Em branco',
  layout_cover: 'Capa',
  layout_section: 'Seção',
  layout_content: 'Conteúdo',
  layout_comparison: 'Comparação',
  layout_quote: 'Citação',
  layout_closing: 'Encerramento',
  slide_duplicate: 'Duplicar',
  slide_delete: 'Excluir',

  // Canvas
  canvas_no_slide: 'Selecione um slide',

  // Properties panel tabs
  panel_element: 'Elemento',
  panel_slide: 'Slide',
  panel_theme: 'Tema',
  panel_no_selection: 'Selecione um elemento para editar suas propriedades',

  // Section titles
  sec_position: 'Posição e Tamanho',
  sec_typography: 'Tipografia',
  sec_box: 'Caixa',
  sec_fill: 'Preenchimento',
  sec_border: 'Borda',
  sec_shadow: 'Sombra',
  sec_background: 'Fundo',
  sec_image: 'Imagem',
  sec_preset_themes: 'Temas Predefinidos',
  sec_custom_colors: 'Cores Customizadas',

  // Labels
  lbl_x: 'X',
  lbl_y: 'Y',
  lbl_w: 'L',
  lbl_h: 'A',
  lbl_rotation: 'Rotação',
  lbl_opacity: 'Opacidade',
  lbl_locked: 'Bloqueado',
  lbl_visible: 'Visível',
  lbl_zindex: 'Camada',
  lbl_font: 'Fonte',
  lbl_size: 'Tamanho',
  lbl_weight: 'Espessura',
  lbl_color: 'Cor',
  lbl_align: 'Alinhamento',
  lbl_style: 'Estilo',
  lbl_line_height: 'Altura da Linha',
  lbl_spacing: 'Espaçamento',
  lbl_bg: 'Fundo',
  lbl_padding: 'Padding',
  lbl_valign: 'Alinhamento V.',
  lbl_url: 'URL',
  lbl_fit: 'Ajuste',
  lbl_alt: 'Texto Alt',
  lbl_radius: 'Raio',
  lbl_border_width: 'Largura',
  lbl_enable_shadow: 'Ativar Sombra',
  lbl_offset_x: 'Offset X',
  lbl_offset_y: 'Offset Y',
  lbl_blur: 'Desfoque',
  lbl_type: 'Tipo',
  lbl_direction: 'Direção',
  lbl_from: 'De',
  lbl_to: 'Para',
  lbl_heading_font: 'Fonte Título',
  lbl_body_font: 'Fonte Corpo',

  // Options
  opt_light: 'Leve',
  opt_regular: 'Normal',
  opt_medium: 'Médio',
  opt_semibold: 'Seminegrito',
  opt_bold: 'Negrito',
  opt_extrabold: 'Extra Negrito',
  opt_top: 'Topo',
  opt_middle: 'Meio',
  opt_bottom: 'Base',
  opt_cover: 'Cobrir',
  opt_contain: 'Conter',
  opt_fill: 'Preencher',
  opt_solid_color: 'Cor Sólida',
  opt_gradient: 'Gradiente',
  opt_image_url: 'Imagem URL',
  opt_none: 'Nenhuma',
  opt_solid: 'Sólida',
  opt_dashed: 'Tracejada',
  opt_dotted: 'Pontilhada',

  // Actions
  act_front: 'Frente',
  act_back: 'Fundo',
  act_copy: 'Copiar',
  act_delete: 'Excluir',

  // Color tokens
  clr_primary: 'Primária',
  clr_secondary: 'Secundária',
  clr_accent: 'Destaque',
  clr_background: 'Fundo',
  clr_surface: 'Superfície',
  clr_text: 'Texto',
  clr_text_sec: 'Texto Secundário',
  clr_border: 'Borda',

  // Image element
  img_no_src: 'Sem imagem — clique para adicionar ou arraste aqui',
  img_drop: 'Solte a imagem aqui',

  // Editor page messages
  not_found: 'Apresentação não encontrada.',
  go_home: 'Ir ao início',
  loading: 'Carregando…',

  // Context toolbar
  ctx_text_format: 'Formatação de Texto',
  ctx_bold: 'Negrito (Ctrl+B)',
  ctx_italic: 'Itálico (Ctrl+I)',
  ctx_underline: 'Sublinhado (Ctrl+U)',
  ctx_color: 'Cor do texto',
  ctx_align_left: 'Alinhar à esquerda',
  ctx_align_center: 'Centralizar',
  ctx_align_right: 'Alinhar à direita',
  ctx_font_size: 'Tamanho da fonte',

  // Preview
  preview_close: 'Fechar (Esc)',

  // Upload
  upload_file_title: 'Selecionar imagem',
  upload_url_placeholder: 'Cole a URL da imagem…',
  upload_or: 'ou',
};
