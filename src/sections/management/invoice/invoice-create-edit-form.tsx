import type { IInvoice } from 'src/types/invoice';
import type { UseFormReturn } from 'react-hook-form';

import * as z from 'zod';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, forwardRef, useImperativeHandle } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { today, fIsAfter } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Form, schemaUtils } from 'src/components/hook-form';

import { InvoiceCreateEditNotes } from './invoice-create-edit-notes';
import { InvoiceCreateEditAddress } from './invoice-create-edit-address';
import { InvoiceCreateEditStatusDate } from './invoice-create-edit-status-date';
import { defaultItem, InvoiceCreateEditDetails } from './invoice-create-edit-details';

// ----------------------------------------------------------------------

export type InvoiceCreateSchemaType = z.infer<typeof InvoiceCreateSchema>;

export const InvoiceCreateSchema = z
  .object({
    invoiceTo: schemaUtils.nullableInput(z.custom<IInvoice['invoiceTo']>(), {
      error: 'Invoice to is required!',
    }),
    createDate: schemaUtils.date({ error: { required: 'Create date is required!' } }),
    dueDate: schemaUtils.date({ error: { required: 'Due date is required!' } }),
    items: z.array(
      z.object({
        title: z.string().min(1, { message: 'Title is required!' }),
        service: z.string().min(1, { message: 'Product/Service is required!' }),
        serviceDate: schemaUtils.date({ error: { required: 'Service Date is required!' } }),
        quantity: z.coerce.number({ required_error: 'Qty is required!', invalid_type_error: 'Qty must be a number' }).positive().min(0.01, { message: 'Qty must be more than 0' }),
        price: z.coerce.number({ required_error: 'Rate is required!', invalid_type_error: 'Rate must be a number' }).min(0, { message: 'Rate must be 0 or greater' }),
        tax: z.union([z.string(), z.number()], { required_error: 'Tax is required!', invalid_type_error: 'Tax must be selected' }).refine((val) => val !== '' && val !== null && val !== undefined, { message: 'Tax is required!' }),
        total: z.number(),
        description: z.string().min(1, { message: 'Description is required!' }),
        // Optional fields for worker info (not required for validation)
        workerName: z.string().optional(),
        position: z.string().optional(),
        shiftTimes: z.string().optional(),
        vehicleType: z.string().optional(),
        breakMinutes: z.number().nullable().optional(),
        travelMinutes: z.number().nullable().optional(),
      })
    ).min(1, { message: 'At least one item is required!' }),
    discount: z.coerce.number().default(0),
    discountType: z.enum(['percent', 'value']).default('percent'),
    subtotal: z.number(),
    totalAmount: z.number(),
    taxes: z.number().optional(),
    poNumber: z.string().optional().nullable(), // Purchase Order number (user input)
    networkNumber: z.string().optional().nullable(),
    terms: z.string().optional().nullable(),
    store: z.preprocess(
      (val) => (val === null || val === undefined ? '' : val),
      z.string().min(1, { message: 'Store is required!' })
    ),
    approver: z.string().optional().nullable(),
    customerMemo: z.string().optional().nullable(), // Message on invoice
    privateNote: z.string().optional().nullable(), // Message on statement
    invoiceFrom: z.custom<IInvoice['invoiceFrom']>().nullable(),
  })
  .refine((val) => !fIsAfter(val.createDate, val.dueDate), {
    message: 'Due date cannot be earlier than create date!',
    path: ['dueDate'],
  });

// ----------------------------------------------------------------------

type Props = {
  currentInvoice?: IInvoice;
  hideActions?: boolean; // Hide save/send buttons when used in generation workflow
  allowCustomerEdit?: boolean; // Allow editing customer in "To" field
  jobDetails?: any[]; // Job details for timesheet dialog
  onOpenTimesheetDialog?: (job: any) => void; // Handler to open timesheet dialog
};

export type InvoiceFormRef = {
  getValues: () => InvoiceCreateSchemaType;
  trigger: () => Promise<boolean>;
  formMethods: UseFormReturn<InvoiceCreateSchemaType>;
};

