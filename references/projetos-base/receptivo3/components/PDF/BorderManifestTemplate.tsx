import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Language, t } from './translations';

const DARK = '#1e293b';
const BORDER = '#94a3b8';
const LIGHT_BG = '#f1f5f9';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 25,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: DARK,
    paddingBottom: 8,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: DARK,
    textTransform: 'uppercase',
  },
  headerInfo: {
    fontSize: 9,
    color: '#475569',
    marginTop: 2,
  },
  officialHeader: {
    textAlign: 'center',
    marginBottom: 6,
  },
  officialText: {
    fontSize: 9,
    color: '#475569',
    fontStyle: 'italic',
  },
  officialTitle: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 3,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: DARK,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  // Top info table (company, vehicle, country, etc.)
  topInfoTable: {
    borderWidth: 1,
    borderColor: DARK,
    marginBottom: 8,
  },
  topInfoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: DARK,
  },
  topInfoCell: {
    paddingVertical: 4, paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: DARK,
  },
  topInfoLabel: {
    fontSize: 7,
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 1,
  },
  topInfoValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: DARK,
  },
  // Section title
  sectionTitle: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 4, paddingHorizontal: 6,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    fontSize: 9,
    borderBottomWidth: 1,
    borderBottomColor: DARK,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: DARK,
  },
  dateValue: {
    fontSize: 9,
    color: '#333',
    marginLeft: 4,
  },
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
    paddingVertical: 4,
    paddingHorizontal: 4,
    minHeight: 18,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 4,
    paddingHorizontal: 4,
    minHeight: 18,
    backgroundColor: LIGHT_BG,
  },
  tableCell: {
    fontSize: 8,
    color: '#333',
  },
  tableCellHeader: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingTop: 10,
  },
  signatureLine: {
    width: 200,
    borderTopWidth: 1,
    borderTopColor: DARK,
    paddingTop: 4,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#475569',
  },
  stampArea: {
    borderWidth: 1,
    borderTopStyle: 'dashed',
    borderRightStyle: 'dashed',
    borderBottomStyle: 'dashed',
    borderLeftStyle: 'dashed',
    borderColor: '#ccc',
    width: 200,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampText: {
    fontSize: 8,
    color: '#999',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 25,
    right: 25,
    textAlign: 'center',
    fontSize: 7,
    color: '#999',
  },
});

export interface BorderManifestPDFData {
  companyName: string;
  vehiclePlate: string;
  driverName: string;
  driverDocument: string;
  date: string;
  departureCountry?: string;
  entryCountry?: string;
  borderPoint?: string;
  registrationCountry?: string;
  passengers: Array<{
    name: string;
    nationality?: string;
    documentType?: string;
    documentNumber?: string;
    birthdate?: string;
    gender?: string;
  }>;
  crew?: Array<{
    name: string;
    nationality?: string;
    documentType?: string;
    documentNumber?: string;
    birthdate?: string;
  }>;
}

const COL_NUM = 25;
const COL_NAME = 170;
const COL_NAT = 75;
const COL_DOC_TYPE = 55;
const COL_DOC_NUM = 95;
const COL_BIRTH = 65;
const COL_GENDER = 40;
const COL_MIGR = 55;

