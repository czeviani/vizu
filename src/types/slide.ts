export type ElementType = 'text' | 'image' | 'shape' | 'icon' | 'table' | 'line';

export type LayoutType = 'blank' | 'cover' | 'section' | 'content' | 'comparison' | 'quote' | 'closing';

export type ShapeType =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'star'
  | 'arrow-right'
  | 'arrow-left';

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export interface BorderStyle {
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted' | 'none';
  radius: number;
}

export interface ShadowStyle {
  enabled: boolean;
  x: number;
  y: number;
  blur: number;
  color: string;
}

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  name?: string;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  style: TextStyle;
  background: string;
  border: BorderStyle;
  padding: number;
  verticalAlign: 'top' | 'middle' | 'bottom';
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt: string;
  objectFit: 'cover' | 'contain' | 'fill';
  border: BorderStyle;
  shadow: ShadowStyle;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shape: ShapeType;
  fill: string;
  border: BorderStyle;
  shadow: ShadowStyle;
}

export interface IconElement extends BaseElement {
  type: 'icon';
  iconName: string;
  color: string;
  background: string;
  border: BorderStyle;
}

export interface TableCell {
  content: string;
  style: Partial<TextStyle>;
  background: string;
  colspan?: number;
  rowspan?: number;
}

export interface TableElement extends BaseElement {
  type: 'table';
  rows: TableCell[][];
  headerRow: boolean;
  headerCol: boolean;
  borderColor: string;
  headerBackground: string;
  headerTextColor: string;
  alternateRowColor: boolean;
  alternateColor: string;
}

export interface LineElement extends BaseElement {
  type: 'line';
  color: string;
  thickness: number;
  style: 'solid' | 'dashed' | 'dotted';
  arrowStart: boolean;
  arrowEnd: boolean;
}

export type SlideElement =
  | TextElement
  | ImageElement
  | ShapeElement
  | IconElement
  | TableElement
  | LineElement;

export interface SlideBackground {
  type: 'color' | 'gradient' | 'image';
  color?: string;
  gradient?: {
    from: string;
    to: string;
    direction: number;
  };
  image?: string;
  imageOpacity?: number;
}

export interface Slide {
  id: string;
  layout: LayoutType;
  background: SlideBackground;
  elements: SlideElement[];
  notes?: string;
  thumbnail?: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  fonts: {
    heading: string;
    body: string;
  };
}

export interface Presentation {
  id: string;
  title: string;
  theme: Theme;
  slides: Slide[];
  metadata: {
    author?: string;
    createdAt: string;
    updatedAt: string;
    version: string;
    description?: string;
    tags?: string[];
  };
}

// AI creation types
export interface AISlideSpec {
  layout: LayoutType;
  data: {
    title?: string;
    subtitle?: string;
    content?: string;
    bullets?: string[];
    author?: string;
    date?: string;
    leftTitle?: string;
    leftContent?: string;
    rightTitle?: string;
    rightContent?: string;
    quote?: string;
    attribution?: string;
    columns?: Array<{ heading: string; rows: string[] }>;
  };
  background?: Partial<SlideBackground>;
}

export interface AICreateRequest {
  title: string;
  theme?: Partial<Theme>;
  slides: AISlideSpec[];
}

export interface AIModifyRequest {
  presentationId: string;
  operations: Array<
    | { op: 'set-title'; title: string }
    | { op: 'set-theme'; theme: Partial<Theme> }
    | { op: 'add-slide'; position: number; spec: AISlideSpec }
    | { op: 'remove-slide'; slideId: string }
    | { op: 'update-slide'; slideId: string; spec: Partial<AISlideSpec> }
    | { op: 'update-element'; slideId: string; elementId: string; props: Record<string, unknown> }
    | { op: 'reorder-slides'; order: string[] }
  >;
}

export const SLIDE_WIDTH = 960;
export const SLIDE_HEIGHT = 540;
