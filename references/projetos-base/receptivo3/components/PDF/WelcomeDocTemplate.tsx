import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Language, t } from './translations';

const GREEN = '#16a34a';
const LIGHT_GREEN = '#dcfce7';
const GRAY_BORDER = '#e2e8f0';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  welcomeHeader: {
    backgroundColor: GREEN,
    padding: 20,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#bbf7d0',
    marginTop: 4,
    fontStyle: 'italic',
  },
  guideBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LIGHT_GREEN,
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: GREEN,
    marginBottom: 15,
  },
  guideText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#166534',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  col: {
    flexDirection: 'column',
    flexGrow: 1,
  },
  label: {
    fontSize: 8,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 1,
  },
  value: {
    fontSize: 11,
    color: '#000',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: GREEN,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: GREEN,
    paddingBottom: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: LIGHT_GREEN,
    borderBottomWidth: 1,
    borderBottomColor: GREEN,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: GRAY_BORDER,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableCell: {
    fontSize: 9,
    color: '#333',
  },
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#166534',
    textTransform: 'uppercase',
  },
  policyBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    marginTop: 15,
  },
  policyTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  policyText: {
    fontSize: 8,
    color: '#555',
    lineHeight: 1.6,
    marginBottom: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
});

export interface WelcomeDocPDFData {
  leadPassengerName: string;
  paxCount: number;
  dateIn: string;
  dateOut: string;
  hotelName?: string;
  guideName?: string;
  guidePhone?: string;
  items: Array<{
    date: string;
    time?: string;
    serviceType: string;
    description: string;
    flightNumber?: string;
    flightTime?: string;
    pickUp?: string;
    dropOff?: string;
  }>;
}

export const WelcomeDocTemplate = ({ data, lang = 'en' }: { data: WelcomeDocPDFData; lang?: Language }) => {
  const i = t(lang);
  const safeItems = Array.isArray(data.items) ? data.items : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Welcome Header */}
        <View style={styles.welcomeHeader}>
          <Text style={styles.welcomeTitle}>{i.welcomeTitle}</Text>
          <Text style={styles.welcomeSubtitle}>{i.welcomeSubtitle}</Text>
        </View>

        {/* Guide Contact */}
        <View style={styles.guideBox}>
          <Text style={styles.guideText}>
            {i.yourGuide}: {data.guideName || 'GUILHERME'} — {i.mobile}: {data.guidePhone || '+55 45 99148-1100'}
          </Text>
        </View>

        {/* Guest Info */}
        <View style={styles.infoSection}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>{i.guestName}</Text>
              <Text style={styles.value}>{data.leadPassengerName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>{i.guests}</Text>
              <Text style={styles.value}>{String(data.paxCount || 0)} Pax</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>{i.checkIn}</Text>
              <Text style={styles.value}>{data.dateIn}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>{i.checkOut}</Text>
              <Text style={styles.value}>{data.dateOut}</Text>
            </View>
            {data.hotelName && (
              <View style={styles.col}>
                <Text style={styles.label}>{i.hotel}</Text>
                <Text style={styles.value}>{data.hotelName}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Itinerary Table */}
        <Text style={styles.sectionTitle}>{i.yourItinerary}</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCellHeader, { width: 65 }]}>{i.dayDate}</Text>
          <Text style={[styles.tableCellHeader, { width: 45 }]}>{i.time}</Text>
          <Text style={[styles.tableCellHeader, { width: 60 }]}>{i.flightInfo}</Text>
          <Text style={[styles.tableCellHeader, { flex: 1 }]}>{i.serviceDesc}</Text>
          <Text style={[styles.tableCellHeader, { width: 100 }]}>{i.pickUpDropOff}</Text>
        </View>
        {safeItems.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: 65 }]}>{item.date}</Text>
            <Text style={[styles.tableCell, { width: 45 }]}>{item.time || '-'}</Text>
            <Text style={[styles.tableCell, { width: 60 }]}>
              {item.flightNumber
                ? `${item.flightNumber}${item.flightTime ? ` (${item.flightTime})` : ''}`
                : '-'}
            </Text>
            <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>
              {item.description}
            </Text>
            <Text style={[styles.tableCell, { width: 100 }]}>
              {[item.pickUp, item.dropOff].filter(Boolean).join(' > ') || '-'}
            </Text>
          </View>
        ))}

        {/* Policies */}
        <View style={styles.policyBox}>
          <Text style={styles.policyTitle}>{i.importantInfo}</Text>
          <Text style={styles.policyText}>- {i.domesticFlights}</Text>
          <Text style={styles.policyText}>- {i.internationalFlights}</Text>
          <Text style={styles.policyText}>- {i.optionalTours}</Text>
          <Text style={styles.policyText}>- {i.emergencyContact}: +55 45 99148-1100</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Pratik Turismo / Maia Tours</Text>
          <Text>Foz do Iguaçu - PR, Brazil | www.pratikturismo.com.br</Text>
        </View>
      </Page>
    </Document>
  );
};
