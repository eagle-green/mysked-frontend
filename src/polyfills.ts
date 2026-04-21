import { Buffer } from 'buffer';

/** @react-pdf / pdf-lib sometimes reference Node's Buffer; browsers don't define it. */
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}
