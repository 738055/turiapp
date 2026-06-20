import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#16a34a',
    paddingBottom: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
    textTransform: 'uppercase',
  },
  titleDetails: {
    textAlign: 'right',
  },
  voucherTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'uppercase',
  },
  bookingRef: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  col: {
    flexDirection: 'column',
    flexGrow: 1,
  },
  label: {
    fontSize: 9,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  value: {
    fontSize: 12,
    color: '#000',
    fontWeight: 'bold',
  },
  box: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  statusBadge: {
    paddingVertical: 4, paddingHorizontal: 8,
    backgroundColor: '#dcfce7',
    color: '#166534',
    borderRadius: 4,
    fontSize: 10,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
});

export interface VoucherData {
  id: string;
  customerName: string;
  productName: string;
  date: string;
  time?: string;
  quantity: number;
  total: number;
  pickupLocation?: string;
  importantInfo?: string;
  qrCodeDataUrl?: string;
}

export const VoucherTemplate = ({ booking }: { booking: VoucherData }) => (
  <Document>
    <Page size="A4" style={styles.page}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>Pratik Turismo</Text>
          <Text style={{ fontSize: 10, color: '#666' }}>Seu parceiro de viagens</Text>
        </View>
        <View style={styles.titleDetails}>
          <Text style={styles.voucherTitle}>Voucher de Serviço</Text>
          <Text style={styles.bookingRef}>Reserva #{booking.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={styles.statusBadge}>CONFIRMADO / PAGO</Text>
        </View>
      </View>

      {/* Main Info */}
      <View style={styles.box}>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Passeio / Serviço</Text>
            <Text style={[styles.value, { fontSize: 16 }]}>{booking.productName}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Data da Atividade</Text>
            <Text style={styles.value}>
              {new Date(booking.date + 'T12:00:00').toLocaleDateString('pt-BR')}
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Horário</Text>
            <Text style={styles.value}>{booking.time || 'A confirmar / Dia todo'}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Passageiro Principal</Text>
            <Text style={styles.value}>{booking.customerName}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Quantidade</Text>
            <Text style={styles.value}>{booking.quantity} Passageiro(s)</Text>
          </View>
        </View>

        {booking.pickupLocation && (
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Local de Embarque (Pickup)</Text>
              <Text style={styles.value}>{booking.pickupLocation}</Text>
            </View>
          </View>
        )}
      </View>

      {/* QR Code + Instruções */}
      <View style={{ flexDirection: 'row', marginTop: 20 }}>
        <View style={{ flex: 2, paddingRight: 20 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>
            INSTRUÇÕES IMPORTANTES:
          </Text>
          <Text style={{ fontSize: 9, color: '#444', lineHeight: 1.5 }}>
            {booking.importantInfo
              ? booking.importantInfo
              : [
                  '1. Apresente este voucher (digital ou impresso) ao guia ou na recepção.',
                  '2. Chegue com 15 minutos de antecedência.',
                  '3. Em caso de dúvidas ou atrasos, ligue para o suporte.',
                  '4. Cancelamentos devem ser feitos com 24h de antecedência.',
                ].join('\n')}
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          {booking.qrCodeDataUrl ? (
            <Image src={booking.qrCodeDataUrl} style={{ width: 100, height: 100 }} />
          ) : (
            <View
              style={{
                width: 80,
                height: 80,
                backgroundColor: '#e2e8f0',
                borderRadius: 4,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 8, color: '#666' }}>SEM QR</Text>
            </View>
          )}
          <Text style={{ fontSize: 8, marginTop: 5, color: '#666' }}>Scan para validar</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Pratik Turismo Ltda - CNPJ: 34.563.274/0001-00</Text>
        <Text>Foz do Iguaçu - PR | Suporte: +55 45-99101-7224</Text>
      </View>
    </Page>
  </Document>
);
