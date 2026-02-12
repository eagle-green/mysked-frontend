import { Page, Text, View, Image, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 10,
    color: '#555',
    marginBottom: 12,
  },
  contentBlock: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 10,
    borderRadius: 2,
  },
  contentLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  contentText: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  contentImage: {
    maxWidth: 480,
    maxHeight: 320,
    objectFit: 'contain',
    marginVertical: 6,
  },
  section: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 100,
    fontFamily: 'Helvetica-Bold',
  },
  value: {
    flex: 1,
  },
  signatureBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    width: 200,
  },
  signatureImage: {
    width: 180,
    height: 60,
    objectFit: 'contain',
  },
});

function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

type ContentSegment = { type: 'text'; value: string } | { type: 'image'; src: string };

/** Parse HTML content into text and image segments in order, for PDF rendering. */
function parseContentToSegments(html: string): ContentSegment[] {
  if (!html || typeof html !== 'string') return [{ type: 'text', value: '' }];
  const segments: ContentSegment[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = imgRegex.exec(html)) !== null) {
    const textBefore = html.slice(lastIndex, m.index);
    const plainBefore = stripHtml(textBefore);
    if (plainBefore.length > 0) {
      segments.push({ type: 'text', value: plainBefore });
    }
    const src = m[1].trim();
    if (src && (src.startsWith('http') || src.startsWith('data:'))) {
      segments.push({ type: 'image', src });
    }
    lastIndex = m.index + m[0].length;
  }
  const textAfter = html.slice(lastIndex);
  const plainAfter = stripHtml(textAfter);
  if (plainAfter.length > 0 || segments.length === 0) {
    segments.push({ type: 'text', value: plainAfter || (segments.length === 0 ? '' : '') });
  }
  return segments.length > 0 ? segments : [{ type: 'text', value: '' }];
}

/** Only show description when it has real content (not empty or placeholder). */
function hasDescription(description: string | null | undefined): boolean {
  const t = description?.trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  if (lower === 'sub title optional' || lower === 'sub title (optional)') return false;
  return true;
}

function formatCreatedAt(createdAt: string | null | undefined): string {
  if (!createdAt) return '—';
  const d = new Date(createdAt);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export type AnnouncementRecipientPdfProps = {
  title: string;
  description: string;
  content: string;
  createdAt?: string | null;
  recipientName: string;
  recipientEmail?: string | null;
  readAt?: string | null;
  requiresSignature?: boolean;
  signedAt: string | null;
  signatureDataUrl: string | null;
};

function formatReadAtOrSignedAt(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function AnnouncementRecipientPdf({
  title,
  description,
  content,
  createdAt,
  recipientName,
  recipientEmail,
  readAt,
  requiresSignature = false,
  signedAt,
  signatureDataUrl,
}: AnnouncementRecipientPdfProps) {
  const contentSegments = parseContentToSegments(content);
  const hasContent = contentSegments.some((s) => s.type === 'text' && s.value.length > 0) || contentSegments.some((s) => s.type === 'image');
  const signedAtText = requiresSignature
    ? (signedAt ? formatReadAtOrSignedAt(signedAt) : '—')
    : 'Signature is not required';
  const readAtText = formatReadAtOrSignedAt(readAt);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        {hasDescription(description) ? <Text style={styles.description}>{description}</Text> : null}
        <Text style={{ fontSize: 9, color: '#666', marginBottom: 12 }}>Created {formatCreatedAt(createdAt)}</Text>
        <View style={styles.contentBlock}>
          <Text style={styles.contentLabel}>Content</Text>
          {contentSegments.map((seg, index) =>
            seg.type === 'text' ? (
              seg.value ? (
                <Text key={index} style={styles.contentText}>{seg.value}</Text>
              ) : null
            ) : (
              <Image key={index} src={seg.src} style={styles.contentImage} />
            )
          )}
          {!hasContent ? <Text style={styles.contentText}>No content.</Text> : null}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Recipient acknowledgment</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{recipientName}</Text>
          </View>
          {recipientEmail ? (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{recipientEmail}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Opened at:</Text>
            <Text style={styles.value}>{readAtText}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Signed at:</Text>
            <Text style={styles.value}>{signedAtText}</Text>
          </View>
          {requiresSignature &&
            (signatureDataUrl ? (
              <View style={styles.signatureBox}>
                <Text style={{ fontSize: 8, marginBottom: 4 }}>Signature</Text>
                <Image src={signatureDataUrl} style={styles.signatureImage} />
              </View>
            ) : (
              <Text style={{ fontSize: 9, color: '#999', marginTop: 4 }}>No signature on file.</Text>
            ))}
        </View>
      </Page>
    </Document>
  );
}
