import type { CardType, MenuType } from "@/types";

export interface StoreTemplateTheme {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_heading: string;
  font_body: string;
  border_radius: string;
  menu_type: MenuType;
  card_type: CardType;
}

export interface StoreTemplateSection {
  type: string;
  visible: boolean;
  config: Record<string, unknown>;
}

export interface StoreTemplatePage {
  slug: string;
  title: string;
  seo_title?: string | null;
  seo_description?: string | null;
  status?: "draft" | "published";
  is_home?: boolean;
  show_in_nav?: boolean;
  nav_order?: number;
  sections: StoreTemplateSection[];
}

export interface StoreTemplateNavItem {
  label: string;
  href: string;
  order: number;
  target?: "_self" | "_blank";
}

export interface StoreTemplateProductDefaults {
  module: "hospedagem" | "receptivo" | "emissivo";
  type: string;
  title: string;
  description: string;
  extra_data: Record<string, unknown>;
}

export interface StoreTemplate {
  id: string;
  name: string;
  category: "receptivo" | "emissivo" | "hospedagem" | "multi";
  description: string;
  source: string;
  bestFor: string[];
  theme: StoreTemplateTheme;
  sections: StoreTemplateSection[];
  pages?: StoreTemplatePage[];
  navItems?: StoreTemplateNavItem[];
  productDefaults: StoreTemplateProductDefaults;
}

const fonts = {
  sans: '"Inter", system-ui, sans-serif',
  modern: '"DM Sans", system-ui, sans-serif',
  friendly: '"Poppins", system-ui, sans-serif',
  serif: '"Playfair Display", Georgia, serif',
};

