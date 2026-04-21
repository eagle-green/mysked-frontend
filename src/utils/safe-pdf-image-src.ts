/** @react-pdf/renderer Image must not receive an empty src in the browser — it triggers fetch errors and Buffer warnings. */
export function hasPdfImageSrc(src: string | null | undefined): src is string {
  return typeof src === 'string' && src.trim().length > 0;
}
