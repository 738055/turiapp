// Tipos das tabelas usadas no Supabase.
// Os nomes seguem as colunas reais do banco para evitar mapeamentos implícitos.

export interface Hospedagem {
  id: number;
  slug: string;
  titulo: string;
  descricao_curta?: string | null;
  descricao_longa?: string | null;
  capacidade_max?: number | null;
  quartos?: number | null;
  banheiros?: number | null;
  status?: string | null;
  preco_base?: number | null;
  destaque?: boolean | null;
  imagens?: string[] | null;
  amenidades?: { icone: string; label: string }[] | null;
  regras?: string[] | null;
  check_in?: string | null;
  check_out?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  seo_titulo?: string | null;
  seo_descricao?: string | null;
  seo_og_image?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Servico {
  id: number;
  slug: string;
  titulo: string;
  descricao?: string | null;
  preco?: number | null;
  unidade?: string | null;
  categoria?: string | null;
  disponivel?: boolean | null;
  imagem_url?: string | null;
  imagens?: string[] | null;
  icone?: string | null;
  seo_titulo?: string | null;
  seo_descricao?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TransporteOpcao {
  id: number;
  titulo: string;
  descricao?: string | null;
  tipo?: string | null;
  capacidade?: number | null;
  preco?: number | null;
  duracao_estimada?: string | null;
  origem?: string | null;
  destino?: string | null;
  imagem_url?: string | null;
  disponivel?: boolean | null;
  whatsapp_link?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type NewHospedagem = Omit<Hospedagem, "id" | "created_at" | "updated_at">;

export interface ConfigSite {
  id: number;
  nome_site?: string | null;
  tagline?: string | null;
  descricao_seo?: string | null;
  descricao_site?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  endereco?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  redes_sociais?: Record<string, string> | null;
  horario_checkin?: string | null;
  horario_checkout?: string | null;
  politica_cancelamento?: string | null;
  regras_casa?: string[] | null;
  og_image_url?: string | null;
  whatsapp_mensagem_reserva?: string | null;
  whatsapp_mensagem_contato?: string | null;
  updated_at?: string | null;
}

export interface SeoConfig {
  id: number;
  titulo_padrao?: string | null;
  descricao_padrao?: string | null;
  geo_region?: string | null;
  geo_placename?: string | null;
  geo_position?: string | null;
  google_verification?: string | null;
  bing_verification?: string | null;
  robots_txt?: string | null;
  updated_at?: string | null;
}

export interface ScriptMarketing {
  id: number;
  nome: string;
  tipo?: string | null;
  conteudo: string;
  posicao?: string | null;
  ativo?: boolean | null;
  created_at?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role?: string | null;
  created_at?: string | null;
}

// ── Novas tabelas de conteúdo ────────────────────────────────

export interface HeroConfig {
  id: number;
  bg_image_url?: string | null;
  label_localizacao?: string | null;
  titulo_linha1?: string | null;
  titulo_destaque?: string | null;
  titulo_linha2?: string | null;
  subtitulo?: string | null;
  cta_reserva_texto?: string | null;
  cta_reserva_whatsapp?: string | null;
  cta_reserva_mensagem?: string | null;
  cta_secundario_texto?: string | null;
  cta_secundario_href?: string | null;
  stat_1_valor?: string | null;
  stat_1_label?: string | null;
  stat_2_valor?: string | null;
  stat_2_label?: string | null;
  stat_3_valor?: string | null;
  stat_3_label?: string | null;
  stat_4_valor?: string | null;
  stat_4_label?: string | null;
  updated_at?: string | null;
}

export interface Depoimento {
  id: number;
  nome: string;
  origem?: string | null;
  texto: string;
  nota?: number | null;
  estadia?: string | null;
  ativo?: boolean | null;
  ordem?: number | null;
  created_at?: string | null;
}

export interface LocalizacaoDistancia {
  id: number;
  label: string;
  distancia: string;
  tempo_estimado?: string | null;
  tipo_icone?: string | null;
  ativo?: boolean | null;
  ordem?: number | null;
}

export interface PaginaConfig {
  id: number;
  pagina: string;
  hero_titulo?: string | null;
  hero_subtitulo?: string | null;
  hero_label?: string | null;
  hero_bg_image_url?: string | null;
  secao_titulo?: string | null;
  secao_subtitulo?: string | null;
  secao_descricao?: string | null;
  updated_at?: string | null;
}

export interface CtaConfig {
  id: number;
  bg_image_url?: string | null;
  label?: string | null;
  titulo_linha1?: string | null;
  titulo_destaque?: string | null;
  titulo_linha2?: string | null;
  subtitulo?: string | null;
  btn_primario_texto?: string | null;
  btn_primario_whatsapp?: string | null;
  btn_primario_mensagem?: string | null;
  btn_secundario_texto?: string | null;
  btn_secundario_href?: string | null;
  updated_at?: string | null;
}