export const STORE_TEMPLATES: StoreTemplate[] = [
  {
    id: "turismo-basico",
    name: "Turismo Direto",
    category: "multi",
    description: "Loja limpa para comecar rapido, com foco em busca e conversao.",
    source: "TuriApp base",
    bestFor: ["catalogos pequenos", "venda por WhatsApp", "primeira loja"],
    theme: {
      primary_color: "#0ea5e9",
      secondary_color: "#0369a1",
      accent_color: "#f59e0b",
      background_color: "#ffffff",
      text_color: "#111827",
      font_heading: fonts.sans,
      font_body: fonts.sans,
      border_radius: "0.75rem",
      menu_type: "top-classic",
      card_type: "card-image-large",
    },
    sections: [
      hero("Sua proxima experiencia com seguranca", "Passeios, hospedagens e pacotes selecionados para voce reservar sem complicacao.", "Explorar produtos", "/busca", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80", "classic"),
      productGrid("Produtos em destaque", "Escolha o roteiro ideal para sua viagem.", "", "marketplace"),
      contact(),
      footer(),
    ],
    productDefaults: productDefaults("receptivo", "experiencia"),
  },
  {
    id: "receptivo",
    name: "Receptivo Premium",
    category: "receptivo",
    description: "Inspirado nos projetos de receptivo: passeios, transfers e experiencias locais.",
    source: "references/projetos-base/receptivo + receptivo2",
    bestFor: ["passeios locais", "transfers", "ingressos", "city tours"],
    theme: {
      primary_color: "#0f766e",
      secondary_color: "#134e4a",
      accent_color: "#f59e0b",
      background_color: "#f8fafc",
      text_color: "#111827",
      font_heading: fonts.friendly,
      font_body: fonts.modern,
      border_radius: "0.75rem",
      menu_type: "top-transparent",
      card_type: "card-price-highlight",
    },
    sections: [
      hero("Conheca as Cataratas com quem e de Foz", "Passeios, ingressos e transfers organizados por uma equipe local. Reserva online, confirmacao imediata e atendimento de quem conhece a regiao.", "Buscar experiencias", "/busca?modulo=receptivo", "/storefront/receptivo/hero-cataratas.jpg", "marketplace", [
        { value: "24h", label: "suporte ao viajante" },
        { value: "4.9", label: "avaliacao media" },
        { value: "10x", label: "pagamento facilitado" },
      ]),
      searchBar("Busque por passeio, ingresso ou transfer"),
      productGrid("Mais vendidos", "Produtos com detalhes de duracao, roteiro, inclusos e politica de cancelamento.", "receptivo", "marketplace"),
      banner("Transfers privativos e grupos", "Monte roteiros sob medida para aeroporto, hotel, eventos e atrativos.", "Pedir cotacao", "/contato", "#134e4a"),
      testimonials([
        { name: "Marina Costa", rating: 5, text: "Atendimento rapido e roteiro muito bem explicado antes da compra." },
        { name: "Rafael Nunes", rating: 5, text: "O transfer chegou no horario e o passeio foi melhor que o esperado." },
        { name: "Grupo Horizonte", rating: 5, text: "Facil de comparar opcoes e fechar tudo pelo WhatsApp." },
      ]),
      faq(),
      contact(),
      footer("Atendimento local, curadoria de experiencias e suporte para sua viagem."),
    ],
    productDefaults: productDefaults("receptivo", "experiencia"),
  },
  {
    id: "agencia",
    name: "Agencia de Pacotes",
    category: "emissivo",
    description: "Versao emissiva do conceito de receptivo, focada em pacotes, roteiros e viagens em grupo.",
    source: "references/projetos-base/receptivo2/receptivo3 adaptado para emissivo",
    bestFor: ["agencias emissivas", "pacotes nacionais", "viagens em grupo", "cruzeiros"],
    theme: {
      primary_color: "#1d4ed8",
      secondary_color: "#172554",
      accent_color: "#f97316",
      background_color: "#f8fafc",
      text_color: "#111827",
      font_heading: fonts.friendly,
      font_body: fonts.modern,
      border_radius: "0.75rem",
      menu_type: "top-classic",
      card_type: "card-horizontal",
    },
    sections: [
      hero("Pacotes prontos para vender mais", "Mostre saidas, roteiros, o que inclui e condicoes de pagamento com um layout feito para agencias.", "Ver pacotes", "/busca?modulo=emissivo", "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80", "marketplace", [
        { value: "10x", label: "sem juros" },
        { value: "grupo", label: "saidas programadas" },
        { value: "PDF", label: "cotacao pronta" },
      ]),
      productGrid("Pacotes em destaque", "Roteiros com inclusos, nao inclusos, datas e condicoes.", "emissivo", "marketplace"),
      about("Venda pacotes com contexto", "Use este modelo para explicar o destino, mostrar diferenciais, destacar formas de pagamento e transformar cada pacote em uma pagina comercial completa."),
      banner("Cote viagens sob medida", "Capture leads para roteiros personalizados e grupos fechados.", "Solicitar roteiro", "/contato", "#172554"),
      faq([
        { question: "Posso editar o roteiro do pacote?", answer: "Sim. No cadastro do produto voce edita roteiro, inclusos, nao inclusos e informacoes importantes." },
        { question: "Funciona para venda por WhatsApp?", answer: "Sim. O modelo foi pensado para WhatsApp ou reserva online, conforme o plano do tenant." },
      ]),
      contact(),
      footer("Pacotes, viagens em grupo e atendimento consultivo em um so lugar."),
    ],
    productDefaults: productDefaults("emissivo", "pacote"),
  },
  {
    id: "hospedagem",
    name: "Hospedagem Boutique",
    category: "hospedagem",
    description: "Inspirado no projeto de hospedagem: visual editorial, fotos grandes e sensacao premium.",
    source: "references/projetos-base/hospedagem",
    bestFor: ["pousadas", "hoteis boutique", "chales", "temporada"],
    theme: {
      primary_color: "#1c3a2a",
      secondary_color: "#0f1e16",
      accent_color: "#c4623a",
      background_color: "#faf7f2",
      text_color: "#1c3a2a",
      font_heading: fonts.serif,
      font_body: fonts.modern,
      border_radius: "0.25rem",
      menu_type: "top-transparent",
      card_type: "card-image-large",
    },
    sections: [
      hero("Hospedagem que transforma viagens", "Acomode seus hospedes com uma vitrine elegante, fotos grandes, detalhes de conforto e reserva facil.", "Ver acomodacoes", "/busca?modulo=hospedagem", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80", "editorial", [
        { value: "check-in", label: "sem friccao" },
        { value: "fotos", label: "galeria premium" },
        { value: "noite", label: "tarifas claras" },
      ]),
      productGrid("Acomodacoes", "Quartos, pousadas e casas com informacoes de capacidade, conforto e disponibilidade.", "hospedagem", "editorial"),
      about("Uma experiencia antes da reserva", "O layout valoriza atmosfera, localizacao, servicos e detalhes que ajudam o hospede a decidir com confianca."),
      banner("Consulte disponibilidade", "Use WhatsApp ou motor de reservas para transformar interesse em reserva.", "Falar com a equipe", "/contato", "#1c3a2a"),
      testimonials([
        { name: "Ana e Paulo", rating: 5, text: "As fotos e detalhes deixaram muito claro o que estavamos reservando." },
        { name: "Carla Mendes", rating: 5, text: "Layout elegante, rapido e facil de navegar no celular." },
        { name: "Familia Rocha", rating: 5, text: "Encontramos a acomodacao ideal sem precisar perguntar tudo no WhatsApp." },
      ]),
      contact(),
      footer("Hospedagem com curadoria, conforto e atendimento proximo."),
    ],
    productDefaults: productDefaults("hospedagem", "pousada"),
  },
  {
    id: "hospedagem-resort",
    name: "Resort & Day Use",
    category: "hospedagem",
    description: "Variante para hoteis, resorts, day use e experiencias de lazer com ticket maior.",
    source: "references/projetos-base/hospedagem - variante",
    bestFor: ["resorts", "day use", "hotel fazenda", "experiencias de lazer"],
    theme: {
      primary_color: "#0f766e",
      secondary_color: "#115e59",
      accent_color: "#eab308",
      background_color: "#f6f7ef",
      text_color: "#17342f",
      font_heading: fonts.serif,
      font_body: fonts.modern,
      border_radius: "1rem",
      menu_type: "top-centered",
      card_type: "card-price-highlight",
    },
    sections: [
      hero("Lazer, descanso e experiencias completas", "Monte uma vitrine para diarias, day use, gastronomia e pacotes especiais com alto valor percebido.", "Conhecer opcoes", "/busca?modulo=hospedagem", "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80", "editorial"),
      productGrid("Experiencias e acomodacoes", "Combine hospedagem, day use e extras em uma loja visual.", "hospedagem", "editorial"),
      banner("Ofertas para datas especiais", "Destaque feriados, pacotes romanticos e experiencias familiares.", "Ver ofertas", "/busca", "#115e59"),
      faq(),
      contact(),
      footer("Reserve momentos de descanso com atendimento cuidadoso."),
    ],
    productDefaults: productDefaults("hospedagem", "resort"),
  },
  {
    id: "receptivo-aventura",
    name: "Aventura Local",
    category: "receptivo",
    description: "Modelo vibrante para experiencias de natureza, aventura, trilhas, passeios de barco e atrativos ao ar livre.",
    source: "references/projetos-base/receptivo - variante aventura",
    bestFor: ["ecoturismo", "aventura", "passeios de barco", "trilhas guiadas"],
    theme: {
      primary_color: "#16a34a",
      secondary_color: "#14532d",
      accent_color: "#facc15",
      background_color: "#f7fee7",
      text_color: "#132a13",
      font_heading: fonts.friendly,
      font_body: fonts.modern,
      border_radius: "1rem",
      menu_type: "top-transparent",
      card_type: "card-image-large",
    },
    sections: [
      hero("Aventuras seguras com equipe local", "Venda trilhas, passeios nauticos, experiencias de natureza e atrativos com detalhes claros de nivel, duracao e inclusos.", "Explorar aventuras", "/busca?modulo=receptivo", "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80", "marketplace", [
        { value: "local", label: "guias especialistas" },
        { value: "seguro", label: "orientacoes claras" },
        { value: "grupo", label: "opcoes privativas" },
      ]),
      searchBar("Busque por trilha, barco, cachoeira ou atrativo"),
      productGrid("Experiencias de aventura", "Cards preparados para nivel de dificuldade, duracao, inclusos e politica de cancelamento.", "receptivo", "marketplace"),
      banner("Monte roteiros privativos", "Capture pedidos para grupos, empresas e viajantes que querem um roteiro sob medida.", "Pedir roteiro", "/contato", "#14532d"),
      testimonials([
        { name: "Bruno Lima", rating: 5, text: "O roteiro ficou claro antes da compra e a equipe passou muita seguranca." },
        { name: "Julia Prado", rating: 5, text: "Conseguimos comparar passeios e escolher pelo nivel de aventura." },
        { name: "Grupo Serra", rating: 5, text: "Atendimento rapido para fechar um grupo privativo." },
      ]),
      faq([
        { question: "Posso indicar nivel de dificuldade?", answer: "Sim. Use os campos do produto para destacar duracao, preparo necessario e informacoes importantes." },
        { question: "Funciona para grupos fechados?", answer: "Sim. O layout tambem favorece cotacoes pelo WhatsApp ou formulario de contato." },
      ]),
      contact(),
      footer("Ecoturismo, aventura e atendimento local com informacoes claras para vender melhor."),
    ],
    productDefaults: productDefaults("receptivo", "experiencia", {
      title: "Trilha guiada com mirante",
      description: "Experiencia de natureza com guia local, orientacoes de seguranca e pontos de parada para fotos.",
      extra_data: {
        duration: "4 horas",
        location: "Area natural",
        highlights: ["Guia local", "Nivel moderado", "Paradas para fotos"],
        included: ["Acompanhamento", "Orientacoes de seguranca", "Seguro operacional"],
        not_included: ["Alimentacao", "Transporte ate o ponto de encontro"],
      },
    }),
  },
  {
    id: "emissivo-premium",
    name: "Viagens Premium",
    category: "emissivo",
    description: "Tema elegante para agencias consultivas, roteiros personalizados, lua de mel e viagens de alto valor.",
    source: "references/projetos-base/receptivo3 adaptado para emissivo premium",
    bestFor: ["viagens sob medida", "lua de mel", "alto ticket", "consultoria de viagem"],
    theme: {
      primary_color: "#334155",
      secondary_color: "#111827",
      accent_color: "#d97706",
      background_color: "#f8fafc",
      text_color: "#111827",
      font_heading: fonts.serif,
      font_body: fonts.modern,
      border_radius: "0.25rem",
      menu_type: "top-classic",
      card_type: "card-horizontal",
    },
    sections: [
      hero("Roteiros sob medida para viajar melhor", "Apresente pacotes premium, consultoria, condicoes e experiencias exclusivas com uma vitrine editorial e comercial.", "Solicitar consultoria", "/contato", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80", "editorial", [
        { value: "sob medida", label: "roteiros personalizados" },
        { value: "curadoria", label: "hoteis e experiencias" },
        { value: "suporte", label: "antes e durante" },
      ]),
      productGrid("Viagens selecionadas", "Produtos podem virar roteiros completos com inclusos, nao inclusos, datas e politica comercial.", "emissivo", "editorial"),
      about("Consultoria que aumenta valor percebido", "Use este modelo para vender conhecimento, curadoria e atendimento consultivo, nao apenas preco. O tenant edita destinos, argumentos comerciais, provas sociais e CTAs."),
      testimonials([
        { name: "Renata Moura", rating: 5, text: "O roteiro parecia uma proposta premium, com tudo bem explicado." },
        { name: "Casal Andrade", rating: 5, text: "Fechamos a lua de mel com seguranca porque as informacoes estavam claras." },
        { name: "Luciano Reis", rating: 5, text: "A experiencia passa muito mais autoridade que uma lista simples de pacotes." },
      ]),
      banner("Transforme pedidos em propostas", "Leve o cliente para contato consultivo quando a viagem exigir personalizacao.", "Criar cotacao", "/cotacoes/nova", "#111827"),
      faq(),
      contact(),
      footer("Viagens premium, curadoria e atendimento consultivo."),
    ],
    productDefaults: productDefaults("emissivo", "viagem", {
      title: "Roteiro premium para o Caribe",
      description: "Viagem personalizada com curadoria de hospedagem, experiencias e suporte consultivo.",
      extra_data: {
        duration: "7 dias / 6 noites",
        location: "Caribe",
        highlights: ["Roteiro sob medida", "Hoteis selecionados", "Experiencias exclusivas"],
        included: ["Consultoria", "Hospedagem sugerida", "Roteiro detalhado"],
        not_included: ["Passagens nao descritas", "Despesas pessoais", "Taxas locais"],
      },
    }),
  },
  {
    id: "emissivo-cruzeiros",
    name: "Cruzeiros & Grupos",
    category: "emissivo",
    description: "Modelo comercial para cruzeiros, bloqueios, saidas em grupo, excursao e pacotes com parcelas.",
    source: "references/projetos-base/receptivo2 adaptado para cruzeiros",
    bestFor: ["cruzeiros", "excursao", "bloqueios", "viagens em grupo"],
    theme: {
      primary_color: "#0284c7",
      secondary_color: "#0c4a6e",
      accent_color: "#fb923c",
      background_color: "#f0f9ff",
      text_color: "#0f172a",
      font_heading: fonts.friendly,
      font_body: fonts.sans,
      border_radius: "0.75rem",
      menu_type: "top-centered",
      card_type: "card-price-highlight",
    },
    sections: [
      hero("Cruzeiros e saidas em grupo prontos para vender", "Destaque datas, cabines, roteiro, condicoes de pagamento e atendimento para grupos em uma vitrine objetiva.", "Ver saidas", "/busca?modulo=emissivo", "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=1600&q=80", "marketplace", [
        { value: "12x", label: "pagamento facilitado" },
        { value: "grupo", label: "bloqueios e saidas" },
        { value: "cabines", label: "opcoes por perfil" },
      ]),
      searchBar("Busque por navio, destino ou data"),
      productGrid("Saidas em destaque", "Cards pensados para preco, data, roteiro resumido e chamada para cotacao.", "emissivo", "marketplace"),
      banner("Venda grupos com mais organizacao", "Use paginas de produto para explicar roteiro, inclusos, taxas e documentos necessarios.", "Falar com consultor", "/contato", "#0c4a6e"),
      faq([
        { question: "Posso cadastrar cabines ou categorias?", answer: "Sim. Use tarifarios e detalhes do produto para organizar categorias, precos e condicoes." },
        { question: "Serve para excursao terrestre tambem?", answer: "Sim. O modelo funciona para cruzeiros, saidas rodoviarias, grupos e pacotes programados." },
      ]),
      contact(),
      footer("Cruzeiros, grupos e saidas programadas com venda mais clara."),
    ],
    productDefaults: productDefaults("emissivo", "cruzeiro", {
      title: "Cruzeiro com saida em grupo",
      description: "Saida programada com roteiro, condicoes de pagamento, categorias e suporte da agencia.",
      extra_data: {
        duration: "8 dias / 7 noites",
        location: "Costa brasileira",
        highlights: ["Saida em grupo", "Cabines por categoria", "Parcelamento disponivel"],
        included: ["Cruzeiro conforme roteiro", "Suporte da agencia", "Orientacoes pre-embarque"],
        not_included: ["Taxas portuarias se nao descritas", "Bebidas", "Passeios opcionais"],
      },
    }),
  },
  {
    id: "hospedagem-natureza",
    name: "Chales & Natureza",
    category: "hospedagem",
    description: "Variante aconchegante para chales, pousadas de montanha, glamping e hospedagens romanticas.",
    source: "references/projetos-base/hospedagem - variante natureza",
    bestFor: ["chales", "pousadas de montanha", "glamping", "hospedagem romantica"],
    theme: {
      primary_color: "#4d7c0f",
      secondary_color: "#365314",
      accent_color: "#b45309",
      background_color: "#fafaf5",
      text_color: "#263214",
      font_heading: fonts.serif,
      font_body: fonts.friendly,
      border_radius: "1rem",
      menu_type: "top-transparent",
      card_type: "card-image-large",
    },
    sections: [
      hero("Chales para desacelerar", "Valorize natureza, conforto, privacidade e experiencias romanticas com um layout acolhedor e visual.", "Ver hospedagens", "/busca?modulo=hospedagem", "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1600&q=80", "editorial", [
        { value: "natureza", label: "experiencia imersiva" },
        { value: "casais", label: "clima romantico" },
        { value: "reserva", label: "atendimento simples" },
      ]),
      productGrid("Chales e experiencias", "Mostre capacidade, comodidades, politicas e fotos para facilitar a decisao.", "hospedagem", "editorial"),
      about("Hospedagem com atmosfera", "Este modelo destaca sensacao, ambiente e detalhes de conforto, ideal para vender desejo antes mesmo do atendimento."),
      banner("Pacotes romanticos e datas especiais", "Crie chamadas para feriados, aniversarios e experiencias com extras.", "Consultar datas", "/contato", "#365314"),
      testimonials([
        { name: "Mariana e Leo", rating: 5, text: "As fotos e descricoes transmitiram exatamente o clima do lugar." },
        { name: "Paula Souza", rating: 5, text: "Foi facil entender o que estava incluso e pedir disponibilidade." },
        { name: "Daniel Costa", rating: 5, text: "A pagina ficou elegante e passou muita confianca." },
      ]),
      faq(),
      contact(),
      footer("Chales, natureza e experiencias de descanso com reserva simples."),
    ],
    productDefaults: productDefaults("hospedagem", "pousada", {
      title: "Chale vista bosque",
      description: "Chale aconchegante para casal, com clima de natureza, conforto e privacidade.",
      extra_data: {
        duration: "Diarias flexiveis",
        location: "Serra / natureza",
        highlights: ["Ideal para casais", "Vista para natureza", "Cafe da manha opcional"],
        included: ["Wi-Fi", "Roupa de cama e banho", "Estacionamento"],
        not_included: ["Itens de frigobar", "Experiencias opcionais"],
        capacity: "2 pessoas",
        bedrooms: "1 quarto",
        bathrooms: "1 banheiro",
      },
    }),
  },
];

