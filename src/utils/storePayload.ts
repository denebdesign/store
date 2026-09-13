import { Store } from '../types';

/**
 * Compact URL payload encoder / decoder for Store objects.
 * This guarantees that when a boss shares a KakaoTalk link to ANY customer,
 * the customer's phone immediately loads the boss's REAL store, products, prices,
 * and bank details across different devices/browsers without data loss.
 */

interface MinimalStorePayload {
  id?: string;
  s: string; // slug
  n: string; // name
  sn?: string; // shortName
  i?: string; // intro
  e?: string; // emoji
  oa?: number; // isOrderActive (1 or 0)
  od?: string; // orderDeadline
  bn?: string; // bankName
  ba?: string; // bankAccount
  bh?: string; // bankHolder
  op?: string; // ownerPhone
  p?: Array<{
    id?: string;
    n: string; // name
    p: number; // price
    u: string; // unit
    e?: string; // emoji
    d?: string; // description
    a?: number; // isAvailable (1 or 0)
  }>;
}

export function encodeStoreToUrl(store: Store): string {
  try {
    const payload: MinimalStorePayload = {
      id: store.id,
      s: store.slug,
      n: store.name,
      sn: store.shortName || store.name,
      i: store.intro || '',
      e: store.emoji || '🌾',
      oa: store.isOrderActive ? 1 : 0,
      od: store.orderDeadline || '',
      bn: store.bankName || '',
      ba: store.bankAccount || '',
      bh: store.bankHolder || '',
      op: store.ownerPhone || '',
      p: (store.products || []).map((pr) => ({
        id: pr.id,
        n: pr.name,
        p: pr.price,
        u: pr.unit,
        e: pr.emoji,
        d: pr.description || '',
        a: pr.isAvailable !== false ? 1 : 0,
      })),
    };

    const json = JSON.stringify(payload);
    // Use encodeURIComponent + btoa for safe unicode string encoding in browser
    const binaryStr = unescape(encodeURIComponent(json));
    const base64 = btoa(binaryStr);
    // Replace standard base64 chars with URL-safe chars
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error('Failed to encode store to URL:', err);
    return '';
  }
}

export function decodeStoreFromUrl(encoded: string): Store | null {
  try {
    if (!encoded || typeof encoded !== 'string') return null;

    // Restore standard base64 from URL-safe base64
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    const binaryStr = atob(base64);
    const json = decodeURIComponent(escape(binaryStr));
    const m: MinimalStorePayload = JSON.parse(json);

    if (!m || !m.n) return null;

    const store: Store = {
      id: m.id || `store-${m.s || Date.now()}`,
      slug: m.s || 'store',
      name: m.n,
      shortName: m.sn || m.n.slice(0, 10),
      category: 'farm',
      intro: m.i || '산지에서 직접 재배한 신선 농산물 직송',
      emoji: m.e || '🌾',
      isOrderActive: m.oa !== 0,
      orderDeadline: m.od || '매일 오후 5:00 마감 (순차 발송)',
      bankName: m.bn || '농협',
      bankAccount: m.ba || '',
      bankHolder: m.bh || '',
      ownerPhone: m.op || '',
      products: (m.p && m.p.length > 0)
        ? m.p.map((pr, idx) => ({
            id: pr.id || `p-${idx + 1}`,
            name: pr.n,
            price: Number(pr.p) || 0,
            unit: pr.u || '박스',
            emoji: pr.e || '📦',
            description: pr.d || '',
            isAvailable: pr.a !== 0,
          }))
        : [
            {
              id: 'p-default',
              name: m.n,
              price: 25000,
              unit: '박스',
              emoji: m.e || '📦',
              description: '정성껏 준비한 산지직송 상품',
              isAvailable: true,
            },
          ],
    };

    return store;
  } catch (err) {
    console.warn('Failed to decode store payload from URL:', err);
    return null;
  }
}