export const BorderManifestTemplate = ({ data, lang = 'pt' }: { data: BorderManifestPDFData; lang?: Language }) => {
  const i = t(lang);
  const safePassengers = Array.isArray(data.passengers) ? data.passengers : [];
  const emptyRows = Array.from({ length: 5 }, (_, idx) => idx);
  const totalPassengers = safePassengers.length;

  // Crew defaults to driver if not provided
  const crew = data.crew && data.crew.length > 0 ? data.crew : [{
    name: data.driverName || '',
    nationality: data.registrationCountry || 'BRASIL',
    documentType: 'CPF',
    documentNumber: data.driverDocument || '',
    birthdate: '',
  }];

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>

        {/* Official Header (Argentine format) */}
        <View style={styles.officialHeader}>
          <Text style={styles.officialTitle}>
            MINISTERIO DEL INTERIOR - DIRECCIÓN NACIONAL DE MIGRACIONES — ANEXO II Resolución 2.997/86
          </Text>
        </View>

        {/* Header with company info */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{data.companyName || ''}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={styles.headerInfo}>{i.vehicle}: </Text>
              <Text style={[styles.headerInfo, { fontWeight: 'bold' }]}>{data.vehiclePlate || ''}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={styles.headerInfo}>{i.driver}: </Text>
              <Text style={[styles.headerInfo, { fontWeight: 'bold' }]}>{data.driverName || ''}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={styles.headerInfo}>{i.driverDocument}: </Text>
              <Text style={[styles.headerInfo, { fontWeight: 'bold' }]}>{data.driverDocument || ''}</Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {lang === 'es' ? 'Lista de Pasajeros / Manifiesto de Pasajeros' :
           lang === 'en' ? 'Passenger List / Passenger Manifest' :
           'Lista de Pasajeros / Manifesto de Passageiros'}
        </Text>
        <Text style={styles.subtitle}>
          {i.borderControlDoc} / Border Control Document
        </Text>

        {/* Top info row */}
        <View style={styles.topInfoTable}>
          <View style={styles.topInfoRow}>
            <View style={[styles.topInfoCell, { width: '25%' }]}>
              <Text style={styles.topInfoLabel}>{i.date}:</Text>
              <Text style={styles.topInfoValue}>{data.date || ''}</Text>
            </View>
            <View style={[styles.topInfoCell, { width: '25%' }]}>
              <Text style={styles.topInfoLabel}>{i.departureCountry}:</Text>
              <Text style={styles.topInfoValue}>{data.departureCountry || 'BRASIL'}</Text>
            </View>
            <View style={[styles.topInfoCell, { width: '25%' }]}>
              <Text style={styles.topInfoLabel}>{i.entryCountry}:</Text>
              <Text style={styles.topInfoValue}>{data.entryCountry || 'ARGENTINA'}</Text>
            </View>
            <View style={[styles.topInfoCell, { width: '25%', borderRightWidth: 0 }]}>
              <Text style={styles.topInfoLabel}>{i.withPassengers}:</Text>
              <Text style={styles.topInfoValue}>{String(totalPassengers)}</Text>
            </View>
          </View>
        </View>

        {/* Crew Section */}
        <Text style={styles.sectionTitle}>{i.crewMembers} / TRIPULANTES</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCellHeader, { width: COL_NUM, textAlign: 'center' }]}>Nº</Text>
          <Text style={[styles.tableCellHeader, { width: COL_NAME }]}>{i.surnameAndName}</Text>
          <Text style={[styles.tableCellHeader, { width: COL_BIRTH }]}>{i.birthdate}</Text>
          <Text style={[styles.tableCellHeader, { width: COL_NAT }]}>{i.nationality}</Text>
          <Text style={[styles.tableCellHeader, { width: COL_DOC_TYPE + COL_DOC_NUM }]}>{i.docType} / {i.docNumber}</Text>
          <Text style={[styles.tableCellHeader, { width: COL_MIGR }]}>{i.migratoryStatus}</Text>
        </View>
        {crew.map((member, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: COL_NUM, textAlign: 'center' }]}>{String(idx + 1)}</Text>
            <Text style={[styles.tableCell, { width: COL_NAME, fontWeight: 'bold' }]}>{member.name || ''}</Text>
            <Text style={[styles.tableCell, { width: COL_BIRTH }]}>{member.birthdate || ''}</Text>
            <Text style={[styles.tableCell, { width: COL_NAT }]}>{member.nationality || ''}</Text>
            <Text style={[styles.tableCell, { width: COL_DOC_TYPE + COL_DOC_NUM }]}>
              {member.documentType ? `${member.documentType} ${member.documentNumber || ''}` : member.documentNumber || ''}
            </Text>
            <Text style={[styles.tableCell, { width: COL_MIGR }]}> </Text>
          </View>
        ))}

        {/* Passengers Section */}
        <Text style={[styles.sectionTitle, { marginTop: 6 }]}>{i.passengers} / PASAJEROS</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCellHeader, { width: COL_NUM, textAlign: 'center' }]}>Nº</Text>
          <Text style={[styles.tableCellHeader, { width: COL_NAME }]}>{i.surnameAndName}</Text>
          <Text style={[styles.tableCellHeader, { width: COL_BIRTH }]}>{i.birthdate}</Text>
          <Text style={[styles.tableCellHeader, { width: COL_NAT }]}>{i.nationality}</Text>
          <Text style={[styles.tableCellHeader, { width: COL_DOC_TYPE }]}>{i.docType}</Text>
          <Text style={[styles.tableCellHeader, { width: COL_DOC_NUM }]}>{i.docNumber}</Text>
          <Text style={[styles.tableCellHeader, { width: COL_GENDER, textAlign: 'center' }]}>{i.gender}</Text>
          <Text style={[styles.tableCellHeader, { width: COL_MIGR }]}>{i.migratoryStatus}</Text>
        </View>

        {/* Filled Rows */}
        {safePassengers.map((pax, idx) => (
          <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { width: COL_NUM, textAlign: 'center' }]}>{String(idx + 1)}</Text>
            <Text style={[styles.tableCell, { width: COL_NAME, fontWeight: 'bold' }]}>{pax.name || ''}</Text>
            <Text style={[styles.tableCell, { width: COL_BIRTH }]}>{pax.birthdate || ''}</Text>
            <Text style={[styles.tableCell, { width: COL_NAT }]}>{pax.nationality || ''}</Text>
            <Text style={[styles.tableCell, { width: COL_DOC_TYPE }]}>{pax.documentType || ''}</Text>
            <Text style={[styles.tableCell, { width: COL_DOC_NUM }]}>{pax.documentNumber || ''}</Text>
            <Text style={[styles.tableCell, { width: COL_GENDER, textAlign: 'center' }]}>{pax.gender || ''}</Text>
            <Text style={[styles.tableCell, { width: COL_MIGR }]}> </Text>
          </View>
        ))}

        {/* Empty Rows for Manual Additions */}
        {emptyRows.map((_, idx) => {
          const rowIndex = totalPassengers + idx;
          return (
            <View key={`empty-${idx}`} style={rowIndex % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.tableCell, { width: COL_NUM, textAlign: 'center' }]}>{String(totalPassengers + idx + 1)}</Text>
              <Text style={[styles.tableCell, { width: COL_NAME }]}> </Text>
              <Text style={[styles.tableCell, { width: COL_BIRTH }]}> </Text>
              <Text style={[styles.tableCell, { width: COL_NAT }]}> </Text>
              <Text style={[styles.tableCell, { width: COL_DOC_TYPE }]}> </Text>
              <Text style={[styles.tableCell, { width: COL_DOC_NUM }]}> </Text>
              <Text style={[styles.tableCell, { width: COL_GENDER }]}> </Text>
              <Text style={[styles.tableCell, { width: COL_MIGR }]}> </Text>
            </View>
          );
        })}

        {/* Signature & Stamp Section */}
        <View style={styles.signatureSection}>
          <View style={styles.stampArea}>
            <Text style={styles.stampText}>{i.companyStamp}</Text>
          </View>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>{i.driverSignature}</Text>
          </View>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>{i.date}: _______________</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{data.companyName || ''} — {i.borderControlDoc}</Text>
        </View>
      </Page>
    </Document>
  );
};