export function getStoreTemplate(id: string | null | undefined): StoreTemplate {
  return STORE_TEMPLATES.find((template) => template.id === id) ?? STORE_TEMPLATES[0];
}

export function materializeStoreTemplateSections(
  template: StoreTemplate,
  opts: { companyName?: string | null; whatsapp?: string | null } = {}
): StoreTemplateSection[] {
  return template.sections.map((section) => {
    const config = JSON.parse(JSON.stringify(section.config ?? {})) as Record<string, unknown>;
    const companyName = opts.companyName?.trim() || "Minha Loja";
    const whatsapp = opts.whatsapp ?? "";

    if (section.type === "hero" && typeof config.title === "string") {
      config.title = config.title.replace("{{company_name}}", companyName);
    }
    if (section.type === "contact") {
      config.whatsapp = whatsapp || config.whatsapp || "";
      config.whatsapp_number = whatsapp || config.whatsapp_number || "";
    }
    if (section.type === "footer") {
      config.company_name = companyName;
      if (!Array.isArray(config.links)) {
        config.links = defaultFooterLinks();
      }
    }

    return { ...section, config };
  });
}

export function materializeStoreTemplatePages(
  template: StoreTemplate,
  opts: { companyName?: string | null; whatsapp?: string | null } = {}
): StoreTemplatePage[] {
  const pages = [
    {
      slug: "inicio",
      title: "Inicio",
      status: "published" as const,
      is_home: true,
      show_in_nav: true,
      nav_order: 0,
      sections: template.sections,
    },
    ...(template.pages ?? defaultTemplatePages(template)),
  ];

  return pages.map((page) => ({
    ...page,
    seo_title: page.seo_title ?? page.title,
    seo_description: page.seo_description ?? template.description,
    status: page.status ?? "published",
    show_in_nav: page.show_in_nav ?? true,
    nav_order: page.nav_order ?? 99,
    is_home: page.is_home ?? false,
    sections: materializeStoreTemplateSections({ ...template, sections: page.sections }, opts),
  }));
}

