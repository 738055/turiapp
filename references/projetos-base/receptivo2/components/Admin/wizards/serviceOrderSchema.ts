import { z } from 'zod';

// ═══════════════════════════════════════════════════════════
// Schemas LEGADOS (mantidos para compatibilidade)
// ═══════════════════════════════════════════════════════════

export const passengerSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  birthdate: z.string().optional(),
  nationality: z.string().optional(),
  document_type: z.enum(['passport', 'rg', 'dni', 'other']).optional(),
  document_number: z.string().optional(),
  gender: z.enum(['M', 'F']).optional(),
  is_lead: z.boolean().optional(),
});

export const serviceItemSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().optional(),
  service_type: z.enum(['transfer_in', 'transfer_out', 'tour', 'excursion', 'other']),
  description: z.string().min(2, 'Descrição é obrigatória'),
  flight_number: z.string().optional(),
  flight_time: z.string().optional(),
  airline_locator: z.string().optional(),
  pick_up: z.string().optional(),
  drop_off: z.string().optional(),
  assigned_vehicle_id: z.string().optional(),
  notes: z.string().optional(),
});

export const serviceOrderSchema = z.object({
  os_number: z.string().min(1, 'Número da OS é obrigatório'),
  agency_name: z.string().optional(),
  reference_code: z.string().optional(),
  date_in: z.string().min(1, 'Data é obrigatória'),
  date_out: z.string().optional().default(''),
  hotel_name: z.string().optional(),
  pax_count: z.number().optional().default(1),
  children_count: z.number().optional().default(0),
  lead_passenger_name: z.string().optional().default(''),
  notes: z.string().optional(),
  assigned_guide_id: z.string().optional(),
  departure_country: z.string().optional(),
  entry_country: z.string().optional(),
  border_point: z.string().optional(),
});

export type ServiceOrderFormData = z.infer<typeof serviceOrderSchema>;
export type PassengerFormData = z.infer<typeof passengerSchema>;
export type ServiceItemFormData = z.infer<typeof serviceItemSchema>;

// ═══════════════════════════════════════════════════════════
// 1. MANIFESTO DE FRONTEIRA (Argentina / Paraguai)
// ═══════════════════════════════════════════════════════════

export const manifestoPassengerSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  birthdate: z.string().min(1, 'Data de nascimento é obrigatória'),
  nationality: z.string().min(1, 'Nacionalidade é obrigatória'),
  document_type: z.enum(['passport', 'rg', 'dni', 'other']),
  document_number: z.string().min(1, 'Nº do documento é obrigatório'),
  gender: z.enum(['M', 'F']).optional(),
});

export const manifestoSchema = z.object({
  tipo_manifesto: z.enum(['ARGENTINA', 'PARAGUAI']),
  data_viagem: z.string().min(1, 'Data da viagem é obrigatória'),
  os_number: z.string().optional(),
  agency_name: z.string().optional(),

  // Veículo
  veiculo_marca_modelo: z.string().min(1, 'Marca/Modelo é obrigatório'),
  veiculo_placa: z.string().min(1, 'Placa é obrigatória'),
  veiculo_ano: z.string().optional(),
  veiculo_empresa: z.string().optional().default('Pratik Turismo / Maia Tours'),

  // Motorista
  motorista_nome: z.string().min(1, 'Nome do motorista é obrigatório'),
  motorista_documento: z.string().optional(),

  // Guia (opcional)
  guia_nome: z.string().optional(),
  guia_documento: z.string().optional(),

  // Fronteira
  departure_country: z.string().optional().default('BRASIL'),
  entry_country: z.string().optional(),
  border_point: z.string().optional(),

  notes: z.string().optional(),
});

export type ManifestoFormData = z.infer<typeof manifestoSchema>;
export type ManifestoPassengerData = z.infer<typeof manifestoPassengerSchema>;

// ═══════════════════════════════════════════════════════════
// 2. AGENDA PAX (Welcome Doc / Itinerário do Passageiro)
// ═══════════════════════════════════════════════════════════

export const agendaServiceSchema = z.object({
  data_servico: z.string().min(1, 'Data é obrigatória'),
  hora_apresentacao: z.string().optional(),
  nome_servico: z.string().min(2, 'Nome do serviço é obrigatório'),
  tipo: z.enum(['REGULAR', 'PRIVATIVO']),
  service_type: z.enum(['transfer_in', 'transfer_out', 'tour', 'excursion', 'other']).optional(),
  voo_info: z.string().optional(),
  observacao: z.string().optional(),
});

export const agendaPaxSchema = z.object({
  venda_id: z.string().min(1, 'Nº da Venda/OS é obrigatório'),
  cliente_titular: z.string().min(2, 'Nome do titular é obrigatório'),
  agencia: z.string().optional(),
  hotel: z.string().min(1, 'Hotel é obrigatório'),

  // Quantidades detalhadas
  pax_adt: z.number().min(1, 'Mínimo 1 adulto'),
  pax_chd: z.number().optional().default(0),
  pax_inf: z.number().optional().default(0),
  pax_sen: z.number().optional().default(0),

  date_in: z.string().min(1, 'Data IN é obrigatória'),
  date_out: z.string().min(1, 'Data OUT é obrigatória'),
  contato_emergencia: z.string().optional(),
  notes: z.string().optional(),

  // Guia alocado
  assigned_guide_id: z.string().optional(),
});

export type AgendaPaxFormData = z.infer<typeof agendaPaxSchema>;
export type AgendaServiceData = z.infer<typeof agendaServiceSchema>;

// ═══════════════════════════════════════════════════════════
// 3. ORDEM DE SERVIÇO / ESCALA DE GUIAS
// ═══════════════════════════════════════════════════════════

export const pickupItemSchema = z.object({
  horario: z.string().min(1, 'Horário é obrigatório'),
  hotel: z.string().min(1, 'Hotel é obrigatório'),
  nome_pax: z.string().min(2, 'Nome do PAX é obrigatório'),
  telefone_pax: z.string().optional(),
  quantidade: z.number().min(1).default(1),
  idioma: z.string().optional().default('PORTUGUES'),
  tipo: z.string().optional().default('REGULAR'),
  voo: z.string().optional(),
  venda_relacionada: z.string().optional(),
  agencia_cliente: z.string().optional(),
  observacao: z.string().optional(),
});

export const escalaOSSchema = z.object({
  numero_os: z.string().min(1, 'Nº da OS é obrigatório'),
  data_servico: z.string().min(1, 'Data é obrigatória'),
  servico_geral: z.string().min(2, 'Nome do serviço é obrigatório'),

  // Guia e Motorista (podem ser pessoas diferentes)
  guia_responsavel_id: z.string().optional(),
  motorista_responsavel_id: z.string().optional(),

  // Veículo
  veiculo_alocado_id: z.string().optional(),
  veiculo_descricao: z.string().optional(), // Ex: "VAN 15"

  total_pax: z.number().optional().default(0),
  notes: z.string().optional(),
});

export type EscalaOSFormData = z.infer<typeof escalaOSSchema>;
export type PickupItemData = z.infer<typeof pickupItemSchema>;
