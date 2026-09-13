import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Store, Order, PreviousOrderProfile, UserProfile } from '../types';

/**
 * Normalizes phone numbers (removes hyphens, spaces) for consistent lookups
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Saves or updates a store document in Firestore
 */
export async function saveStoreToFirestore(store: Store): Promise<void> {
  if (
    store.id === 'store-jeju-carrot' ||
    store.shortName === '구좌당근' ||
    (store.name && store.name.includes('구좌'))
  ) {
    return;
  }
  try {
    const storeRef = doc(db, 'stores', store.id);
    await setDoc(storeRef, store, { merge: true });
    console.log(`[Firestore] Store ${store.id} saved successfully`);
  } catch (error) {
    console.error(`[Firestore] Error saving store ${store.id}:`, error);
    throw error;
  }
}

/**
 * Fetches a single store by ID or slug from Firestore
 */
export async function getStoreFromFirestore(storeIdOrSlug: string): Promise<Store | null> {
  try {
    // First try direct document lookup by ID
    const directDoc = await getDoc(doc(db, 'stores', storeIdOrSlug));
    if (directDoc.exists()) {
      return directDoc.data() as Store;
    }

    // Next query by slug
    const q = query(collection(db, 'stores'), where('slug', '==', storeIdOrSlug));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as Store;
    }

    return null;
  } catch (error) {
    console.error(`[Firestore] Error fetching store ${storeIdOrSlug}:`, error);
    return null;
  }
}

/**
 * Subscribes to real-time updates for all stores
 */
export function subscribeToStores(
  onUpdate: (stores: Store[]) => void,
  onError?: (error: Error) => void
): () => void {
  const storesCol = collection(db, 'stores');
  return onSnapshot(
    storesCol,
    (snapshot) => {
      const stores: Store[] = [];
      snapshot.forEach((d) => {
        const s = d.data() as Store;
        if (
          s.id !== 'store-jeju-carrot' &&
          s.shortName !== '구좌당근' &&
          !(s.name && s.name.includes('구좌'))
        ) {
          stores.push(s);
        }
      });
      onUpdate(stores);
    },
    (err) => {
      console.error('[Firestore] Stores listener error:', err);
      onError?.(err);
    }
  );
}

/**
 * Saves a new order into Firestore
 */
export async function createOrderInFirestore(order: Order): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', order.id);
    await setDoc(orderRef, order);
    console.log(`[Firestore] Order ${order.id} created successfully`);

    // Also update customer profile cache for phone lookup
    if (order.phone) {
      const cleanPhone = normalizePhone(order.phone);
      const profileRef = doc(db, 'customerProfiles', cleanPhone);
      const profile: PreviousOrderProfile = {
        customerName: order.customerName,
        phone: order.phone,
        address: order.address,
        detailAddress: order.detailAddress,
        deliveryRequest: order.deliveryRequest,
        items: order.items,
        storeId: order.storeId,
        orderedAt: order.createdAt,
      };
      await setDoc(profileRef, profile, { merge: true });
    }
  } catch (error) {
    console.error(`[Firestore] Error creating order ${order.id}:`, error);
    throw error;
  }
}

/**
 * Subscribes to real-time orders for a specific store
 */
export function subscribeToStoreOrders(
  storeId: string,
  onUpdate: (orders: Order[]) => void,
  onError?: (error: Error) => void
): () => void {
  const ordersCol = collection(db, 'orders');
  const q = query(ordersCol, where('storeId', '==', storeId));

  return onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((d) => {
        orders.push(d.data() as Order);
      });
      // Sort in descending order of createdAt
      orders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      onUpdate(orders);
    },
    (err) => {
      console.error(`[Firestore] Orders listener error for store ${storeId}:`, err);
      onError?.(err);
    }
  );
}

/**
 * Updates an order status or notes in Firestore
 */
export async function updateOrderInFirestore(
  orderId: string,
  updates: Partial<Order>
): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, updates);
    console.log(`[Firestore] Order ${orderId} updated successfully`);
  } catch (error) {
    console.error(`[Firestore] Error updating order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Looks up previous customer shipping profile by phone number
 */
export async function lookupCustomerProfileInFirestore(
  phone: string
): Promise<PreviousOrderProfile | null> {
  try {
    const clean = normalizePhone(phone);
    if (!clean) return null;

    const profileDoc = await getDoc(doc(db, 'customerProfiles', clean));
    if (profileDoc.exists()) {
      return profileDoc.data() as PreviousOrderProfile;
    }
    return null;
  } catch (error) {
    console.error('[Firestore] Customer profile lookup error:', error);
    return null;
  }
}

/**
 * Saves or updates Kakao authenticated user in Firestore
 */
export async function saveUserProfileToFirestore(user: {
  id: string;
  nickname: string;
  email?: string;
  profileImage?: string;
}): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.id);
    const existingDoc = await getDoc(userRef);
    const now = new Date().toISOString();

    const userData: UserProfile = {
      id: user.id,
      nickname: user.nickname || '사장님',
      email: user.email || '',
      profileImage: user.profileImage || '',
      createdAt: existingDoc.exists() ? (existingDoc.data()?.createdAt || now) : now,
      lastLoginAt: now,
    };

    await setDoc(userRef, userData, { merge: true });
    console.log(`[Firestore] User ${user.id} (${user.nickname}) profile saved successfully`);
  } catch (error) {
    console.error(`[Firestore] Error saving user profile ${user.id}:`, error);
  }
}

/**
 * Saves multiple orders to Firestore in batch
 */
export async function createOrdersBatchInFirestore(orders: Order[]): Promise<void> {
  if (!orders || orders.length === 0) return;
  try {
    const batch = writeBatch(db);
    orders.forEach((order) => {
      const orderRef = doc(db, 'orders', order.id);
      batch.set(orderRef, order);
      if (order.phone) {
        const cleanPhone = normalizePhone(order.phone);
        if (cleanPhone) {
          const profileRef = doc(db, 'customerProfiles', cleanPhone);
          const profile: PreviousOrderProfile = {
            customerName: order.customerName,
            phone: order.phone,
            address: order.address,
            detailAddress: order.detailAddress,
            deliveryRequest: order.deliveryRequest,
            items: order.items,
            storeId: order.storeId,
            orderedAt: order.createdAt,
          };
          batch.set(profileRef, profile, { merge: true });
        }
      }
    });
    await batch.commit();
    console.log(`[Firestore] Batch saved ${orders.length} orders successfully`);
  } catch (error) {
    console.error('[Firestore] Error saving orders batch:', error);
    throw error;
  }
}

/**
 * Deletes an order from Firestore
 */
export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'orders', orderId));
    console.log(`[Firestore] Order ${orderId} deleted successfully`);
  } catch (error) {
    console.error(`[Firestore] Error deleting order ${orderId}:`, error);
  }
}

/**
 * Deletes a store and all its orders from Firestore
 */
export async function deleteStoreFromFirestore(storeId: string): Promise<void> {
  try {
    // Delete store doc
    await deleteDoc(doc(db, 'stores', storeId));
    // Query & delete all store orders
    const q = query(collection(db, 'orders'), where('storeId', '==', storeId));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    console.log(`[Firestore] Store ${storeId} and ${snapshot.size} orders deleted from Firestore`);
  } catch (error) {
    console.error(`[Firestore] Error deleting store ${storeId}:`, error);
  }
}


