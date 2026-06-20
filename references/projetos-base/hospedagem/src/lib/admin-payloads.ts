type Payload = Record<string, unknown>;

function compact(payload: Payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
}

function numberOrUndefined(value: unknown) {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function hospedagemPayload(body: Payload) {
  return compact({
    titulo: body.titulo,
    slug: body.slug,
    descricao_curta: body.descricaoCurta ?? body.descricao_curta,
    descricao_longa: body.descricaoLonga ?? body.descricao_longa,
    capacidade_max: numberOrUndefined(body.capacidadeMax ?? body.capacidade_max),
    quartos: numberOrUndefined(body.quartos),
    banheiros: numberOrUndefined(body.banheiros),
    preco_base: numberOrUndefined(body.precoBase ?? body.preco_base),
    status: body.status,
    destaque: body.destaque,
    imagens: body.imagens,
    amenidades: body.amenidades,
    regras: body.regras,
    check_in: body.checkIn ?? body.check_in,
    check_out: body.checkOut ?? body.check_out,
    latitude: numberOrUndefined(body.latitude),
    longitude: numberOrUndefined(body.longitude),
    seo_titulo: body.seoTitulo ?? body.seo_titulo,
    seo_descricao: body.seoDescricao ?? body.seo_descricao,
    seo_og_image: body.seoOgImage ?? body.seo_og_image,
  });
}

export function servicoPayload(body: Payload) {
  return compact({
    titulo: body.titulo,
    slug: body.slug,
    descricao: body.descricao,
    preco: numberOrUndefined(body.preco),
    unidade: body.unidade,
    categoria: body.categoria,
    disponivel: body.disponivel,
    imagem_url: body.imagemUrl ?? body.imagem_url,
    imagens: body.imagens,
    icone: body.icone,
    seo_titulo: body.seoTitulo ?? body.seo_titulo,
    seo_descricao: body.seoDescricao ?? body.seo_descricao,
  });
}

export function transportePayload(body: Payload) {
  return compact({
    titulo: body.titulo,
    descricao: body.descricao,
    tipo: body.tipo,
    capacidade: numberOrUndefined(body.capacidade),
    preco: numberOrUndefined(body.preco),
    duracao_estimada: body.duracaoEstimada ?? body.duracao_estimada,
    origem: body.origem,
    destino: body.destino,
    imagem_url: body.imagemUrl ?? body.imagem_url,
    disponivel: body.disponivel,
    whatsapp_link: body.whatsappLink ?? body.whatsapp_link,
  });
}
