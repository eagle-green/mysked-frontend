import type { ZodTypeAny } from 'zod';

import dayjs from 'dayjs';
import { z as zod } from 'zod';

// ----------------------------------------------------------------------

type MessageMapProps = {
  required?: string;
  invalid_type?: string;
};

export const schemaHelper = {
  /**
   * Phone number
   * Apply for phone number input.
   */
  phoneNumber: (props?: { message?: MessageMapProps; isValid?: (text: string) => boolean }) =>
    zod
      .string({
        required_error: props?.message?.required ?? 'Phone number is required!',
        invalid_type_error: props?.message?.invalid_type ?? 'Invalid phone number!',
      })
      .min(1, { message: props?.message?.required ?? 'Phone number is required!' })
      .refine((data) => props?.isValid?.(data), {
        message: props?.message?.invalid_type ?? 'Invalid phone number!',
      }),
  /**
   * Contact number
   * Apply for phone number input.
   */
  contactNumber: (props?: { message?: MessageMapProps; isValid?: (text: string) => boolean }) =>
    zod
      .string({
        invalid_type_error: props?.message?.invalid_type ?? 'Invalid contact number!',
      })
      .optional()
      .nullable()
      .refine(
        (data) => {
          if (data == null || data === '') return true; // Skip validation if not provided
          return props?.isValid?.(data);
        },
        {
          message: props?.message?.invalid_type ?? 'Invalid contact number!',
        }
      ),

  /**
   * Date
   * Apply for date pickers.
   */
  date: (props?: { message?: MessageMapProps }) =>
    zod.coerce
      .date()
      .nullable()
      .transform((dateString, ctx) => {
        const date = dayjs(dateString).format();

        const stringToDate = zod.string().pipe(zod.coerce.date());

        if (!dateString) {
          ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: props?.message?.required ?? 'Date is required!',
          });
          return null;
        }

        if (!stringToDate.safeParse(date).success) {
          ctx.addIssue({
            code: zod.ZodIssueCode.invalid_date,
            message: props?.message?.invalid_type ?? 'Invalid Date!!',
          });
        }

        return date;
      })
      .pipe(zod.union([zod.number(), zod.string(), zod.date(), zod.null()])),
  /**
   * Editor
   * defaultValue === '' | <p></p>
   * Apply for editor
   */
  editor: (props?: { message: string }) =>
    zod.string().min(8, { message: props?.message ?? 'Content is required!' }),
  /**
   * Nullable Input
   * Apply for input, select... with null value.
   */
  nullableInput: <T extends ZodTypeAny>(schema: T, options?: { message?: string }) =>
    schema.nullable().transform((val, ctx) => {
      if (val === null || val === undefined) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: options?.message ?? 'Field can not be null!',
        });
        return val;
      }
      return val;
    }),
  /**
   * Boolean
   * Apply for checkbox, switch...
   */
  boolean: (props?: { message: string }) =>
    zod.boolean({ coerce: true }).refine((val) => val === true, {
      message: props?.message ?? 'Field is required!',
    }),
  /**
   * Slider
   * Apply for slider with range [min, max].
   */
  sliderRange: (props: { message?: string; min: number; max: number }) =>
    zod
      .number()
      .array()
      .refine((data) => data[0] >= props?.min && data[1] <= props?.max, {
        message: props.message ?? `Range must be between ${props?.min} and ${props?.max}`,
      }),
  /**
   * File
   * Apply for upload single file.
   */
  file: (props?: { message: string }) =>
    zod.custom<File | string | null>().transform((data, ctx) => {
      const hasFile = data instanceof File || (typeof data === 'string' && !!data.length);

      if (!hasFile) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: props?.message ?? 'File is required!',
        });
        return null;
      }

      return data;
    }),
  /**
   * Files
   * Apply for upload multiple files.
   */
  files: (props?: { message: string; minFiles?: number }) =>
    zod.array(zod.custom<File | string>()).transform((data, ctx) => {
      const minFiles = props?.minFiles ?? 2;

      if (!data.length) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: props?.message ?? 'Files is required!',
        });
      } else if (data.length < minFiles) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: `Must have at least ${minFiles} items!`,
        });
      }

      return data;
    }),
  /**
   * Email
   * Apply for optional emails.
   */
  emailOptional: (props?: { message: string }) =>
    zod
      .string()
      .nullable()
      .optional()
      .refine(
        (val) => {
          if (!val) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        },
        { message: props?.message ?? 'Email must be a valid email address!' }
      ),

  /**
   * Email
   * Required email with validation.
   */
  emailRequired: (props?: { required?: string; invalid?: string }) =>
    zod
      .string({
        required_error: props?.required ?? 'Email is required!',
      })
      .min(1, { message: props?.required ?? 'Email is required!' })
      .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: props?.invalid ?? 'Email must be a valid email address!',
      }),

  /**
   * Canadian Postal Code
   * - Normalize to `AAA AAA`
   * - Validate against `/^[A-Z]\d[A-Z] \d[A-Z]\d$/`
   */
  postalCode: (props?: { message?: MessageMapProps }) =>
    zod
      .string()
      .optional()
      .nullable()
      .transform((val) => {
        if (!val) return val;

        const cleaned = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        if (cleaned.length <= 3) return cleaned;
        return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6);
      })
      .refine(
        (val) => {
          if (!val) return true;
          return /^[A-Z]\d[A-Z] \d[A-Z]\d$/.test(val);
        },
        {
          message: props?.message?.invalid_type ?? 'Postal code must be in A1A 1A1 format',
        }
      ),
};
