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
  // Header - company info
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: GREEN,
    paddingBottom: 8,
    marginBottom: 8,
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
    marginBottom: 8,
    borderRadius: 3,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  // Info row (date, driver, vehicle)
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: GRAY_BG,
    paddingVertical: 6, paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    marginBottom: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 9,
    color: '#666',
    marginRight: 4,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: DARK,
  },
  // Schedule bar
  scheduleBar: {
    flexDirection: 'row',
    backgroundColor: LIGHT_GREEN,
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: 3,
    paddingVertical: 6, paddingHorizontal: 10,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleBold: {
    fontSize: 11,
    fontWeight: 'bold',
    color: DARK,
  },
  scheduleLabel: {
    fontSize: 8,
    color: '#555',
    marginRight: 4,
    textTransform: 'uppercase',
  },
  // Section title
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: GREEN,
    paddingVertical: 4, paddingHorizontal: 8,
    marginBottom: 4,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: DARK,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 4,
    minHeight: 16,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 4,
    minHeight: 16,
    backgroundColor: GRAY_BG,
  },
  tableCell: {
    fontSize: 8,
    color: '#333',
  },
  tableCellBold: {
    fontSize: 8,
    color: '#333',
    fontWeight: 'bold',
  },
  tableCellHeader: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  // Box
  box: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  col: {
    flexDirection: 'column',
    flexGrow: 1,
  },
  label: {
    fontSize: 7,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 1,
  },
  value: {
    fontSize: 10,
    color: '#000',
    fontWeight: 'bold',
  },
  // Notes
  notes: {
    fontSize: 8,
    color: '#444',
    lineHeight: 1.4,
    padding: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 3,
    marginTop: 6,
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
  statusBadge: {
    paddingVertical: 3, paddingHorizontal: 8,
    backgroundColor: LIGHT_GREEN,
    color: GREEN,
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
});

export interface ServiceOrderPDFData {
  osNumber: string;
  agencyName?: string;
  referenceCode?: string;
  leadPassengerName: string;
  paxCount: number;
  childrenCount: number;
  dateIn: string;
  dateOut: string;
  hotelName?: string;
  guideName?: string;
  guidePhone?: string;
  status: string;
  passengers: Array<{
    name: string;
    birthdate?: string;
    nationality?: string;
    documentType?: string;
    documentNumber?: string;
    gender?: string;
  }>;
  items: Array<{
    date: string;
    time?: string;
    serviceType: string;
    description: string;
    flightNumber?: string;
    flightTime?: string;
    airlineLocator?: string;
    pickUp?: string;
    dropOff?: string;
    vehiclePlate?: string;
    vehicleModel?: string;
  }>;
  notes?: string;
  // Extra fields for the escala-style layout
  driverName?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  companyName?: string;
  companyPhone?: string;
}

