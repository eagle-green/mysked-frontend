import type { IInvoice } from 'src/types/invoice';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Page,
  Text,
  View,
  Font,
  Image,
  Document,
  PDFViewer,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer';

import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { fCurrency } from 'src/utils/format-number';
import { fDate, formatPatterns } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';
import { TimesheetPage, TimesheetImagePage } from 'src/pages/template/timesheet-pdf';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type InvoicePDFProps = {
  invoice?: IInvoice;
  currentStatus: string;
};

export function InvoicePDFDownload({ invoice, currentStatus }: InvoicePDFProps) {
  // Fetch timesheets for this invoice
  const { data: timesheetsResponse, isLoading: isLoadingTimesheets } = useQuery({
    queryKey: ['invoice-timesheets', invoice?.id],
    queryFn: async () => {
      if (!invoice?.id) return { success: true, data: [] };
      try {
        const response = await fetcher(endpoints.invoice.timesheets(invoice.id));
        return response;
      } catch (error) {
        console.error('Error fetching timesheets:', error);
        return { success: true, data: [] };
      }
    },
    enabled: !!invoice?.id,
    staleTime: 30 * 1000,
  });

  const timesheets = timesheetsResponse?.success && timesheetsResponse?.data 
    ? timesheetsResponse.data 
    : [];

  const renderButton = (loading: boolean) => (
    <Tooltip title="Download">
      <IconButton disabled={loading || isLoadingTimesheets}>
        {loading || isLoadingTimesheets ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          <Iconify icon="eva:cloud-download-fill" />
        )}
      </IconButton>
    </Tooltip>
  );

  return (
    <PDFDownloadLink
      document={
        <InvoicePdfDocument 
          invoice={invoice} 
          currentStatus={currentStatus} 
          timesheets={timesheets}
        />
      }
      fileName={invoice?.invoiceNumber}
      style={{ textDecoration: 'none' }}
    >
      {({ loading }) => renderButton(loading)}
    </PDFDownloadLink>
  );
}

// ----------------------------------------------------------------------

export function InvoicePDFViewer({ invoice, currentStatus }: InvoicePDFProps) {
  // Fetch timesheets for this invoice
  const { data: timesheetsResponse } = useQuery({
    queryKey: ['invoice-timesheets', invoice?.id],
    queryFn: async () => {
      if (!invoice?.id) return { success: true, data: [] };
      try {
        const response = await fetcher(endpoints.invoice.timesheets(invoice.id));
        return response;
      } catch (error) {
        console.error('Error fetching timesheets:', error);
        return { success: true, data: [] };
      }
    },
    enabled: !!invoice?.id,
    staleTime: 30 * 1000,
  });

  const timesheets = timesheetsResponse?.success && timesheetsResponse?.data 
    ? timesheetsResponse.data 
    : [];

  return (
    <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
      <InvoicePdfDocument 
        invoice={invoice} 
        currentStatus={currentStatus} 
        timesheets={timesheets}
      />
    </PDFViewer>
  );
}

// ----------------------------------------------------------------------

Font.register({
  family: 'Roboto',
  // fonts from public folder
  fonts: [{ src: '/fonts/Roboto-Regular.ttf' }, { src: '/fonts/Roboto-Bold.ttf' }],
});

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        // layout
        page: {
          fontSize: 9,
          lineHeight: 1.6,
          fontFamily: 'Roboto',
          backgroundColor: '#FFFFFF',
          padding: '40px 24px 120px 24px',
        },
        footer: {
          left: 0,
          right: 0,
          bottom: 0,
          padding: 24,
          margin: 'auto',
          borderTopWidth: 1,
          borderStyle: 'solid',
          position: 'absolute',
          borderColor: '#e9ecef',
        },
        container: { flexDirection: 'row', justifyContent: 'space-between' },
        // margin
        mb4: { marginBottom: 4 },
        mb8: { marginBottom: 8 },
        mb40: { marginBottom: 40 },
        // text
        h3: { fontSize: 16, fontWeight: 700, lineHeight: 1.2 },
        h4: { fontSize: 12, fontWeight: 700 },
        text1: { fontSize: 10 },
        text2: { fontSize: 9 },
        text1Bold: { fontSize: 10, fontWeight: 700 },
        text2Bold: { fontSize: 9, fontWeight: 700 },
        // table
        table: { display: 'flex', width: '100%' },
        row: {
          padding: '10px 0 8px 0',
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderStyle: 'solid',
          borderColor: '#e9ecef',
        },
        cell_1: { width: '15%' },
        cell_2: { width: '40%' },
        cell_3: { width: '12%', paddingLeft: 16 },
        cell_4: { width: '15%', paddingLeft: 8 },
        cell_5: { width: '18%' },
        noBorder: { paddingTop: '10px', paddingBottom: 0, borderBottomWidth: 0 },
      }),
    []
  );

