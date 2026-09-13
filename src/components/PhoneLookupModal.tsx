import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';
import { Phone, Search, X, Check, MapPin, Package, AlertCircle, Loader2 } from 'lucide-react';
import { lookupCustomerProfileInFirestore } from '../services/firestoreService';

interface PhoneLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: Order) => void;
}

export const PhoneLookupModal: React.FC<PhoneLookupModalProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
}) => {
  const { currentStoreOrders, orders } = useStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searched, setSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  // Auto formatting for phone number
  const handlePhoneInputChange = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    let formatted = raw;
    if (raw.length > 3 && raw.length <= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else if (raw.length > 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    }
    setPhoneNumber(formatted);
    if (searched) {
      setSearched(false);
      setMatchedOrder(null);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = phoneNumber.replace(/[^0-9]/g, '');
    if (clean.length < 10) {
      alert('휴대폰 번호 10~11자리를 정확히 입력해주세요.');
      return;
    }

    setIsSearching(true);
    try {
      // 1. First search in-memory orders
      let found =
        currentStoreOrders.find((o) => o.phone.replace(/[^0-9]/g, '') === clean) ||
        orders.find((o) => o.phone.replace(/[^0-9]/g, '') === clean);

      // 2. Fallback to Firestore persistent cloud profile
      if (!found) {
        const cloudProfile = await lookupCustomerProfileInFirestore(clean);
        if (cloudProfile) {
          found = {
            id: `cloud-${Date.now()}`,
            orderNumber: 0,
            storeId: cloudProfile.storeId,
            customerName: cloudProfile.customerName,
            phone: cloudProfile.phone,
            address: cloudProfile.address,
            detailAddress: cloudProfile.detailAddress,
            deliveryRequest: cloudProfile.deliveryRequest,
            items: cloudProfile.items || [],
            totalAmount: 0,
            totalUnits: 0,
            status: 'new',
            createdAt: cloudProfile.orderedAt,
          };
        }
      }

      setMatchedOrder(found || null);
    } catch (err) {
      console.error('Phone lookup error:', err);
    } finally {
      setIsSearching(false);
      setSearched(true);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-t sm:border border-stone-200 animate-in slide-in-from-bottom duration-200"
        id="phone-lookup-modal"
      >
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-black text-stone-900 leading-tight">
                전화번호로 이전 주소 찾기
              </h3>
              <p className="text-xs text-stone-400">
                로그인 없이 번호만으로 지난번 배송지를 조회합니다
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition"
            id="close-phone-lookup-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Body */}
        <div className="p-5 space-y-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">
                주문하셨던 휴대폰 번호 입력
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneInputChange(e.target.value)}
                  placeholder="010-1234-5678"
                  autoFocus
                  className="flex-1 px-4 py-3 bg-stone-100 border border-stone-200 rounded-xl text-lg font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white tracking-wide"
                  id="lookup-phone-input"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-5 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 active:scale-95 text-white font-black text-sm rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-xs"
                  id="submit-phone-lookup-btn"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>{isSearching ? '조회중...' : '조회'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Result Card when found */}
          {searched && matchedOrder && (
            <div className="p-4 bg-orange-50/80 border-2 border-orange-300 rounded-2xl space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-orange-200/70">
                <span className="text-xs font-black text-orange-900 flex items-center gap-1">
                  <span>🎉</span>
                  <span>지난번 주문 내역을 찾았습니다!</span>
                </span>
                <span className="text-[11px] font-bold text-orange-700 bg-orange-200/60 px-2 py-0.5 rounded-full">
                  {new Date(matchedOrder.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} 주문
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-stone-700">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-stone-500 min-w-[52px]">받는 분:</span>
                  <span className="font-extrabold text-sm text-stone-900">{matchedOrder.customerName}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-stone-500 min-w-[52px] shrink-0 mt-0.5">배송 주소:</span>
                  <span className="font-bold text-stone-900 leading-snug">
                    {matchedOrder.address} {matchedOrder.detailAddress}
                  </span>
                </div>
                {matchedOrder.deliveryRequest && (
                  <div className="flex items-center gap-1.5 text-stone-500">
                    <span className="font-medium min-w-[52px]">요청사항:</span>
                    <span className="truncate">{matchedOrder.deliveryRequest}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectOrder(matchedOrder);
                  onClose();
                }}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-black text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                id="apply-found-order-btn"
              >
                <Check className="w-4 h-4" />
                <span>이 주소로 주문서에 자동 입력하기</span>
              </button>
            </div>
          )}

          {/* Result when not found */}
          {searched && !matchedOrder && (
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-center space-y-1.5 animate-in fade-in duration-150">
              <div className="text-2xl mb-1">🔍</div>
              <p className="text-sm font-bold text-stone-800">
                해당 번호의 이전 주문 내역이 없습니다.
              </p>
              <p className="text-xs text-stone-500">
                첫 주문이시라면 아래 주문서에 성함과 주소를 직접 입력해 주시면 다음 주문 때 자동으로 기억됩니다.
              </p>
            </div>
          )}

          {/* Quick guide */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-[11px] text-stone-500 leading-relaxed">
            💡 <strong>안내</strong>: 3개월이나 6개월 만에 다시 주문하셔도 휴대폰 번호만 넣으시면 이전 배송지가 그대로 불러와집니다.
          </div>
        </div>
      </div>
    </div>
  );
};