export const InvoiceCreateEditForm = forwardRef<InvoiceFormRef, Props>(
  ({ currentInvoice, hideActions = false, allowCustomerEdit = true, jobDetails, onOpenTimesheetDialog }, ref) => {
  const router = useRouter();

  const loadingSave = useBoolean();
  const loadingSend = useBoolean();

  const defaultValues: InvoiceCreateSchemaType = {
    poNumber: '',
    createDate: today(),
    dueDate: null,
    discount: 0,
    discountType: 'percent' as const,
    invoiceFrom: {
      id: 'eaglegreen',
      name: 'Eagle Green',
      company: 'Traffic Management',
      fullAddress: '#200-100 Park Royal, West Vancouver BC V7T 1A2',
      phoneNumber: 'accounting@eaglegreen.ca',
    },
    invoiceTo: null,
    subtotal: 0,
    totalAmount: 0,
    taxes: 0,
    customerMemo: '',
    privateNote: '',
    networkNumber: null,
    terms: null,
    store: '',
    approver: null,
    items: [defaultItem as any],
  };

  // Helper function to convert date to YYYY-MM-DD format
  const convertDateToYYYYMMDD = (dateValue: any): string | null => {
    if (!dateValue && dateValue !== 0) return null;
    
    // Handle empty string
    if (dateValue === '') return null;
    
    if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim();
      if (!trimmed) return null;
      
      // If it's already YYYY-MM-DD, validate and return it
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        // Validate that it's a valid date using dayjs
        if (dayjs(trimmed).isValid()) {
          return trimmed;
        }
      }
      // If it's an ISO string, extract date part
      if (trimmed.includes('T')) {
        const datePart = trimmed.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart) && dayjs(datePart).isValid()) {
          return datePart;
        }
      }
      // If it's a date string like "Sun Nov 30 2025 00:00:00 GM", extract date parts
      if (/^[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{4}/.test(trimmed)) {
        const dateMatch = trimmed.match(/^([A-Za-z]{3})\s+([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/);
        if (dateMatch) {
          const [, , monthName, day, year] = dateMatch;
          const monthMap: Record<string, string> = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
            'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          };
          const month = monthMap[monthName] ?? '01';
          const formatted = `${year}-${month}-${String(day).padStart(2, '0')}`;
          // Validate with dayjs before returning
          if (dayjs(formatted).isValid()) {
            return formatted;
          }
        }
      }
      // Try parsing with dayjs directly
      const dayjsDate = dayjs(trimmed);
      if (dayjsDate.isValid()) {
        return dayjsDate.format('YYYY-MM-DD');
      }
      // Fallback: Try parsing as Date and converting to YYYY-MM-DD
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;
        // Validate with dayjs before returning
        if (dayjs(formatted).isValid()) {
          return formatted;
        }
      }
    } else if (dateValue instanceof Date) {
      // Convert Date object to YYYY-MM-DD string
      if (!isNaN(dateValue.getTime())) {
        const year = dateValue.getFullYear();
        const month = String(dateValue.getMonth() + 1).padStart(2, '0');
        const day = String(dateValue.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;
        // Validate with dayjs before returning
        if (dayjs(formatted).isValid()) {
          return formatted;
        }
      }
    } else if (typeof dateValue === 'number') {
      // Handle timestamp
      const dayjsDate = dayjs(dateValue);
      if (dayjsDate.isValid()) {
        return dayjsDate.format('YYYY-MM-DD');
      }
    }
    
    return null;
  };

  // Transform invoice data to ensure dates are in YYYY-MM-DD format
  const transformedInvoice = useMemo(() => {
    if (!currentInvoice) return undefined;
    
    // Transform createDate and dueDate
    const createDate = convertDateToYYYYMMDD(currentInvoice.createDate);
    const dueDate = convertDateToYYYYMMDD(currentInvoice.dueDate);
    
    // Transform items to ensure serviceDate is in YYYY-MM-DD format
    const transformedItems = currentInvoice.items?.map((item: any) => {
      const serviceDate = convertDateToYYYYMMDD(item.serviceDate);
      
      return {
        ...item,
        serviceDate,
      };
    });
    
    return {
      ...currentInvoice,
      createDate,
      dueDate,
      items: transformedItems,
    };
  }, [currentInvoice]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(InvoiceCreateSchema),
    defaultValues,
    values: transformedInvoice as any,
  });

  const {
    handleSubmit,
    getValues,
    trigger,
    formState: { isSubmitting },
  } = methods;

  // Expose form methods via ref
  useImperativeHandle(ref, () => ({
    getValues,
    trigger,
    formMethods: methods,
  }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleSaveAsDraft = handleSubmit(async (data) => {
    loadingSave.onTrue();

    try {
      if (currentInvoice?.id) {
        // Update existing invoice
        await fetcher([endpoints.invoice.update(currentInvoice.id), {
          method: 'put',
          data,
        }]);
      } else {
        // Create new invoice
        await fetcher([endpoints.invoice.create, {
          method: 'post',
          data,
        }]);
      }
      loadingSave.onFalse();
      router.push(paths.management.invoice.list);
    } catch (error) {
      console.error(error);
      loadingSave.onFalse();
    }
  });

  const handleCreateAndSend = handleSubmit(async (data) => {
    loadingSend.onTrue();

    try {
      if (currentInvoice?.id) {
        // Update existing invoice
        const response = await fetcher([endpoints.invoice.update(currentInvoice.id), {
          method: 'put',
          data: { ...data, status: 'sent' },
        }]);
        
        // Show QBO status if available
        if (response.qbo_status === 'completed') {
          toast.success('Invoice updated and synced to QuickBooks successfully!');
        } else if (response.qbo_status === 'failed') {
          toast.warning(`Invoice updated but QBO sync failed: ${response.qbo_message || 'Unknown error'}`);
        } else {
          toast.success('Invoice updated successfully!');
        }
      } else {
        // Create new invoice
        const response = await fetcher([endpoints.invoice.create, {
          method: 'post',
          data: { ...data, status: 'sent' },
        }]);
        
        // Show QBO status if available
        if (response.qbo_status === 'completed') {
          toast.success('Invoice created and synced to QuickBooks successfully!');
        } else if (response.qbo_status === 'failed') {
          toast.warning(`Invoice created but QBO sync failed: ${response.qbo_message || 'Unknown error'}`);
        } else {
          toast.success('Invoice created successfully!');
        }
      }
      loadingSend.onFalse();
      router.push(paths.management.invoice.list);
    } catch (error) {
      console.error(error);
      loadingSend.onFalse();
    }
  });

  return (
    <Form methods={methods}>
      <Card>
        <InvoiceCreateEditAddress isEdit={!allowCustomerEdit} />
        <InvoiceCreateEditStatusDate />
        <InvoiceCreateEditDetails 
          currentInvoice={currentInvoice} 
          jobDetails={jobDetails}
          onOpenTimesheetDialog={onOpenTimesheetDialog}
        />
        <InvoiceCreateEditNotes />
      </Card>

      {!hideActions && (
        <Box
          sx={{
            mt: 3,
            gap: 2,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            size="large"
            variant="contained"
            loading={loadingSend.value && isSubmitting}
            onClick={handleCreateAndSend}
          >
            {currentInvoice ? 'Update' : 'Create & Send'}
          </Button>
        </Box>
      )}
    </Form>
  );
  }
);

InvoiceCreateEditForm.displayName = 'InvoiceCreateEditForm';

