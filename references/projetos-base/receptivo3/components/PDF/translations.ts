export type Language = 'pt' | 'en' | 'es';

type TranslationKeys = {
  // Common
  page: string;
  of: string;
  date: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  observations: string;
  company: string;
  support: string;
  emergencyContact: string;

  // Service Order
  serviceOrder: string;
  driver: string;
  guide: string;
  vehicle: string;
  schedule: string;
  totalPax: string;
  hotel: string;
  presentationTime: string;
  language: string;
  passengerName: string;
  transferType: string;
  flight: string;
  sale: string;
  quantity: string;
  client: string;
  departureDate: string;
  observation: string;
  mainPassenger: string;
  referenceCode: string;
  checkIn: string;
  checkOut: string;
  adults: string;
  children: string;
  responsibleGuide: string;
  guideName: string;
  passengers: string;
  nationality: string;
  docType: string;
  docNumber: string;
  birthdate: string;
  gender: string;
  itinerary: string;
  time: string;
  serviceType: string;
  pickUp: string;
  dropOff: string;
  locator: string;
  status: string;
  printedBy: string;

  // Passenger Agenda
  serviceAgenda: string;
  issuedAt: string;
  holder: string;
  service: string;
  type: string;
  airline: string;
  presentationDate: string;
  presentationHour: string;
  recommendations: string;
  attentionSchedule: string;
  highSeasonNote: string;
  infantAbbr: string;
  seniorAbbr: string;

  // Border Manifest
  passengerManifest: string;
  borderControlDoc: string;
  crewMembers: string;
  surnameAndName: string;
  migratoryStatus: string;
  driverSignature: string;
  companyStamp: string;
  departureCountry: string;
  entryCountry: string;
  borderPoint: string;
  registrationCountry: string;
  sheetNumber: string;
  withPassengers: string;
  licensePlate: string;
  driverDocument: string;

  // Welcome Doc
  welcomeTitle: string;
  welcomeSubtitle: string;
  yourGuide: string;
  mobile: string;
  guestName: string;
  guests: string;
  yourItinerary: string;
  dayDate: string;
  flightInfo: string;
  serviceDesc: string;
  pickUpDropOff: string;
  importantInfo: string;
  domesticFlights: string;
  internationalFlights: string;
  optionalTours: string;
};