export function materializeStoreTemplateNavigation(template: StoreTemplate): StoreTemplateNavItem[] {
  return template.navItems ?? [
    { label: "Inicio", href: "/", order: 0 },
    { label: template.category === "hospedagem" ? "Acomodacoes" : "Produtos", href: "/busca", order: 1 },
    { label: "Sobre", href: "/sobre", order: 2 },
    { label: "FAQ", href: "/faq", order: 3 },
    { label: "Contato", href: "/contato", order: 4 },
  ];
}

function defaultTemplatePages(template: StoreTemplate): StoreTemplatePage[] {
  const image = heroImageFromTemplate(template);
  const isHospedagem = template.category === "hospedagem";
  const productLabel = isHospedagem ? "acomodacoes" : template.category === "emissivo" ? "pacotes" : "experiencias";
  const aboutText = isHospedagem
    ? "Receba hospedes com uma vitrine editorial: fotos grandes, informacoes claras, regras de reserva e detalhes de conforto em uma experiencia simples de editar."
    : template.category === "emissivo"
      ? "Organize pacotes, saidas em grupo e viagens sob medida em paginas comerciais prontas para o cliente entender roteiro, inclusos, condicoes e canais de compra."
      : "Venda passeios, transfers, ingressos e experiencias locais com uma estrutura pensada para conversao: busca clara, cards ricos, roteiro, inclusos e atendimento rapido.";

  return [
    {
      slug: "sobre",
      title: "Sobre",
      nav_order: 2,
      sections: [
        hero("Sobre a {{company_name}}", `Conheca nossa curadoria de ${productLabel} e a forma como cuidamos de cada atendimento.`, "Ver produtos", "/busca", image, isHospedagem ? "editorial" : "marketplace"),
        about("Uma loja pronta para vender com elegancia", aboutText, image),
        testimonials([
          { name: "Cliente verificado", rating: 5, text: "As informacoes ficam claras, bonitas e faceis de editar no painel." },
          { name: "Viajante atendido", rating: 5, text: "Consegui comparar opcoes e entrar em contato sem depender de troca infinita de mensagens." },
          { name: "Equipe comercial", rating: 5, text: "O modelo ja vem com a estrutura que uma loja de turismo precisa para vender." },
        ]),
        footer(template.description),
      ],
    },
    {
      slug: "faq",
      title: "FAQ",
      nav_order: 3,
      sections: [
        hero("Duvidas frequentes", "Respostas prontas para reduzir atrito antes da compra. Edite conforme sua operacao.", "Falar com a equipe", "/contato", image, isHospedagem ? "editorial" : "marketplace"),
        faq(),
        contact(),
        footer(template.description),
      ],
    },
    {
      slug: "contato",
      title: "Contato",
      nav_order: 4,
      sections: [
        hero("Fale com a equipe", "Tire duvidas, solicite cotacoes e receba atendimento para escolher a melhor opcao.", "Buscar produtos", "/busca", image, isHospedagem ? "editorial" : "marketplace"),
        contact(),
        faq([
          { question: "Quanto tempo demora o atendimento?", answer: "Personalize esta resposta com o prazo real de retorno da sua equipe." },
          { question: "Posso pedir uma cotacao sob medida?", answer: "Sim. Use o formulario ou WhatsApp para solicitar uma proposta personalizada." },
        ]),
        footer(template.description),
      ],
    },
    {
      slug: "termos",
      title: "Termos de uso",
      show_in_nav: false,
      nav_order: 90,
      sections: [
        hero("Termos de uso", "Condicoes gerais para uso da loja e contratacao dos servicos.", "Voltar ao inicio", "/", image, "classic"),
        about("Termos de uso", "Este texto e um modelo inicial. Edite no painel para refletir as regras comerciais, politica de pagamento, cancelamento, responsabilidades do viajante e condicoes especificas da sua operacao.\n\nAo realizar uma compra ou solicitar atendimento, o cliente declara estar ciente das informacoes apresentadas na pagina do produto, incluindo roteiro, inclusos, nao inclusos, prazos e politicas de cancelamento."),
        footer(template.description),
      ],
    },
    {
      slug: "privacidade",
      title: "Politica de privacidade",
      show_in_nav: false,
      nav_order: 91,
      sections: [
        hero("Politica de privacidade", "Como os dados dos clientes sao tratados na loja.", "Falar com a equipe", "/contato", image, "classic"),
        about("Politica de privacidade", "Este texto e um placeholder editavel. Descreva quais dados sao coletados, para quais finalidades sao usados, como o cliente pode solicitar alteracao/exclusao e quais ferramentas de pagamento, atendimento e analytics fazem parte da operacao.\n\nA TuriApp oferece recursos de LGPD, consentimento e exclusao/exportacao de dados, mas cada tenant deve revisar este conteudo conforme sua realidade juridica."),
        footer(template.description),
      ],
    },
  ];
}