export const ServiceOrderTemplate = ({ data, lang = 'pt' }: { data: ServiceOrderPDFData; lang?: Language }) => {
  const i = t(lang);
  const companyName = data.companyName || 'Pratik Turismo / Maia Tours';
  const totalPax = (data.paxCount || 0) + (data.childrenCount || 0);
  const safePassengers = Array.isArray(data.passengers) ? data.passengers : [];
  const safeItems = Array.isArray(data.items) ? data.items : [];

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
            <Text style={styles.statusBadge}>{data.status?.toUpperCase() || 'CONFIRMADA'}</Text>
            <Text style={{ fontSize: 8, color: '#666', marginTop: 4 }}>O.S. {data.osNumber}</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>{i.serviceOrder}</Text>
        </View>

        {/* Date / Driver / Vehicle row */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{i.date}:</Text>
            <Text style={styles.infoValue}>{data.dateIn}</Text>
          </View>
          {data.driverName && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{i.driver}:</Text>
              <Text style={styles.infoValue}>{data.driverName}</Text>
            </View>
          )}
          {(data.vehiclePlate || safeItems[0]?.vehiclePlate) && (
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>
                {data.vehiclePlate || safeItems[0]?.vehiclePlate || ''}
                {(data.vehicleModel || safeItems[0]?.vehicleModel) ? ` - ${data.vehicleModel || safeItems[0]?.vehicleModel}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Schedule bar */}
        <View style={styles.scheduleBar}>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleLabel}>{i.schedule}:</Text>
            <Text style={styles.scheduleBold}>{data.osNumber || ''}</Text>
          </View>
          {safeItems[0]?.description && (
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleBold}>{safeItems[0]?.description}</Text>
            </View>
          )}
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleLabel}>{i.totalPax}:</Text>
            <Text style={styles.scheduleBold}>{String(totalPax)}</Text>
          </View>
          {data.guideName && (
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>{i.guide}:</Text>
              <Text style={styles.scheduleBold}>{data.guideName}</Text>
            </View>
          )}
        </View>

        {/* General Info Box */}
        <View style={styles.box}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>{i.mainPassenger}</Text>
              <Text style={styles.value}>{data.leadPassengerName}</Text>
            </View>
            {data.agencyName && (
              <View style={styles.col}>
                <Text style={styles.label}>{i.client}</Text>
                <Text style={styles.value}>{data.agencyName}</Text>
              </View>
            )}
            {data.referenceCode && (
              <View style={styles.col}>
                <Text style={styles.label}>{i.referenceCode}</Text>
                <Text style={styles.value}>{data.referenceCode}</Text>
              </View>
            )}
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
            <View style={styles.col}>
              <Text style={styles.label}>{i.adults} / {i.children}</Text>
              <Text style={styles.value}>{String(data.paxCount || 0)} ADT / {String(data.childrenCount || 0)} CHD</Text>
            </View>
            {data.hotelName && (
              <View style={styles.col}>
                <Text style={styles.label}>{i.hotel}</Text>
                <Text style={styles.value}>{data.hotelName}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Guide info */}
        {(data.guideName || data.guidePhone) && (
          <>
            <Text style={styles.sectionTitle}>{i.responsibleGuide}</Text>
            <View style={styles.box}>
              <View style={styles.row}>
                {data.guideName && (
                  <View style={styles.col}>
                    <Text style={styles.label}>{i.guideName}</Text>
                    <Text style={styles.value}>{data.guideName}</Text>
                  </View>
                )}
                {data.guidePhone && (
                  <View style={styles.col}>
                    <Text style={styles.label}>{i.phone}</Text>
                    <Text style={styles.value}>{data.guidePhone}</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {/* Passengers Table */}
        <Text style={styles.sectionTitle}>{i.passengers}</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCellHeader, { width: 25 }]}>Nº</Text>
          <Text style={[styles.tableCellHeader, { width: 140 }]}>{i.passengerName}</Text>
          <Text style={[styles.tableCellHeader, { width: 70 }]}>{i.nationality}</Text>
          <Text style={[styles.tableCellHeader, { width: 55 }]}>{i.docType}</Text>
          <Text style={[styles.tableCellHeader, { width: 85 }]}>{i.docNumber}</Text>
          <Text style={[styles.tableCellHeader, { width: 65 }]}>{i.birthdate}</Text>
          <Text style={[styles.tableCellHeader, { width: 35 }]}>{i.gender}</Text>
        </View>
        {safePassengers.map((pax, idx) => (
          <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { width: 25, textAlign: 'center' }]}>{String(idx + 1)}</Text>
            <Text style={[styles.tableCellBold, { width: 140 }]}>{pax.name}</Text>
            <Text style={[styles.tableCell, { width: 70 }]}>{pax.nationality || '-'}</Text>
            <Text style={[styles.tableCell, { width: 55 }]}>{pax.documentType || '-'}</Text>
            <Text style={[styles.tableCell, { width: 85 }]}>{pax.documentNumber || '-'}</Text>
            <Text style={[styles.tableCell, { width: 65 }]}>{pax.birthdate || '-'}</Text>
            <Text style={[styles.tableCell, { width: 35, textAlign: 'center' }]}>{pax.gender || '-'}</Text>
          </View>
        ))}

        {/* Itinerary */}
        <Text style={styles.sectionTitle}>{i.itinerary}</Text>
        {safeItems.map((item, idx) => (
          <View key={idx} style={[styles.box, { marginBottom: 3 }]}>
            <View style={styles.row}>
              <View style={{ width: 65 }}>
                <Text style={styles.label}>{i.date}</Text>
                <Text style={styles.value}>{item.date}</Text>
              </View>
              {item.time && (
                <View style={{ width: 50 }}>
                  <Text style={styles.label}>{i.time}</Text>
                  <Text style={styles.value}>{item.time}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{item.serviceType}</Text>
                <Text style={styles.value}>{item.description}</Text>
              </View>
            </View>
            {(item.flightNumber || item.pickUp || item.vehiclePlate) && (
              <View style={[styles.row, { marginTop: 3 }]}>
                {item.flightNumber && (
                  <View style={{ width: 80 }}>
                    <Text style={styles.label}>{i.flight}</Text>
                    <Text style={styles.tableCell}>
                      {item.flightNumber}{item.flightTime ? ` (${item.flightTime})` : ''}
                    </Text>
                  </View>
                )}
                {item.airlineLocator && (
                  <View style={{ width: 80 }}>
                    <Text style={styles.label}>{i.locator}</Text>
                    <Text style={styles.tableCell}>{item.airlineLocator}</Text>
                  </View>
                )}
                {item.pickUp && (
                  <View style={{ width: 95 }}>
                    <Text style={styles.label}>{i.pickUp}</Text>
                    <Text style={styles.tableCell}>{item.pickUp}</Text>
                  </View>
                )}
                {item.dropOff && (
                  <View style={{ width: 95 }}>
                    <Text style={styles.label}>{i.dropOff}</Text>
                    <Text style={styles.tableCell}>{item.dropOff}</Text>
                  </View>
                )}
                {item.vehiclePlate && (
                  <View style={{ width: 80 }}>
                    <Text style={styles.label}>{i.vehicle}</Text>
                    <Text style={styles.tableCell}>
                      {item.vehiclePlate}{item.vehicleModel ? ` - ${item.vehicleModel}` : ''}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ))}

        {/* Notes */}
        {data.notes && (
          <>
            <Text style={styles.sectionTitle}>{i.observations}</Text>
            <Text style={styles.notes}>{data.notes}</Text>
          </>
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
