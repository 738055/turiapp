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
      hero("Experiencias locais sem improviso", "Transfers, ingressos e passeios com atendimento humano, horarios claros e suporte do inicio ao fim.", "Ver experiencias", "/busca?modulo=receptivo", "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=80", "marketplace", [
        { value: "24h", label: "suporte ao viajante" },
        { value: "4.9", label: "avaliacao media" },
        { value: "100%", label: "roteiros editaveis" },
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
];

export function getStoreTemplate(id: string | null | undefined): StoreTemplate {
  return STORE_TEMPLATES.find((template) => template.id === id) ?? STORE_TEMPLATES[0];
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

function about(title: string, text: string): StoreTemplateSection {
  return { type: "about", visible: true, config: { title, text } };
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

function productDefaults(module: StoreTemplateProductDefaults["module"], type: string): StoreTemplateProductDefaults {
  const isHospedagem = module === "hospedagem";
  const isEmissivo = module === "emissivo";
  return {
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
    },
  };
}
