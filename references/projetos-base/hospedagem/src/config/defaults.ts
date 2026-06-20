// ============================================================
//  MIMOSA FLOR — VALORES PADRÃO DO SITE
//  src/config/defaults.ts
//
//  Este arquivo centraliza TODOS os textos, fotos e números
//  que aparecem no site quando o banco de dados ainda não
//  foi preenchido via painel admin.
//
//  ► Para mudar algo "no código", edite AQUI.
//  ► Para mudar em produção sem deploy, use o painel /admin.
// ============================================================

// ─────────────────────────────────────────────────────────────
//  INFORMAÇÕES GERAIS DO SITE
//  Painel: /admin/configuracoes
// ─────────────────────────────────────────────────────────────
export const SITE = {
  nome:       "Mimosa Flor",
  tagline:    "Casa de Campo · Foz do Iguaçu",
  descricao:  "Uma experiência sensorial única em meio à natureza exuberante do Paraná.",
  telefone:   "+55 (45) 9 9999-9999",
  whatsapp:   "5545999999999",
  email:      "contato@mimosaflor.com.br",
  endereco:   "Rua Iguaraçu, n° 140 - Arroio Dourado, Foz do Iguaçu - PR",
  latitude:   -25.571917,
  longitude:  -54.516338,
  instagram:  "https://instagram.com/mimosaflor",
  facebook:   "https://facebook.com/mimosaflor",
  checkin:    "14:00",
  checkout:   "11:00",
};

// ─────────────────────────────────────────────────────────────
//  MENSAGENS DE WHATSAPP
//  Painel: /admin/configuracoes
// ─────────────────────────────────────────────────────────────
export const WA_MSG = {
  reserva:  "Olá, gostaria de fazer uma reserva na Mimosa Flor!",
  contato:  "Olá, gostaria de mais informações sobre a Mimosa Flor.",
};

// ─────────────────────────────────────────────────────────────
//  HERO (primeira tela da home)
//  Painel: /admin/conteudo/hero
//  Foto de fundo: troque a URL abaixo por qualquer imagem
// ─────────────────────────────────────────────────────────────
export const HERO = {
  bg:             "https://images.unsplash.com/photo-1586375300773-8384e3e4916f?w=1920&q=85",
  label:          "Foz do Iguaçu · Paraná · Brasil",
  tituloLinha1:   "Natureza que",
  tituloDestaque: "abraça",
  tituloLinha2:   "a alma.",
  subtitulo:      "Uma experiência sensorial única em meio à Mata Atlântica, a poucos quilômetros das Cataratas do Iguaçu.",
  ctaTexto:       "Reservar agora",
  cta2Texto:      "Ver hospedagens",
  cta2Href:       "/#hospedagem",
  stats: [
    { valor: "4+",   label: "Acomodações"  },
    { valor: "5★",   label: "Avaliações"   },
    { valor: "3km",  label: "Das Cataratas" },
    { valor: "100%", label: "Natureza"     },
  ],
};

// ─────────────────────────────────────────────────────────────
//  SEÇÃO CTA (bloco final "Reservar agora")
//  Painel: /admin/conteudo/cta
//  Foto de fundo: troque a URL abaixo
// ─────────────────────────────────────────────────────────────
export const CTA = {
  bg:             "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80",
  label:          "Pronto para escapar?",
  tituloLinha1:   "Sua próxima",
  tituloDestaque: "aventura",
  tituloLinha2:   "começa aqui.",
  subtitulo:      "Entre em contato agora mesmo via WhatsApp e planeje sua estadia perfeita na Mimosa Flor.",
  btn1Texto:      "Falar no WhatsApp",
  btn1Mensagem:   "Olá! Gostaria de verificar a disponibilidade e fazer uma reserva na Mimosa Flor.",
  btn2Texto:      "Formulário de contato",
  btn2Href:       "/contato",
};

// ─────────────────────────────────────────────────────────────
//  DEPOIMENTOS DE HÓSPEDES
//  Painel: /admin/conteudo/depoimentos
// ─────────────────────────────────────────────────────────────
export const DEPOIMENTOS = [
  {
    id: 1,
    nome:    "Ana & Ricardo",
    origem:  "São Paulo, SP",
    texto:   "A Mimosa Flor superou todas as nossas expectativas. A casa é linda, o ambiente é mágico e o atendimento é impecável. Já estamos planejando a volta!",
    nota:    5,
    estadia: "3 noites · Casa Principal",
    ativo:   true,
    ordem:   1,
  },
  {
    id: 2,
    nome:    "Família Oliveira",
    origem:  "Curitiba, PR",
    texto:   "Lugar perfeito para descansar e se reconectar com a natureza. As crianças amaram a piscina e as trilhas. Com certeza voltaremos nas próximas férias.",
    nota:    5,
    estadia: "5 noites · Casa Principal",
    ativo:   true,
    ordem:   2,
  },
  {
    id: 3,
    nome:    "Marcela Santos",
    origem:  "Rio de Janeiro, RJ",
    texto:   "O chalé romântico é simplesmente perfeito. Aconchegante, bem decorado e com uma vista deslumbrante. O café da manhã é o melhor que já tomei em viagem.",
    nota:    5,
    estadia: "2 noites · Chalé Romântico",
    ativo:   true,
    ordem:   3,
  },
  {
    id: 4,
    nome:    "João & Marina",
    origem:  "Florianópolis, SC",
    texto:   "Viemos para a nossa lua de mel e a equipe preparou surpresas incríveis. O jantar à luz de velas no deck foi inesquecível. Recomendo demais!",
    nota:    5,
    estadia: "4 noites · Chalé Romântico",
    ativo:   true,
    ordem:   4,
  },
];

// ─────────────────────────────────────────────────────────────
//  DISTÂNCIAS / LOCALIZAÇÃO
//  Painel: /admin/conteudo/localizacao
// ─────────────────────────────────────────────────────────────
export const DISTANCIAS = [
  { id: 1, label: "Aeroporto Internacional (IGU)", distancia: "8 km",   tempo_estimado: "10 min", tipo_icone: "plane",  ativo: true, ordem: 1 },
  { id: 2, label: "Cataratas do Iguaçu",          distancia: "8,7 km", tempo_estimado: "15 min", tipo_icone: "mappin", ativo: true, ordem: 2 },
  { id: 3, label: "Parque das Aves",              distancia: "8,5 km", tempo_estimado: "15 min", tipo_icone: "mappin", ativo: true, ordem: 3 },
  { id: 4, label: "Centro de Foz do Iguaçu",     distancia: "13 km",  tempo_estimado: "20 min", tipo_icone: "car",    ativo: true, ordem: 4 },
];
