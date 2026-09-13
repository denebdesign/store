import React, { createContext, useContext, useState, useEffect } from 'react';
import { Store, Order, OrderStatus, Product, PreviousOrderProfile } from '../types';
import { INITIAL_STORES, INITIAL_ORDERS } from '../data/mockStores';
import { decodeStoreFromUrl } from '../utils/storePayload';
import {
  saveStoreToFirestore,
  subscribeToStores,
  createOrderInFirestore,
  subscribeToStoreOrders,
  updateOrderInFirestore,
  getStoreFromFirestore,
  createOrdersBatchInFirestore,
  deleteOrderFromFirestore,
  deleteStoreFromFirestore,
} from '../services/firestoreService';

interface StoreContextType {
  stores: Store[];
  currentStoreId: string;
  currentStore: Store;
  setCurrentStoreId: (id: string) => void;
  orders: Order[];
  currentStoreOrders: Order[];
  activeView: 'customer' | 'boss';
  setActiveView: (view: 'customer' | 'boss') => void;
  createOrder: (data: {
    customerName: string;
    phone: string;
    address: string;
    detailAddress: string;
    deliveryRequest: string;
    items: {
      productId: string;
      productName: string;
      price: number;
      unit: string;
      emoji?: string;
      quantity: number;
    }[];
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  toggleOrderActive: (storeId: string) => void;
  updateDeadline: (storeId: string, deadline: string) => void;
  updateStoreDetails: (updated: Partial<Store>) => void;
  addStoreProduct: (product: Omit<Product, 'id'>) => void;
  updateStoreProduct: (product: Product) => void;
  deleteStoreProduct: (productId: string) => void;
  createNewStore: (storeData: Omit<Store, 'id' | 'slug'>) => Store;
  previousOrder: PreviousOrderProfile | null;
  savePreviousOrderProfile: (profile: PreviousOrderProfile) => void;
  findPreviousOrderByPhone: (phone: string) => Order | undefined;
  exportOrdersToCSV: () => void;
  importOrders: (importedOrders: Order[]) => void;
  clearStoreOrders: (storeId: string) => void;
  deleteStore: (storeId: string) => void;
  resetAllData: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY_STORES = 'jangter_stores_v3';
const STORAGE_KEY_ORDERS = 'jangter_orders_v3';
const STORAGE_KEY_PREV_ORDER = 'jangter_prev_order_v3';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stores, setStores] = useState<Store[]>(() => {
    let list = INITIAL_STORES;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STORES) || localStorage.getItem('jangter_stores_v1');
      if (saved) {
        const parsed: Store[] = JSON.parse(saved);
        const filtered = parsed.filter(
          (s) =>
            s.id !== 'store-seongsan-fish' &&
            s.id !== 'store-jeju-carrot' &&
            s.shortName !== '구좌당근' &&
            !s.name.includes('은갈치') &&
            !s.name.includes('구좌')
        );
        if (filtered.length > 0) {
          list = filtered.map((s) => ({
            ...s,
            intro: (s.intro || '').replace(/🥕/g, '').trim(),
            products: s.products.map((p) => ({
              ...p,
              emoji: p.emoji === '🥕' ? '📦' : (p.emoji || '📦'),
            })),
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Check if store payload is encoded directly in the URL (when opening customer order link)
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const dParam = params.get('d') || params.get('data');
        if (dParam) {
          const decoded = decodeStoreFromUrl(dParam);
          if (decoded) {
            const idx = list.findIndex((s) => s.id === decoded.id || s.slug === decoded.slug);
            if (idx >= 0) {
              list[idx] = decoded;
            } else {
              // Prepend decoded store so it's the primary store
              list = [decoded, ...list];
            }
          }
        }
      } catch (err) {
        console.error('Error parsing store payload in URL:', err);
      }
    }

    return list;
  });

  const [currentStoreId, setCurrentStoreId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const dParam = params.get('d') || params.get('data');
      if (dParam) {
        const decoded = decodeStoreFromUrl(dParam);
        if (decoded) return decoded.id;
      }

      const storeParam = params.get('id') || params.get('storeId') || params.get('store') || params.get('s');
      if (storeParam) {
        let decodedParam = storeParam;
        try {
          decodedParam = decodeURIComponent(storeParam).trim();
        } catch {
          // ignore
        }
        const found = stores.find(
          (s) =>
            s.id === storeParam ||
            s.id === decodedParam ||
            s.slug === storeParam ||
            s.slug === decodedParam ||
            s.name === decodedParam ||
            s.shortName === decodedParam
        );
        if (found) return found.id;
      }
    }
    // Prefer any user-created or non-sample store
    const userStore = stores.find((s) => s.ownerKakaoId || !s.id.startsWith('store-jeju-carrot'));
    return userStore ? userStore.id : stores[0]?.id || INITIAL_STORES[0].id;
  });


  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS) || localStorage.getItem('jangter_orders_v1');
      if (saved) {
        const parsed: Order[] = JSON.parse(saved);
        return parsed.map((o) => ({
          ...o,
          items: o.items.map((it) => ({
            ...it,
            emoji: it.emoji === '🥕' ? '📦' : (it.emoji || '📦'),
          })),
        }));
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ORDERS;
  });

  const [previousOrder, setPreviousOrder] = useState<PreviousOrderProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREV_ORDER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // In real service, first-time visitor has no previous order unless they ordered before or have a ref link
    return null;
  });

  const [activeView, setActiveView] = useState<'customer' | 'boss'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pathname = window.location.pathname;
      const savedView = localStorage.getItem('active_view_mode');

      // 1. Explicit view parameter in URL
      if (params.get('view') === 'boss' || params.get('mode') === 'boss') {
        return 'boss';
      }
      if (
        params.get('view') === 'customer' ||
        params.get('mode') === 'order' ||
        pathname.includes('/order') ||
        params.get('d')
      ) {
        return 'customer';
      }

      // 2. Saved view preference
      if (savedView === 'boss') {
        return 'boss';
      }
      if (savedView === 'customer') {
        return 'customer';
      }
    }
    return 'boss';
  });

  // Keep localStorage and URL sync when activeView changes
  const handleSetActiveView = (view: 'customer' | 'boss') => {
    setActiveView(view);
    try {
      localStorage.setItem('active_view_mode', view);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (view === 'customer') {
          url.pathname = '/order';
          url.searchParams.set('view', 'customer');
          if (currentStore?.id) {
            url.searchParams.set('id', currentStore.id);
          }
          url.searchParams.delete('store');
        } else {
          url.pathname = '/';
          url.searchParams.set('view', 'boss');
          url.searchParams.delete('mode');
          url.searchParams.delete('d');
          url.searchParams.delete('data');
          if (currentStore?.id) {
            url.searchParams.set('id', currentStore.id);
          }
        }
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Watch URL params (e.g. when navigating, refreshed, or opening link)
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const pathname = window.location.pathname;
      const dParam = params.get('d') || params.get('data');
      const viewParam = params.get('view');
      const modeParam = params.get('mode');
      const savedView = localStorage.getItem('active_view_mode');

      // 1. Direct store payload present in URL (e.g. sent from KakaoTalk share link)
      if (dParam) {
        const decoded = decodeStoreFromUrl(dParam);
        if (decoded) {
          setStores((prev) => {
            const existsIdx = prev.findIndex((s) => s.id === decoded.id || s.slug === decoded.slug);
            if (existsIdx >= 0) {
              const copy = [...prev];
              copy[existsIdx] = decoded;
              return copy;
            }
            return [decoded, ...prev];
          });
          setCurrentStoreId(decoded.id);
          setActiveView('customer');
          localStorage.setItem('active_view_mode', 'customer');
          return;
        }
      }

      // 2. Store ID / slug parameter in URL
      const rawStoreParam = params.get('id') || params.get('storeId') || params.get('s') || params.get('store');
      if (rawStoreParam) {
        let decodedParam = rawStoreParam;
        try {
          decodedParam = decodeURIComponent(rawStoreParam).trim();
        } catch {
          // ignore decode error
        }

        const found = stores.find(
          (s) =>
            s.id === rawStoreParam ||
            s.id === decodedParam ||
            s.slug === rawStoreParam ||
            s.slug === decodedParam ||
            s.name === decodedParam ||
            s.shortName === decodedParam
        );

        if (found) {
          setCurrentStoreId(found.id);
        } else {
          // Fetch directly from Firestore for first-time visitors opening a short link
          getStoreFromFirestore(decodedParam).then((remoteStore) => {
            if (remoteStore) {
              setStores((prev) => {
                const exists = prev.some((s) => s.id === remoteStore.id);
                return exists ? prev : [remoteStore, ...prev];
              });
              setCurrentStoreId(remoteStore.id);
            } else {
              // Fallback to custom non-sample store if available
              const userStore = stores.find((s) => s.ownerKakaoId || !s.id.startsWith('store-jeju-carrot'));
              if (userStore) {
                setCurrentStoreId(userStore.id);
              }
            }
          }).catch(console.error);
        }

        // Determine view based on URL and saved mode:
        if (
          viewParam === 'boss' ||
          (savedView === 'boss' && viewParam !== 'customer' && !pathname.includes('/order'))
        ) {
          setActiveView('boss');
          localStorage.setItem('active_view_mode', 'boss');
        } else if (
          viewParam === 'customer' ||
          modeParam === 'order' ||
          pathname.includes('/order') ||
          savedView === 'customer'
        ) {
          setActiveView('customer');
          localStorage.setItem('active_view_mode', 'customer');
        }
      } else if (
        viewParam === 'boss' ||
        (savedView === 'boss' && viewParam !== 'customer' && !pathname.includes('/order'))
      ) {
        setActiveView('boss');
        localStorage.setItem('active_view_mode', 'boss');
      } else if (
        viewParam === 'customer' ||
        modeParam === 'order' ||
        pathname.includes('/order')
      ) {
        setActiveView('customer');
        localStorage.setItem('active_view_mode', 'customer');
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [stores]);


  // 1. Real-time Firestore stores synchronization
  useEffect(() => {
    const unsubscribe = subscribeToStores((remoteStores) => {
      if (remoteStores && remoteStores.length > 0) {
        // Filter out any stale dummy/test stores like 'store-jeju-carrot'
        const validRemoteStores = remoteStores.filter(
          (s) =>
            s.id !== 'store-jeju-carrot' &&
            s.shortName !== '구좌당근' &&
            !s.name.includes('구좌')
        );

        if (validRemoteStores.length > 0) {
          setStores(validRemoteStores);

          // Ensure currentStoreId points to a valid store
          setCurrentStoreId((prevId) => {
            const params = new URLSearchParams(window.location.search);
            const targetId = params.get('id') || params.get('storeId') || params.get('s') || params.get('store');
            if (targetId) {
              const matched = validRemoteStores.find((s) => s.id === targetId || s.slug === targetId);
              if (matched) return matched.id;
            }
            if (prevId && validRemoteStores.some((s) => s.id === prevId)) {
              return prevId;
            }
            return validRemoteStores[0].id;
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore orders synchronization for current active store
  useEffect(() => {
    if (!currentStoreId) return;
    const unsubscribe = subscribeToStoreOrders(currentStoreId, (remoteOrders) => {
      if (remoteOrders) {
        setOrders((prev) => {
          const otherStoreOrders = prev.filter((o) => o.storeId !== currentStoreId);
          return [...remoteOrders, ...otherStoreOrders];
        });
      }
    });
    return () => unsubscribe();
  }, [currentStoreId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STORES, JSON.stringify(stores));
    } catch (e) {
      console.error(e);
    }
  }, [stores]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      if (previousOrder) {
        localStorage.setItem(STORAGE_KEY_PREV_ORDER, JSON.stringify(previousOrder));
      } else {
        localStorage.removeItem(STORAGE_KEY_PREV_ORDER);
      }
    } catch (e) {
      console.error(e);
    }
  }, [previousOrder]);

  const currentStore = stores.find((s) => s.id === currentStoreId) || stores[0];
  const currentStoreOrders = orders.filter((o) => o.storeId === currentStoreId);

  const createOrder = (data: {
    customerName: string;
    phone: string;
    address: string;
    detailAddress: string;
    deliveryRequest: string;
    items: {
      productId: string;
      productName: string;
      price: number;
      unit: string;
      emoji?: string;
      quantity: number;
    }[];
  }): Order => {
    const nextOrderNumber =
      orders.length > 0 ? Math.max(...orders.map((o) => o.orderNumber)) + 1 : 1001;

    const totalAmount = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalUnits = data.items.reduce((sum, item) => sum + item.quantity, 0);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: nextOrderNumber,
      storeId: currentStore.id,
      createdAt: new Date().toISOString(),
      customerName: data.customerName,
      phone: data.phone,
      address: data.address,
      detailAddress: data.detailAddress,
      deliveryRequest: data.deliveryRequest || '배송 전 연락바랍니다.',
      items: data.items,
      totalAmount,
      totalUnits,
      status: 'new',
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Persist to Firestore
    createOrderInFirestore(newOrder).catch((err) => {
      console.error('[Firestore] Failed to save order:', err);
    });

    // Save as previous order for next visit
    const profile: PreviousOrderProfile = {
      customerName: data.customerName,
      phone: data.phone,
      address: data.address,
      detailAddress: data.detailAddress,
      deliveryRequest: data.deliveryRequest,
      items: data.items,
      storeId: currentStore.id,
      orderedAt: new Date().toISOString(),
    };
    setPreviousOrder(profile);

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status } : ord))
    );
    updateOrderInFirestore(orderId, { status }).catch((err) => {
      console.error('[Firestore] Failed to update order status:', err);
    });
  };

  const toggleOrderActive = (storeId: string) => {
    setStores((prev) =>
      prev.map((s) => {
        if (s.id === storeId) {
          const updated = { ...s, isOrderActive: !s.isOrderActive };
          saveStoreToFirestore(updated).catch(console.error);
          return updated;
        }
        return s;
      })
    );
  };

  const updateDeadline = (storeId: string, deadline: string) => {
    setStores((prev) =>
      prev.map((s) => {
        if (s.id === storeId) {
          const updated = { ...s, orderDeadline: deadline };
          saveStoreToFirestore(updated).catch(console.error);
          return updated;
        }
        return s;
      })
    );
  };

  const updateStoreDetails = (updated: Partial<Store>) => {
    setStores((prev) =>
      prev.map((s) => {
        if (s.id === currentStoreId) {
          const merged = { ...s, ...updated };
          saveStoreToFirestore(merged).catch(console.error);
          return merged;
        }
        return s;
      })
    );
  };

  const addStoreProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: `p-${Date.now()}`,
      isAvailable: true,
    };
    setStores((prev) =>
      prev.map((s) => {
        if (s.id === currentStoreId) {
          const updated = { ...s, products: [...s.products, newProduct] };
          saveStoreToFirestore(updated).catch(console.error);
          return updated;
        }
        return s;
      })
    );
  };

  const updateStoreProduct = (product: Product) => {
    setStores((prev) =>
      prev.map((s) => {
        if (s.id === currentStoreId) {
          const updated = {
            ...s,
            products: s.products.map((p) => (p.id === product.id ? product : p)),
          };
          saveStoreToFirestore(updated).catch(console.error);
          return updated;
        }
        return s;
      })
    );
  };

  const deleteStoreProduct = (productId: string) => {
    setStores((prev) =>
      prev.map((s) => {
        if (s.id === currentStoreId) {
          const updated = { ...s, products: s.products.filter((p) => p.id !== productId) };
          saveStoreToFirestore(updated).catch(console.error);
          return updated;
        }
        return s;
      })
    );
  };

  const createNewStore = (storeData: Omit<Store, 'id' | 'slug'>): Store => {
    // Generate clean slug from name or timestamp
    const cleanName = storeData.name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '')
      .slice(0, 10);
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const newSlug = cleanName ? `${cleanName}-${randomSuffix}` : `store-${Date.now().toString().slice(-6)}`;

    const newStore: Store = {
      id: `store-${Date.now()}`,
      slug: newSlug,
      ...storeData,
    };

    setStores((prev) => {
      const onlySampleStores = prev.every((s) => !s.ownerKakaoId);
      if (storeData.ownerKakaoId && onlySampleStores) {
        setOrders([]);
        return [newStore];
      }
      return [newStore, ...prev];
    });

    setCurrentStoreId(newStore.id);

    // Save to Firestore
    saveStoreToFirestore(newStore).catch((err) => {
      console.error('[Firestore] Failed to save new store:', err);
    });

    return newStore;
  };

  const savePreviousOrderProfile = (profile: PreviousOrderProfile) => {
    setPreviousOrder(profile);
  };

  const findPreviousOrderByPhone = (phoneInput: string): Order | undefined => {
    const clean = phoneInput.replace(/[^0-9]/g, '');
    if (clean.length < 10) return undefined;
    // Find the latest order with this phone
    return orders.find((o) => o.phone.replace(/[^0-9]/g, '') === clean);
  };

  const exportOrdersToCSV = () => {
    const ordersToExport = currentStoreOrders;
    if (ordersToExport.length === 0) {
      alert('다운로드할 주문 내역이 없습니다.');
      return;
    }

    const headers = [
      '주문번호',
      '받는분',
      '전화번호',
      '주소',
      '상세주소',
      '상품명',
      '수량',
      '주문금액',
      '배송요청사항',
      '주문상태',
      '주문일시',
    ];

    const rows = ordersToExport.map((o) => {
      const itemsDesc = o.items.map((it) => `${it.productName}(${it.quantity}${it.unit})`).join(' / ');
      const totalQty = o.items.reduce((s, it) => s + it.quantity, 0);
      const statusKorean =
        o.status === 'new'
          ? '신규주문'
          : o.status === 'preparing'
          ? '준비중'
          : o.status === 'shipped'
          ? '출고완료'
          : '취소';

      const formattedDate = new Date(o.createdAt).toLocaleString('ko-KR');

      return [
        o.orderNumber,
        `"${(o.customerName || '').replace(/"/g, '""')}"`,
        `"${(o.phone || '').replace(/"/g, '""')}"`,
        `"${(o.address || '').replace(/"/g, '""')}"`,
        `"${(o.detailAddress || '').replace(/"/g, '""')}"`,
        `"${itemsDesc.replace(/"/g, '""')}"`,
        totalQty,
        o.totalAmount,
        `"${(o.deliveryRequest || '').replace(/"/g, '""')}"`,
        statusKorean,
        `"${formattedDate}"`,
      ].join(',');
    });

    // Add UTF-8 BOM (\uFEFF) so Korean characters open perfectly in Excel
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentStore.shortName}_주문목록_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importOrders = (newOrders: Order[]) => {
    if (!newOrders || newOrders.length === 0) return;
    setOrders((prev) => [...newOrders, ...prev]);
    // Persist all imported orders to Firestore
    createOrdersBatchInFirestore(newOrders).catch((err) => {
      console.error('[Firestore] Failed to batch save imported orders:', err);
    });
  };

  const clearStoreOrders = (storeId: string) => {
    const ordersToDelete = orders.filter((o) => o.storeId === storeId);
    setOrders((prev) => prev.filter((o) => o.storeId !== storeId));
    ordersToDelete.forEach((o) => {
      deleteOrderFromFirestore(o.id).catch(console.error);
    });
  };

  const deleteStore = (storeId: string) => {
    // Remove orders associated with store
    setOrders((prev) => prev.filter((o) => o.storeId !== storeId));
    // Remove store
    setStores((prev) => {
      const remaining = prev.filter((s) => s.id !== storeId);
      if (currentStoreId === storeId && remaining.length > 0) {
        setCurrentStoreId(remaining[0].id);
      }
      return remaining;
    });
    // Delete in Firestore
    deleteStoreFromFirestore(storeId).catch((err) => {
      console.error('[Firestore] Failed to delete store from Firestore:', err);
    });
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY_STORES);
    localStorage.removeItem(STORAGE_KEY_ORDERS);
    localStorage.removeItem(STORAGE_KEY_PREV_ORDER);
    setStores(INITIAL_STORES);
    setOrders(INITIAL_ORDERS);
    setCurrentStoreId(INITIAL_STORES[0].id);
    window.location.reload();
  };

  return (
    <StoreContext.Provider
      value={{
        stores,
        currentStoreId,
        currentStore,
        setCurrentStoreId,
        orders,
        currentStoreOrders,
        activeView,
        setActiveView: handleSetActiveView,
        createOrder,
        updateOrderStatus,
        toggleOrderActive,
        updateDeadline,
        updateStoreDetails,
        addStoreProduct,
        updateStoreProduct,
        deleteStoreProduct,
        createNewStore,
        previousOrder,
        savePreviousOrderProfile,
        findPreviousOrderByPhone,
        exportOrdersToCSV,
        importOrders,
        clearStoreOrders,
        deleteStore,
        resetAllData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
