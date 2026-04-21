import type { UseFormReturn } from 'react-hook-form';

import { FormProvider as RHFForm } from 'react-hook-form';

// ----------------------------------------------------------------------

export type FormProps = {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  methods: UseFormReturn<any>;
};

export function Form({ children, onSubmit, methods }: FormProps) {
  return (
    <RHFForm {...methods}>
      <form
        onSubmit={(e) => {
          // Prevent full-page navigation on accidental submit (e.g. implicit submit from Enter or
          // controls that still bubble to this form). Parent handlers run after preventDefault.
          e.preventDefault();
          e.stopPropagation();
          onSubmit?.(e);
        }}
        noValidate
        autoComplete="off"
      >
        {children}
      </form>
    </RHFForm>
  );
}
