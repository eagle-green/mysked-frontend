import type { IInvoice } from 'src/types/invoice';

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fDateTime } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

import { InvoicePdfDocument } from './invoice-pdf';

// ----------------------------------------------------------------------

type Props = {
  row: IInvoice;
  selected: boolean;
  editHref: string;
  detailsHref: string;
  onSelectRow: () => void;
  onDeleteRow: () => void;
  isDeleting?: boolean;
};

export function InvoiceTableRow({
  row,
  selected,
  editHref,
  onSelectRow,
  onDeleteRow,
  detailsHref,
  isDeleting = false,
}: Props) {
  const router = useRouter();
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (isExporting) {
      return;
    }

    try {
      setIsExporting(true);
      menuActions.onClose();

      // Fetch timesheets for this invoice
      let timesheets: any[] = [];
      try {
        const response = await fetcher(endpoints.invoice.timesheets(row.id));
        if (response.success && response.data) {
          timesheets = response.data;
        }
      } catch (error) {
        console.error('Error fetching timesheets:', error);
        // Continue with invoice only if timesheet fetch fails
      }

      const blob = await pdf(
        <InvoicePdfDocument 
          invoice={row} 
          currentStatus={row.status} 
          timesheets={timesheets}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with invoice number format: invoice-1234
      const filename = row.invoiceNumber 
        ? `invoice-${row.invoiceNumber}.pdf`
        : `invoice-${row.displayId || row.id}.pdf`;

      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Cleanup after downloading the file
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('Invoice exported successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <li>
          <MenuItem component={RouterLink} href={editHref} onClick={menuActions.onClose}>
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>
        </li>

        <li>
          <MenuItem
            onClick={handleExportPDF}
            disabled={isExporting}
            sx={{
              color: isExporting ? 'text.disabled' : 'inherit',
              opacity: isExporting ? 0.5 : 1,
            }}
          >
            {isExporting ? (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ) : (
              <Iconify icon="solar:download-bold" />
            )}
            {isExporting ? 'Exporting...' : 'Export'}
          </MenuItem>
        </li>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuItem
          onClick={() => {
            if (isDeleting) {
              toast.info('Deletion already in progress...');
              menuActions.onClose();
              return;
            }
            confirmDialog.onTrue();
            menuActions.onClose();
          }}
          sx={{ 
            color: isDeleting ? 'text.disabled' : 'error.main',
            opacity: isDeleting ? 0.5 : 1,
          }}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <CircularProgress size={16} sx={{ mr: 1 }} />
          ) : (
            <Iconify icon="solar:trash-bin-trash-bold" />
          )}
          {isDeleting ? 'Deleting...' : 'Delete'}
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={isDeleting ? () => {} : confirmDialog.onFalse}
      title="Delete Invoice"
      disableCancel={isDeleting}
      content={
        <>
          Are you sure you want to delete this invoice?
          <br />
          <br />
          <strong>Warning:</strong> This will permanently delete:
          <br />
          • The invoice from the system
          <br />
          • All associated invoice items
          <br />
          • The associated QuickBooks invoice (if it exists)
          <br />
          <br />
          This action cannot be undone.
        </>
      }
      action={
        <Button
          variant="contained"
          color="error"
          disabled={isDeleting}
          onClick={async () => {
            await onDeleteRow();
            confirmDialog.onFalse();
          }}
          startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isDeleting ? 'Processing...' : 'Delete Invoice'}
        </Button>
      }
    />
  );

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Button
            variant="text"
            color="primary"
            onClick={() => router.push(editHref)}
            sx={{
              p: 0,
              minWidth: 'auto',
              textTransform: 'none',
              fontWeight: 800,
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {row.displayId || 'N/A'}
          </Button>
        </TableCell>

        <TableCell>
          <ListItemText
            primary={fDate(row.createDate)}
            slotProps={{
              primary: {
                noWrap: true,
                sx: { typography: 'body2' },
              },
            }}
          />
        </TableCell>

        <TableCell>
          {row.qbo_doc_number || row.qbo_invoice_id ? (
            <Button
              component="a"
              href={`https://app.qbo.intuit.com/app/invoice?txnId=${row.qbo_invoice_id}`}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              variant="outlined"
              color="primary"
            >
              {row.qbo_doc_number || row.qbo_invoice_id}
            </Button>
          ) : null}
        </TableCell>

        <TableCell>
          <ListItemText
            primary={row.invoiceTo?.name || 'N/A'}
            // secondary={row.invoiceTo?.company}
            slotProps={{
              primary: { noWrap: true, sx: { typography: 'body2' } },
              secondary: { sx: { mt: 0.5, typography: 'caption', color: 'text.disabled' } },
            }}
          />
        </TableCell>

        <TableCell>{row.poNumber || null}</TableCell>

        <TableCell>{row.networkNumber || null}</TableCell>

        <TableCell>{row.approver || null}</TableCell>

        <TableCell>{row.store || null}</TableCell>

        <TableCell>{fCurrency(row.totalAmount)}</TableCell>

        <TableCell>
          {row.created_by && (
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  src={row.created_by.photo_url ?? undefined}
                  alt={`${row.created_by.first_name} ${row.created_by.last_name}`}
                  sx={{ width: 32, height: 32 }}
                >
                  {row.created_by.first_name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Typography variant="body2" noWrap>
                  {`${row.created_by.first_name} ${row.created_by.last_name}`}
                </Typography>
              </Stack>
              {row.createdAt && (
                <Typography variant="caption" color="text.secondary">
                  {fDateTime(row.createdAt)}
                </Typography>
              )}
            </Stack>
          )}
        </TableCell>

        <TableCell>
          {row.updated_by && (
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  src={row.updated_by.photo_url ?? undefined}
                  alt={`${row.updated_by.first_name} ${row.updated_by.last_name}`}
                  sx={{ width: 32, height: 32 }}
                >
                  {row.updated_by.first_name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Typography variant="body2" noWrap>
                  {`${row.updated_by.first_name} ${row.updated_by.last_name}`}
                </Typography>
              </Stack>
              {row.updatedAt && (
                <Typography variant="caption" color="text.secondary">
                  {fDateTime(row.updatedAt)}
                </Typography>
              )}
            </Stack>
          )}
        </TableCell>

        <TableCell align="right" sx={{ px: 1 }}>
          <IconButton color={menuActions.open ? 'inherit' : 'default'} onClick={menuActions.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}