function defaultFooterLinks() {
  return [
    { label: "Produtos", href: "/busca" },
    { label: "FAQ", href: "/faq" },
    { label: "Termos", href: "/termos" },
    { label: "Privacidade", href: "/privacidade" },
  ];
}

function heroImageFromTemplate(template: StoreTemplate): string {
  const heroSection = template.sections.find((section) => section.type === "hero");
  const image = heroSection?.config?.image_url;
  return typeof image === "string" && image ? image : "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80";
}

function hero(
  title: string,
  subtitle: string,
  ctaLabel: string,
  ctaHref: string,
  imageUrl: string,
  variant: "classic" | "marketplace" | "editorial",
  stats: { value: string; label: string }[] = []
): StoreTemplateSection {
  return {
    type: "hero",
    visible: true,
    config: {
      variant,
      eyebrow: variant === "editorial" ? "Experiencia selecionada" : "Loja oficial",
      title,
      subtitle,
      cta_label: ctaLabel,
      cta_href: ctaHref,
      image_url: imageUrl,
      overlay_opacity: variant === "classic" ? 0.45 : 0.55,
      height: variant === "editorial" ? "lg" : "md",
      align: variant === "classic" ? "center" : "left",
      stats,
    },
  };
}

function productGrid(title: string, subtitle: string, module: string, variant: "marketplace" | "editorial"): StoreTemplateSection {
  return {
    type: "product-grid",
    visible: true,
    config: { title, subtitle, module, columns: variant === "editorial" ? 3 : 2, limit: 6, variant },
  };
}