const translations: Record<Language, TranslationKeys> = {
  pt: {
    page: 'Página',
    of: 'de',
    date: 'Data',
    phone: 'Fone',
    email: 'E-mail',
    address: 'Endereço',
    city: 'Cidade',
    observations: 'Observações',
    company: 'Empresa',
    support: 'Suporte',
    emergencyContact: 'Contato de Emergência',

    serviceOrder: 'Ordem de Serviço',
    driver: 'Motorista',
    guide: 'Guia',
    vehicle: 'Veículo',
    schedule: 'Escala',
    totalPax: 'Total Pax',
    hotel: 'Hotel',
    presentationTime: 'H. Apres.',
    language: 'Idioma',
    passengerName: 'Nome Pax',
    transferType: 'Tp. Transfer',
    flight: 'Voo',
    sale: 'Venda',
    quantity: 'Qtde',
    client: 'Cliente',
    departureDate: 'Data OUT',
    observation: 'Observação',
    mainPassenger: 'Passageiro Principal',
    referenceCode: 'Código de Referência',
    checkIn: 'Entrada',
    checkOut: 'Saída',
    adults: 'Adultos',
    children: 'Crianças',
    responsibleGuide: 'Guia Responsável',
    guideName: 'Nome do Guia',
    passengers: 'Passageiros',
    nationality: 'Nacionalidade',
    docType: 'Tipo Doc.',
    docNumber: 'Nº Documento',
    birthdate: 'Nascimento',
    gender: 'Sexo',
    itinerary: 'Roteiro / Itinerário',
    time: 'Horário',
    serviceType: 'Tipo de Serviço',
    pickUp: 'Pick-Up',
    dropOff: 'Drop-Off',
    locator: 'Localizador',
    status: 'Status',
    printedBy: 'Emitido por',

    serviceAgenda: 'Agenda de Serviços',
    issuedAt: 'Emissão',
    holder: 'Titular',
    service: 'Serviço',
    type: 'Tipo',
    airline: 'CIA',
    presentationDate: 'Data Apresentação',
    presentationHour: 'Hora Apre.',
    recommendations: 'Recomendações',
    attentionSchedule: 'O horário descrito na agenda é uma base. O horário exato dos transportes regulares serão sempre informados pelo setor operacional nas 24 horas antecedentes ao passeio.',
    highSeasonNote: 'Em alta temporada (dezembro, janeiro e julho) os horários poderão ser adiantados em até 1 hora, devido o alto fluxo.',
    infantAbbr: 'INF',
    seniorAbbr: 'SEN',

    passengerManifest: 'Manifesto de Passageiros',
    borderControlDoc: 'Documento para controle de fronteira',
    crewMembers: 'Tripulantes',
    surnameAndName: 'Sobrenome e Nome',
    migratoryStatus: 'Calif. Migratória',
    driverSignature: 'Assinatura do Motorista',
    companyStamp: 'Firma y Sello de la Empresa',
    departureCountry: 'Saiu de (País)',
    entryCountry: 'Entrou por (País)',
    borderPoint: 'Ponto de Fronteira',
    registrationCountry: 'País',
    sheetNumber: 'Folha Nº',
    withPassengers: 'Com Passageiros',
    licensePlate: 'Matrícula nº',
    driverDocument: 'Documento',

    welcomeTitle: 'Bem-vindo(a) às Cataratas do Iguaçu!',
    welcomeSubtitle: 'Welcome to Iguazu Falls!',
    yourGuide: 'Seu Guia',
    mobile: 'Celular',
    guestName: 'Nome do Hóspede',
    guests: 'Hóspedes',
    yourItinerary: 'Seu Roteiro',
    dayDate: 'Dia / Data',
    flightInfo: 'Voo',
    serviceDesc: 'Serviço',
    pickUpDropOff: 'Pick-Up / Drop-Off',
    importantInfo: 'Informações Importantes',
    domesticFlights: 'Voos domésticos (Brasil): Esteja no aeroporto 2 horas antes do embarque.',
    internationalFlights: 'Voos internacionais (Argentina): Esteja no aeroporto 3 horas antes do embarque.',
    optionalTours: 'Passeios opcionais estão sujeitos à disponibilidade e condições climáticas.',
  },

  en: {
    page: 'Page',
    of: 'of',
    date: 'Date',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    city: 'City',
    observations: 'Observations',
    company: 'Company',
    support: 'Support',
    emergencyContact: 'Emergency Contact',

    serviceOrder: 'Service Order',
    driver: 'Driver',
    guide: 'Guide',
    vehicle: 'Vehicle',
    schedule: 'Schedule',
    totalPax: 'Total Pax',
    hotel: 'Hotel',
    presentationTime: 'Pickup Time',
    language: 'Language',
    passengerName: 'Passenger Name',
    transferType: 'Transfer Type',
    flight: 'Flight',
    sale: 'Sale',
    quantity: 'Qty',
    client: 'Client',
    departureDate: 'Departure Date',
    observation: 'Observation',
    mainPassenger: 'Lead Passenger',
    referenceCode: 'Reference Code',
    checkIn: 'Check-In',
    checkOut: 'Check-Out',
    adults: 'Adults',
    children: 'Children',
    responsibleGuide: 'Assigned Guide',
    guideName: 'Guide Name',
    passengers: 'Passengers',
    nationality: 'Nationality',
    docType: 'Doc. Type',
    docNumber: 'Doc. Number',
    birthdate: 'Birthdate',
    gender: 'Gender',
    itinerary: 'Itinerary',
    time: 'Time',
    serviceType: 'Service Type',
    pickUp: 'Pick-Up',
    dropOff: 'Drop-Off',
    locator: 'Locator',
    status: 'Status',
    printedBy: 'Issued by',

    serviceAgenda: 'Service Schedule',
    issuedAt: 'Issued',
    holder: 'Holder',
    service: 'Service',
    type: 'Type',
    airline: 'Airline',
    presentationDate: 'Date',
    presentationHour: 'Time',
    recommendations: 'Recommendations',
    attentionSchedule: 'The times shown in the schedule are approximate. Exact pickup times for regular transfers will be confirmed by the operations team 24 hours before the tour.',
    highSeasonNote: 'During high season (December, January, and July) schedules may be moved up by up to 1 hour due to high demand.',
    infantAbbr: 'INF',
    seniorAbbr: 'SEN',

    passengerManifest: 'Passenger Manifest',
    borderControlDoc: 'Border control document',
    crewMembers: 'Crew Members',
    surnameAndName: 'Surname and Name',
    migratoryStatus: 'Migratory Status',
    driverSignature: 'Driver Signature',
    companyStamp: 'Company Stamp & Signature',
    departureCountry: 'Departed from (Country)',
    entryCountry: 'Entered through (Country)',
    borderPoint: 'Border Point',
    registrationCountry: 'Country',
    sheetNumber: 'Sheet No.',
    withPassengers: 'With Passengers',
    licensePlate: 'License Plate',
    driverDocument: 'Document',

    welcomeTitle: 'Welcome to Iguazu Falls!',
    welcomeSubtitle: 'Bem-vindo(a) às Cataratas do Iguaçu!',
    yourGuide: 'Your Guide',
    mobile: 'Mobile',
    guestName: 'Guest Name',
    guests: 'Guests',
    yourItinerary: 'Your Itinerary',
    dayDate: 'Day / Date',
    flightInfo: 'Flight',
    serviceDesc: 'Service',
    pickUpDropOff: 'Pick-Up / Drop-Off',
    importantInfo: 'Important Information',
    domesticFlights: 'Domestic flights (Brazil): Please be at the airport 2 hours before departure.',
    internationalFlights: 'International flights (Argentina): Please be at the airport 3 hours before departure.',
    optionalTours: 'Optional tours are subject to availability and weather conditions.',
  },

  es: {
    page: 'Página',
    of: 'de',
    date: 'Fecha',
    phone: 'Teléfono',
    email: 'Correo',
    address: 'Dirección',
    city: 'Ciudad',
    observations: 'Observaciones',
    company: 'Empresa',
    support: 'Soporte',
    emergencyContact: 'Contacto de Emergencia',

    serviceOrder: 'Orden de Servicio',
    driver: 'Conductor',
    guide: 'Guía',
    vehicle: 'Vehículo',
    schedule: 'Escala',
    totalPax: 'Total Pax',
    hotel: 'Hotel',
    presentationTime: 'Hora Pres.',
    language: 'Idioma',
    passengerName: 'Nombre Pax',
    transferType: 'Tipo Transfer',
    flight: 'Vuelo',
    sale: 'Venta',
    quantity: 'Cant.',
    client: 'Cliente',
    departureDate: 'Fecha Salida',
    observation: 'Observación',
    mainPassenger: 'Pasajero Principal',
    referenceCode: 'Código de Referencia',
    checkIn: 'Check-In',
    checkOut: 'Check-Out',
    adults: 'Adultos',
    children: 'Niños',
    responsibleGuide: 'Guía Responsable',
    guideName: 'Nombre del Guía',
    passengers: 'Pasajeros',
    nationality: 'Nacionalidad',
    docType: 'Tipo Doc.',
    docNumber: 'Nº Documento',
    birthdate: 'Nacimiento',
    gender: 'Sexo',
    itinerary: 'Itinerario',
    time: 'Horario',
    serviceType: 'Tipo de Servicio',
    pickUp: 'Pick-Up',
    dropOff: 'Drop-Off',
    locator: 'Localizador',
    status: 'Estado',
    printedBy: 'Emitido por',

    serviceAgenda: 'Agenda de Servicios',
    issuedAt: 'Emisión',
    holder: 'Titular',
    service: 'Servicio',
    type: 'Tipo',
    airline: 'CIA',
    presentationDate: 'Fecha Presentación',
    presentationHour: 'Hora Pres.',
    recommendations: 'Recomendaciones',
    attentionSchedule: 'El horario descrito en la agenda es una base. El horario exacto de los transportes regulares será informado por el sector operacional en las 24 horas previas al tour.',
    highSeasonNote: 'En alta temporada (diciembre, enero y julio) los horarios podrán ser adelantados hasta 1 hora, debido al alto flujo.',
    infantAbbr: 'INF',
    seniorAbbr: 'SEN',

    passengerManifest: 'Manifiesto de Pasajeros',
    borderControlDoc: 'Documento para control de frontera',
    crewMembers: 'Tripulantes',
    surnameAndName: 'Apellidos y Nombres',
    migratoryStatus: 'Calif. Migratoria',
    driverSignature: 'Firma del Conductor',
    companyStamp: 'Firma y Sello de la Empresa',
    departureCountry: 'Salió de (País)',
    entryCountry: 'Entró por (País)',
    borderPoint: 'Punto de Frontera',
    registrationCountry: 'País',
    sheetNumber: 'Hoja Nº',
    withPassengers: 'Con Pasajeros',
    licensePlate: 'Matrícula nº',
    driverDocument: 'Documento',

    welcomeTitle: '¡Bienvenido(a) a las Cataratas del Iguazú!',
    welcomeSubtitle: 'Welcome to Iguazu Falls!',
    yourGuide: 'Su Guía',
    mobile: 'Celular',
    guestName: 'Nombre del Huésped',
    guests: 'Huéspedes',
    yourItinerary: 'Su Itinerario',
    dayDate: 'Día / Fecha',
    flightInfo: 'Vuelo',
    serviceDesc: 'Servicio',
    pickUpDropOff: 'Pick-Up / Drop-Off',
    importantInfo: 'Información Importante',
    domesticFlights: 'Vuelos domésticos (Brasil): Esté en el aeropuerto 2 horas antes del embarque.',
    internationalFlights: 'Vuelos internacionales (Argentina): Esté en el aeropuerto 3 horas antes del embarque.',
    optionalTours: 'Tours opcionales están sujetos a disponibilidad y condiciones climáticas.',
  },
};

export function t(lang: Language): TranslationKeys {
  return translations[lang] || translations.pt;
}
