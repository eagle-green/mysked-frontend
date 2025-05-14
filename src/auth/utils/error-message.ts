// ----------------------------------------------------------------------

// export function getErrorMessage(error: unknown): string {
//   if (error instanceof Error) {
//     return error.message;
//   } else if (typeof error === 'string') {
//     return error;
//   } else if (typeof error === 'object' && error !== null && 'message' in error) {
//     return (error as { message: string }).message;
//   } else {
//     return `Unknown error: ${error}`;
//   }
// }

import axios from 'axios';

export function getErrorMessage(error: unknown): string {
  // Axios error
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (data?.error && typeof data.error === 'string') {
      return data.error;
    }

    return error.message;
  }

  // Native JS error
  if (error instanceof Error) {
    return error.message;
  }

  // Check for { error: "..." }
  if (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as any).error === 'string'
  ) {
    return (error as any).error;
  }

  // Fallback
  return 'An unknown error occurred.';
}