function searchBar(placeholder: string): StoreTemplateSection {
  return { type: "search-bar", visible: true, config: { placeholder } };
}

function banner(title: string, subtitle: string, ctaLabel: string, ctaHref: string, bgColor: string): StoreTemplateSection {
  return {
    type: "banner",
    visible: true,
    config: { title, subtitle, cta_label: ctaLabel, cta_href: ctaHref, bg_color: bgColor },
  };
}

function about(title: string, text: string, imageUrl?: string): StoreTemplateSection {
  return { type: "about", visible: true, config: { title, text, image_url: imageUrl } };
}

function testimonials(items: { name: string; rating: number; text: string }[]): StoreTemplateSection {
  return { type: "testimonials", visible: true, config: { title: "Quem ja comprou recomenda", items } };
}

function faq(items = [
  { question: "Posso editar este modelo depois?", answer: "Sim. O modelo e copiado para a loja do tenant e pode ser editado no painel." },
  { question: "Consigo trocar fotos, textos e cores?", answer: "Sim. O tenant pode ajustar tema, secoes, produtos, imagens e conteudo comercial." },
]): StoreTemplateSection {
  return { type: "faq", visible: true, config: { title: "Duvidas frequentes", items } };
}

function contact(): StoreTemplateSection {
  return { type: "contact", visible: true, config: { title: "Fale com a equipe", whatsapp: "", phone: "", email: "" } };
}

