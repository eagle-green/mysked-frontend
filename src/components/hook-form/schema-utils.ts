import * as z from 'zod';
import dayjs from 'dayjs';

// ----------------------------------------------------------------------

type SchemaErrorMessages = {
  required?: string;
  invalid?: string;
};

export const schemaUtils = {
  /**
   * Phone number
   * Apply for phone number input.
   */
  phoneNumber: (props?: { error?: SchemaErrorMessages; isValid?: (val: string) => boolean }) =>
    z
      .string()
      .min(1, { message: props?.error?.required ?? 'Phone number is required!' })
      .refine((val) => props?.isValid?.(val) ?? true, {
        message: props?.error?.invalid ?? 'Invalid phone number!',
      }),

  /**
   * Email
   * Apply for email input.
   */
  email: (props?: { error?: SchemaErrorMessages }) =>
    z.string().email({
      message: props?.error?.invalid ?? 'Email must be a valid email address!',
    }),

  /**
   * Date
   * Apply for date pickers.
   */
  date: (props?: { error?: SchemaErrorMessages }) =>
    z.preprocess(
      (val) => (val === undefined ? null : val), // Process input value before validation
      z.union([z.string(), z.number(), z.date(), z.null()]).refine((value) => {
        if (value === null || value === '') {
          return false;
        }
        return dayjs(value).isValid();
      }, {
        message: props?.error?.invalid ?? 'Invalid date!',
      })
    ),

  /**
   * Editor
   * Apply for editor
   */
  editor: (props?: { error?: string }) =>
    z.string().min(8, { message: props?.error ?? 'Content is required!' }),

  /**
   * Nullable Input
   * Apply for input, select... with null value.
   */
  nullableInput: <T extends z.ZodTypeAny>(schema: T, options?: { error?: string }) =>
    schema.nullable().refine((val) => val !== null && val !== undefined, {
      message: options?.error ?? 'Field is required!',
    }),

  /**
   * Boolean
   * Apply for checkbox, switch...
   */
  boolean: (props?: { error?: string }) =>
    z.boolean().refine((val) => val === true, {
      message: props?.error ?? 'Field is required!',
    }),

  /**
   * Slider range
   * Apply for slider with range [min, max].
   */
  sliderRange: (props: { error?: string; min: number; max: number }) =>
    z
      .number()
      .array()
      .refine((val) => val[0] >= props.min && val[1] <= props.max, {
        message: props.error ?? `Range must be between ${props.min} and ${props.max}`,
      }),

  /**
   * File
   * Apply for upload single file.
   */
  file: (props?: { error?: string }) =>
    z
      .custom<File | string | null>()
      .refine((value) => {
        if (!value || (typeof value === 'string' && !value.length)) {
          return false;
        }
        return true;
      }, {
        message: props?.error ?? 'File is required!',
      }),
  /**
   * Files
   * Apply for upload multiple files.
   */
  files: (props?: { error: string; minFiles?: number }) =>
    z
      .array(z.custom<File | string>())
      .min(1, { message: props?.error ?? 'Files is required!' }),
};

// ----------------------------------------------------------------------

/**
 * Test one or multiple values against a Zod schema.
 */
export function testCase<T extends z.ZodTypeAny>(schema: T, values: unknown[]) {
  const color = {
    green: (txt: string) => `\x1b[32m${txt}\x1b[0m`,
    red: (txt: string) => `\x1b[31m${txt}\x1b[0m`,
    gray: (txt: string) => `\x1b[90m${txt}\x1b[0m`,
  };

  values.forEach((value) => {
    const { data, success, error } = schema.safeParse(value);
    const type = color.gray(`(${typeof value})`);
    const serializedValue = JSON.stringify(value);

    const label = success
      ? color.green(`✅ Valid - ${serializedValue}`)
      : color.red(`❌ Error - ${serializedValue}`);
    const payload = success ? data : error;

    console.info(`${label} ${type}:`, JSON.stringify(payload, null, 2));
  });
}

// Example usage:
// testCase(schemaUtils.boolean(), [true, false, 'true', 'false', '', 1, 0, null, undefined]);

// testCase(schemaUtils.date(), [
//   '2025-04-10',
//   1712736000000,
//   new Date(),
//   '2025-02-30',
//   '04/10/2025',
//   'not-a-date',
//   '',
//   null,
//   undefined,
// ]);

// testCase(
//   schemaUtils.nullableInput(
//     z.coerce
//       .number()
//       .int()
//       .min(1, { error: 'Age is required!' })
//       .min(18, { error: 'Age must be between 18 and 80' })
//       .max(80, { error: 'Age must be between 18 and 80' }),
//     { error: 'Age is required!' }
//   ),
//   [2, '2', 18, '18', 79, '79', 81, '81', null, undefined]
// );
