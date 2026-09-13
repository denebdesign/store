import { Store } from '../types';
import { encodeStoreToUrl } from './storePayload';

/**
 * Domain & Public Store Order URL utilities
 */

export const TARGET_CUSTOM_DOMAIN = 'store.iuser.kr';
export const FIREBASE_HOSTING_DOMAIN = 'store-iuser-kr.web.app';

export function getStoreOrderLinks(storeOrSlug: Store | string): {
  displayUrl: string;
  actualUrl: string;
  shortUrl: string;
} {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  let storeId = '';
  if (typeof storeOrSlug === 'string') {
    storeId = storeOrSlug;
  } else {
    storeId = storeOrSlug.id;
  }

  // Clean, short alphanumeric ID (No percent encoding, No giant base64 payload)
  const cleanQuery = `id=${encodeURIComponent(storeId)}`;

  // Direct customer order link path with /order
  const customDomainUrl = `https://${TARGET_CUSTOM_DOMAIN}/order?${cleanQuery}`;

  // Actual clickable URL depending on current active host
  let actualUrl = customDomainUrl;
  if (currentHostname.includes('iuser.kr')) {
    actualUrl = `https://${TARGET_CUSTOM_DOMAIN}/order?${cleanQuery}`;
  } else if (currentOrigin) {
    actualUrl = `${currentOrigin}/order?${cleanQuery}`;
  }

  return {
    displayUrl: actualUrl,
    actualUrl,
    shortUrl: customDomainUrl,
  };
}