function footer(description = "Turismo com qualidade, tecnologia e atendimento humano."): StoreTemplateSection {
  return { type: "footer", visible: true, config: { company_name: "", description } };
}

function productDefaults(
  module: StoreTemplateProductDefaults["module"],
  type: string,
  overrides: Partial<StoreTemplateProductDefaults> = {}
): StoreTemplateProductDefaults {
  const isHospedagem = module === "hospedagem";
  const isEmissivo = module === "emissivo";
  const base: StoreTemplateProductDefaults = {
    module,
    type,
    title: isHospedagem ? "Suite vista jardim" : isEmissivo ? "Pacote completo para Gramado" : "Cataratas com transfer",
    description: isHospedagem
      ? "Acomodacao confortavel com cafe da manha, boa localizacao e atendimento proximo."
      : isEmissivo
      ? "Pacote com roteiro organizado, hospedagem selecionada e suporte antes e durante a viagem."
      : "Experiencia local com roteiro claro, acompanhamento e suporte para o viajante.",
    extra_data: {
      duration: isHospedagem ? "Diarias flexiveis" : isEmissivo ? "5 dias / 4 noites" : "6 horas",
      location: isHospedagem ? "Regiao central" : isEmissivo ? "Gramado e Canela" : "Foz do Iguacu",
      highlights: isHospedagem
        ? ["Cafe da manha incluso", "Quarto climatizado", "Ideal para casais"]
        : isEmissivo
        ? ["Saida em grupo", "Roteiro por dia", "Parcelamento disponivel"]
        : ["Transfer incluso", "Guia local", "Cancelamento facilitado"],
      included: isHospedagem
        ? ["Cafe da manha", "Wi-Fi", "Roupa de cama e banho"]
        : isEmissivo
        ? ["Hospedagem", "Roteiro descrito", "Suporte da agencia"]
        : ["Transporte", "Acompanhamento", "Seguro operacional"],
      not_included: isHospedagem ? ["Consumo de frigobar", "Passeios opcionais"] : ["Alimentacao nao descrita", "Despesas pessoais"],
      itinerary: isHospedagem
        ? [{ title: "Chegada", description: "Check-in e apresentacao da estrutura." }]
        : [
            { title: "Inicio da experiencia", description: "Recepcao, orientacoes e saida conforme horario combinado." },
            { title: "Roteiro principal", description: "Execucao do passeio ou pacote conforme descricao comercial." },
          ],
      important_info: "Personalize estas informacoes no cadastro do produto para refletir sua operacao real.",
      cancellation_policy: isHospedagem
        ? "Cancelamento gratuito ate 7 dias antes da data de chegada."
        : "Cancelamento gratis conforme a politica do operador. Edite esta regra no cadastro do produto.",
      guide_languages: isHospedagem ? [] : ["Portugues", "Espanhol"],
      gallery: isHospedagem
        ? [
            "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
          ]
        : [
            "/storefront/receptivo/hero-cataratas.jpg",
            "https://images.unsplash.com/photo-1580934908361-967195033215?auto=format&fit=crop&w=1200&q=80",
          ],
      capacity: isHospedagem ? "2 pessoas" : undefined,
      bedrooms: isHospedagem ? "1 quarto" : undefined,
      bathrooms: isHospedagem ? "1 banheiro" : undefined,
    },
  };

  return {
    ...base,
    ...overrides,
    extra_data: {
      ...base.extra_data,
      ...(overrides.extra_data ?? {}),
    },
  };
}
