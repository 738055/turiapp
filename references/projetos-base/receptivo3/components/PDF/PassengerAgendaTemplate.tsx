import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Language, t } from './translations';

const GREEN = '#2d8c3c';
const LIGHT_GREEN = '#e8f5e9';
const DARK = '#1e293b';
const GRAY_BG = '#f1f5f9';
const BORDER = '#cbd5e1';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 25,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
  // Header
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: GREEN,
    paddingBottom: 8,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: GREEN,
    textTransform: 'uppercase',
  },
  companyInfo: {
    fontSize: 8,
    color: '#555',
    marginTop: 1,
  },
  // Title
  titleBar: {
    backgroundColor: GREEN,
    paddingVertical: 8, paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: 3,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  // Info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    marginBottom: 10,
  },
  infoCell: {
    width: '33.33%',
    paddingVertical: 6, paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  infoCellWide: {
    width: '66.66%',
    paddingVertical: 6, paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  infoLabel: {
    fontSize: 7,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 10,
    color: DARK,
    fontWeight: 'bold',
  },
  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: DARK,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 5,
    paddingHorizontal: 4,
    minHeight: 22,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 5,
    paddingHorizontal: 4,
    minHeight: 22,
    backgroundColor: GRAY_BG,
  },
  tableCell: {
    fontSize: 9,
    color: '#333',
  },
  tableCellBold: {
    fontSize: 9,
    color: '#333',
    fontWeight: 'bold',
  },
  tableCellHeader: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  // Observation row (below service)
  obsRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fefce8',
  },
  obsText: {
    fontSize: 7,
    color: '#92400e',
    fontStyle: 'italic',
    paddingLeft: 4,
  },
  // Recommendations
  recsBox: {
    backgroundColor: LIGHT_GREEN,
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: GREEN,
    marginTop: 14,
  },
  recsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  recsText: {
    fontSize: 8,
    color: '#333',
    lineHeight: 1.6,
    marginBottom: 2,
  },
  recsAttention: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#b91c1c',
    marginTop: 4,
    marginBottom: 4,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 25,
    right: 25,
    textAlign: 'center',
    fontSize: 7,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 6,
  },
});

export interface PassengerAgendaPDFData {
  // Passenger info
  leadPassengerName: string;
  paxCount: number;
  childrenCount: number;
  hotelName?: string;
  agencyName?: string;
  referenceCode?: string;
  dateIn: string;
  dateOut: string;
  osNumber?: string;
  guideName?: string;
  guidePhone?: string;
  observations?: string;
  // Services
  items: Array<{
    description: string;
    serviceType?: string;
    date: string;
    time?: string;
    flightNumber?: string;
    flightTime?: string;
    notes?: string;
  }>;
  // Company
  companyName?: string;
  companyPhone?: string;
}

export const PassengerAgendaTemplate = ({ data, lang = 'pt' }: { data: PassengerAgendaPDFData; lang?: Language }) => {
  const i = t(lang);
  const companyName = data.companyName || 'Pratik Turismo / Maia Tours';
  const safeItems = Array.isArray(data.items) ? data.items : [];
  const now = new Date();
  const issuedAt = `${now.toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR')} ${now.toLocaleTimeString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Company Header */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyInfo}>{i.phone}: {data.companyPhone || '+55 45 99148-1100'}</Text>
            <Text style={styles.companyInfo}>{i.city}: Foz do Iguaçu - PR</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.companyInfo}>{i.support}: +55 45 99148-1100</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>{i.serviceAgenda}</Text>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>{i.sale}</Text>
            <Text style={styles.infoValue}>{data.osNumber || '-'}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>{i.hotel}</Text>
            <Text style={styles.infoValue}>{data.hotelName || '-'}</Text>
          </View>
          <View style={[styles.infoCell, { borderRightWidth: 0 }]}>
            <Text style={styles.infoLabel}>{i.issuedAt}</Text>
            <Text style={styles.infoValue}>{issuedAt}</Text>
          </View>

          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>{i.adults} / {i.children}</Text>
            <Text style={styles.infoValue}>{String(data.paxCount || 0)} ADT / {String(data.childrenCount || 0)} CHD</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>{i.holder}</Text>
            <Text style={styles.infoValue}>{data.leadPassengerName}</Text>
          </View>
          <View style={[styles.infoCell, { borderRightWidth: 0 }]}>
            <Text style={styles.infoLabel}>{i.language}</Text>
            <Text style={styles.infoValue}>{lang === 'pt' ? 'PORTUGUÊS' : lang === 'en' ? 'ENGLISH' : 'ESPAÑOL'}</Text>
          </View>

          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>{i.client}</Text>
            <Text style={styles.infoValue}>{data.agencyName || '-'}</Text>
          </View>
          <View style={[styles.infoCellWide, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>{i.observation}</Text>
            <Text style={styles.infoValue}>{data.observations || '-'}</Text>
          </View>
        </View>

        {/* Services Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCellHeader, { flex: 1 }]}>{i.service}</Text>
          <Text style={[styles.tableCellHeader, { width: 70 }]}>{i.type}</Text>
          <Text style={[styles.tableCellHeader, { width: 50 }]}>{i.airline}</Text>
          <Text style={[styles.tableCellHeader, { width: 85 }]}>{i.presentationDate}</Text>
          <Text style={[styles.tableCellHeader, { width: 55 }]}>{i.presentationHour}</Text>
        </View>
        {safeItems.map((item, idx) => (
          <React.Fragment key={idx}>
            <View style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.tableCellBold, { flex: 1 }]}>{item.description}</Text>
              <Text style={[styles.tableCell, { width: 70 }]}>{item.serviceType || '-'}</Text>
              <Text style={[styles.tableCell, { width: 50 }]}>
                {item.flightNumber || '-'}
              </Text>
              <Text style={[styles.tableCell, { width: 85 }]}>{item.date}</Text>
              <Text style={[styles.tableCellBold, { width: 55 }]}>{item.time || '-'}</Text>
            </View>
            {item.notes && (
              <View style={styles.obsRow}>
                <Text style={styles.obsText}>{item.notes}</Text>
              </View>
            )}
          </React.Fragment>
        ))}

        {/* Recommendations */}
        <View style={styles.recsBox}>
          <Text style={styles.recsTitle}>{i.recommendations}:</Text>
          <Text style={styles.recsAttention}>
            {lang === 'pt' ? 'Atenção:' : lang === 'en' ? 'Attention:' : 'Atención:'}
          </Text>
          <Text style={styles.recsText}>{i.attentionSchedule}</Text>
          <Text style={styles.recsText}>{i.highSeasonNote}</Text>
        </View>

        {/* Guide contact if available */}
        {data.guideName && (
          <View style={{ flexDirection: 'row', marginTop: 8, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: LIGHT_GREEN, borderRadius: 3, borderWidth: 1, borderColor: GREEN }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#166534' }}>
              {i.yourGuide}: {data.guideName}{data.guidePhone ? ` | ${i.mobile}: ${data.guidePhone}` : ''}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{companyName}</Text>
          <Text>Foz do Iguaçu - PR | {i.support}: +55 45 99148-1100</Text>
        </View>
      </Page>
    </Document>
  );
};