type InvoicePdfDocumentProps = {
  invoice?: IInvoice;
  currentStatus: string;
  timesheets?: any[]; // Timesheet data to append after invoice
};

export function InvoicePdfDocument({ invoice, currentStatus, timesheets }: InvoicePdfDocumentProps) {
  const {
    items,
    taxes,
    dueDate,
    discount,
    shipping,
    subtotal,
    invoiceTo,
    createDate,
    totalAmount,
    invoiceFrom,
    invoiceNumber,
    poNumber,
    networkNumber,
    approver,
    terms,
  } = invoice ?? {};

  const styles = useStyles();

  // Calculate taxes from items if not provided or if it's 0
  // Group by tax code to show breakdown in tax summary
  const taxBreakdown = useMemo(() => {
    if (!items || items.length === 0) return [];
    
    const taxMap = new Map<string, { name: string; rate: number; taxAmount: number; netAmount: number }>();
    
    items.forEach((item) => {
      const itemSubtotal = (item.price || 0) * (item.quantity || 0);
      // Use actual tax rate from item, default to 5% GST if not available
      const taxRate = item.taxRate !== undefined ? item.taxRate : 5;
      const taxName = item.taxName || `GST @ ${taxRate}%`;
      const itemTax = itemSubtotal * (taxRate / 100);
      
      // Use tax name as key to group items with same tax
      const taxKey = taxName;
      
      if (taxMap.has(taxKey)) {
        const existing = taxMap.get(taxKey)!;
        existing.taxAmount += itemTax;
        existing.netAmount += itemSubtotal;
      } else {
        taxMap.set(taxKey, {
          name: taxName,
          rate: taxRate,
          taxAmount: itemTax,
          netAmount: itemSubtotal,
        });
      }
    });
    
    return Array.from(taxMap.values());
  }, [items]);

  const calculatedTaxes = useMemo(() => taxBreakdown.reduce((sum, tax) => sum + tax.taxAmount, 0), [taxBreakdown]);

  const displayTaxes = taxes && taxes > 0 ? taxes : calculatedTaxes;

  // Split address into two lines: street address and city/region
  const splitAddress = (fullAddress: string | undefined): [string | undefined, string | undefined] => {
    if (!fullAddress) return [undefined, undefined];
    
    const parts = fullAddress.split(',').map(p => p.trim()).filter(p => p.length > 0);
    
    // If we have at least 4 parts, assume last 4 are: city, state, postal, country
    // Everything before that is street address
    if (parts.length >= 4) {
      const streetParts = parts.slice(0, parts.length - 4);
      const cityRegionParts = parts.slice(parts.length - 4);
      return [streetParts.join(' '), cityRegionParts.join(', ')];
    }
    
    // If fewer parts, try to split at a reasonable point (typically after postal code pattern)
    // For now, if it's short enough, keep as one line
    if (parts.length <= 2) {
      return [fullAddress, undefined];
    }
    
    // Default: first 1-2 parts as street, rest as city/region
    const streetParts = parts.slice(0, Math.max(1, Math.floor(parts.length / 2)));
    const cityRegionParts = parts.slice(streetParts.length);
    return [streetParts.join(' '), cityRegionParts.join(', ')];
  };

  const [streetAddress, cityRegion] = splitAddress(invoiceTo?.fullAddress);

  const renderHeader = () => (
    <View style={[styles.container, styles.mb40]}>
      <Image src="/logo/eaglegreen-full.jpeg" style={{ width: '100px', height: '100px' }} />

      <View style={{ alignItems: 'flex-end', flexDirection: 'column' }}>
        <Text style={[styles.h3]}>
          Invoice {invoiceNumber || 'N/A'}
        </Text>
      </View>
    </View>
  );


  const renderBillingInfo = () => (
    <View style={[styles.container, styles.mb40]}>
      <View style={{ width: '50%' }}>
        <Text style={[styles.text1Bold, styles.mb4]}>Invoice from</Text>
        <Text style={[styles.text2]}>{invoiceFrom?.name}</Text>
        <Text style={[styles.text2]}>{invoiceFrom?.fullAddress}</Text>
        <Text style={[styles.text2]}>{invoiceFrom?.phoneNumber}</Text>
        <Text style={[styles.text2]}>www.eaglegreen.ca</Text>
        <Text style={[styles.text2]}>GST/HST Registration No: 784223463</Text>
        <Text style={[styles.text2]}>Business Number: 78422 3463 RT0001</Text>
      </View>

      <View style={{ width: '50%' }}>
        <Text style={[styles.text1Bold, styles.mb4]}>Invoice to</Text>
        <Text style={[styles.text2]}>{invoiceTo?.name}</Text>
        {streetAddress && (
          <Text style={[styles.text2]}>{streetAddress}</Text>
        )}
        {cityRegion && (
          <Text style={[styles.text2]}>{cityRegion}</Text>
        )}
        {!invoiceTo?.fullAddress && invoiceTo?.company && (
          <Text style={[styles.text2]}>{invoiceTo.company}</Text>
        )}
      </View>
    </View>
  );

  const renderDates = () => {
    const hasOptionalFields = poNumber || networkNumber || approver;
    
    return (
      <View style={styles.mb40}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ width: '33.33%' }}>
            <Text style={[styles.text1Bold, styles.mb4]}>Date</Text>
            <Text style={[styles.text2]}>{fDate(createDate, 'MMM DD YYYY')}</Text>
          </View>
          <View style={{ width: '33.33%' }}>
            <Text style={[styles.text1Bold, styles.mb4]}>Due date</Text>
            <Text style={[styles.text2]}>{fDate(dueDate, 'MMM DD YYYY')}</Text>
          </View>
          <View style={{ width: '33.33%' }}>
            <Text style={[styles.text1Bold, styles.mb4]}>Terms</Text>
            <Text style={[styles.text2]}>{terms || '-'}</Text>
          </View>
        </View>
        {hasOptionalFields && (
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            {/* First column: Purchase Order, or Network Number/FSA if no PO, or Approver if no PO and no Network */}
            <View style={{ width: '33.33%' }}>
              {poNumber ? (
                <>
                  <Text style={[styles.text1Bold, styles.mb4]}>Purchase Order</Text>
                  <Text style={[styles.text2]}>{poNumber}</Text>
                </>
              ) : networkNumber ? (
                <>
                  <Text style={[styles.text1Bold, styles.mb4]}>Network Number/FSA</Text>
                  <Text style={[styles.text2]}>{networkNumber}</Text>
                </>
              ) : approver ? (
                <>
                  <Text style={[styles.text1Bold, styles.mb4]}>Approver</Text>
                  <Text style={[styles.text2]}>{approver}</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.text1Bold, styles.mb4]} />
                  <Text style={[styles.text2]} />
                </>
              )}
            </View>
            {/* Second column: Network Number/FSA if PO exists, or Approver if PO exists but no Network */}
            <View style={{ width: '33.33%' }}>
              {poNumber && networkNumber ? (
                <>
                  <Text style={[styles.text1Bold, styles.mb4]}>Network Number/FSA</Text>
                  <Text style={[styles.text2]}>{networkNumber}</Text>
                </>
              ) : poNumber && approver ? (
                <>
                  <Text style={[styles.text1Bold, styles.mb4]}>Approver</Text>
                  <Text style={[styles.text2]}>{approver}</Text>
                </>
              ) : !poNumber && approver ? (
                <>
                  <Text style={[styles.text1Bold, styles.mb4]}>Approver</Text>
                  <Text style={[styles.text2]}>{approver}</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.text1Bold, styles.mb4]} />
                  <Text style={[styles.text2]} />
                </>
              )}
            </View>
            {/* Third column: Approver only if both PO and Network exist */}
            <View style={{ width: '33.33%' }}>
              {poNumber && networkNumber && approver ? (
                <>
                  <Text style={[styles.text1Bold, styles.mb4]}>Approver</Text>
                  <Text style={[styles.text2]}>{approver}</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.text1Bold, styles.mb4]} />
                  <Text style={[styles.text2]} />
                </>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderTable = () => (
    <>
      <Text style={[styles.text1Bold]}>Invoice details</Text>

      <View style={styles.table}>
        <View>
          <View style={styles.row}>
            <View style={styles.cell_1}>
              <Text style={[styles.text2Bold]}>Service Date</Text>
            </View>
            <View style={styles.cell_2}>
              <Text style={[styles.text2Bold]}>Description</Text>
            </View>
            <View style={styles.cell_3}>
              <Text style={[styles.text2Bold]}>Qty</Text>
            </View>
            <View style={styles.cell_4}>
              <Text style={[styles.text2Bold]}>Rate</Text>
            </View>
            <View style={[styles.cell_5, { textAlign: 'right' }]}>
              <Text style={[styles.text2Bold]}>Total</Text>
            </View>
          </View>
        </View>

        <View>
          {items?.map((item) => {
            // Format service date directly to avoid timezone issues in PDF rendering
            let formattedServiceDate = '-';
            if (item.serviceDate) {
              const dateStr = typeof item.serviceDate === 'string' ? item.serviceDate : String(item.serviceDate);
              
              // Debug: Log the raw date value
              console.log('PDF Service Date - Raw:', item.serviceDate, 'Type:', typeof item.serviceDate, 'String:', dateStr);
              
              // If it's a YYYY-MM-DD format, parse it directly
              if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
                const [year, month, day] = dateStr.split('-').map(Number);
                formattedServiceDate = `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
                console.log('PDF Service Date - Formatted:', formattedServiceDate);
              } else {
                formattedServiceDate = fDate(item.serviceDate, formatPatterns.split.date);
                console.log('PDF Service Date - fDate:', formattedServiceDate);
              }
            }
            
            return (
            <View key={item.id} style={styles.row}>
              <View style={styles.cell_1}>
                <Text style={[styles.text2]}>
                  {formattedServiceDate}
                </Text>
              </View>
              <View style={styles.cell_2}>
                <Text style={[styles.text2Bold]}>{item.title}</Text>
                <Text style={[styles.text2]}>{item.description}</Text>
              </View>
              <View style={styles.cell_3}>
                <Text style={[styles.text2]}>{item.quantity}</Text>
              </View>
              <View style={styles.cell_4}>
                <Text style={[styles.text2]}>{fCurrency(item.price)}</Text>
              </View>
              <View style={[styles.cell_5, { textAlign: 'right' }]}>
                <Text style={[styles.text2]}>{fCurrency(item.price * item.quantity)}</Text>
              </View>
            </View>
          );
          })}

          {[
            { name: 'Subtotal', value: subtotal },
            ...(shipping && shipping > 0 ? [{ name: 'Shipping', value: -shipping }] : []),
            ...(discount && discount > 0 ? [{ name: 'Discount', value: -discount }] : []),
            { name: 'Taxes', value: displayTaxes },
            { name: 'Total', value: totalAmount, styles: styles.h4 },
          ].map((item) => (
            <View key={item.name} style={[styles.row, styles.noBorder]}>
              <View style={styles.cell_1} />
              <View style={styles.cell_2} />
              <View style={styles.cell_3} />
              <View style={styles.cell_4}>
                <Text style={[item.styles ?? styles.text2]}>{item.name}</Text>
              </View>
              <View style={[styles.cell_5, { textAlign: 'right' }]}>
                <Text style={[item.styles ?? styles.text2]}>{fCurrency(item.value ?? 0)}</Text>
              </View>
            </View>
          ))}

          {/* Tax Summary Section */}
          <View style={[styles.row, { marginTop: 20, paddingTop: 10, borderTopWidth: 0 }]}>
            <View style={styles.cell_1} />
            <View style={styles.cell_2}>
              <Text style={[styles.text1Bold]}>Tax Summary</Text>
            </View>
            <View style={styles.cell_3} />
            <View style={styles.cell_4} />
            <View style={styles.cell_5} />
          </View>
          <View style={[styles.row]}>
            <View style={styles.cell_1} />
            <View style={{ width: '52%' }}>
              <Text style={[styles.text2Bold]}>Rate</Text>
            </View>
            <View style={styles.cell_4}>
              <Text style={[styles.text2Bold]}>Tax</Text>
            </View>
            <View style={[styles.cell_5, { textAlign: 'right' }]}>
              <Text style={[styles.text2Bold]}>Net</Text>
            </View>
          </View>
          {taxBreakdown.map((tax, index) => (
            <View key={index} style={[styles.row, styles.noBorder]}>
              <View style={styles.cell_1} />
              <View style={{ width: '52%' }}>
                <Text style={[styles.text2]}>{tax.name} ({tax.rate}%)</Text>
              </View>
              <View style={styles.cell_4}>
                <Text style={[styles.text2]}>{fCurrency(tax.taxAmount)}</Text>
              </View>
              <View style={[styles.cell_5, { textAlign: 'right' }]}>
                <Text style={[styles.text2]}>{fCurrency(tax.netAmount)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {renderHeader()}
        {renderBillingInfo()}
        {renderDates()}
        {renderTable()}
        <View style={[styles.container, styles.footer]} fixed>
          <View style={{ width: '75%' }}>
            <Text style={[styles.text2Bold, styles.mb4]}>NOTES</Text>
            <Text style={[styles.text2]}>
              Thank you for choosing Eagle Green Traffic Control. Your safety is our priority.
            </Text>
          </View>
          <View style={{ width: '25%', textAlign: 'right' }}>
            <Text style={[styles.text2Bold, styles.mb4]}>Have a question?</Text>
            <Text style={[styles.text2]}>accounting@eaglegreen.ca</Text>
          </View>
        </View>
      </Page>
      
      {/* Render timesheet pages if provided - sorted by date (oldest first) */}
      {timesheets && timesheets.length > 0 && (() => {
        // Sort timesheets by date (oldest first)
        // Use timesheet_date if available, otherwise fall back to job.start_time
        const sortedTimesheets = [...timesheets].sort((a, b) => {
          const getDate = (ts: any): string | null => {
            // Try timesheet_date first (from timesheet object)
            const timesheetDate = ts.timesheet?.timesheet_date || ts.timesheet_date;
            if (timesheetDate) {
              // Extract date part if it's a datetime string
              return typeof timesheetDate === 'string' 
                ? timesheetDate.split('T')[0] 
                : String(timesheetDate).split('T')[0];
            }
            
            // Fall back to job.start_time
            const jobStartTime = ts.job?.start_time || ts.job_start_time;
            if (jobStartTime) {
              // Extract date part if it's a datetime string
              return typeof jobStartTime === 'string' 
                ? jobStartTime.split('T')[0] 
                : String(jobStartTime).split('T')[0];
            }
            
            return null;
          };
          
          const dateA = getDate(a);
          const dateB = getDate(b);
          
          // If both have dates, compare them (ascending = oldest first)
          if (dateA && dateB) {
            return dateA.localeCompare(dateB);
          }
          
          // If only one has a date, put it first
          if (dateA && !dateB) return -1;
          if (!dateA && dateB) return 1;
          
          // If neither has a date, maintain original order
          return 0;
        });
        
        return sortedTimesheets.map((timesheetData, index) => {
          // Get images array, handle both formats (timesheetData.images or timesheetData.timesheet?.images)
          const images = timesheetData.images || timesheetData.timesheet?.images || [];
          const validImages = Array.isArray(images) ? images.filter((img: string) => img && typeof img === 'string') : [];
          
          return (
            <>
              <TimesheetPage key={`timesheet-${index}`} timesheetData={timesheetData} />
              {/* Add separate page for each timesheet image */}
              {validImages.map((imageUrl: string, imgIndex: number) => (
                <TimesheetImagePage
                  key={`timesheet-${index}-image-${imgIndex}`}
                  imageUrl={imageUrl}
                  timesheetData={timesheetData}
                  imageIndex={imgIndex}
                  totalImages={validImages.length}
                />
              ))}
            </>
          );
        });
      })()}
    </Document>
  );
}


