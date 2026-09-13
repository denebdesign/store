import React from 'react';
import { PreviousOrderProfile, Store } from '../types';
import { RotateCcw, User, MapPin, X, ArrowRight, CheckCircle2 } from 'lucide-react';

interface PreviousOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  previousOrder: PreviousOrderProfile;
  currentStore: Store;
  onApplyPreviousOrder: (profile: PreviousOrderProfile) => void;
}

export const PreviousOrderModal: React.FC<PreviousOrderModalProps> = ({
  isOpen,
  onClose,
  previousOrder,
  currentStore,
  onApplyPreviousOrder,
}) => {
  if (!isOpen) return null;

  const totalQty = previousOrder.items.reduce((s, it) => s + it.quantity, 0);
  const totalAmount = previousOrder.items.reduce((s, it) => s + it.price * it.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-100 animate-in zoom-in-95 duration-200"
        id="previous-order-modal"
      >
        {/* Header with warm farmer/market badge */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
            id="close-prev-order-modal"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-xs mb-2">
            <RotateCcw className="w-3.5 h-3.5" />
            빠른 재주문
          </div>
          <h3 className="text-xl font-bold leading-snug">
            지난번처럼 주문할까요?
          </h3>
          <p className="text-orange-100 text-xs mt-1">
            이전에 주문하신 내역과 배송지가 저장되어 있습니다.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Items card */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-500 mb-2 pb-1.5 border-b border-stone-200">
              <span className="flex items-center gap-1">
                <span>{currentStore.emoji}</span> 지난번 주문 상품
              </span>
              <span>총 {totalQty}개</span>
            </div>

            <div className="space-y-1.5">
              {previousOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-stone-800">
                    {item.emoji || currentStore.emoji} {item.productName}
                  </span>
                  <span className="font-bold text-stone-900">
                    {item.quantity}{item.unit}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-2 border-t border-stone-200 flex justify-between items-center text-sm font-bold text-orange-700">
              <span>주문 예정금액</span>
              <span>{totalAmount.toLocaleString()}원</span>
            </div>
          </div>

          {/* Delivery & Recipient info preview */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex items-start gap-2 text-stone-700">
              <User className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-stone-400 font-normal">받는 분:</span>{' '}
                <span className="font-semibold text-stone-900">{previousOrder.customerName}</span>{' '}
                <span className="text-stone-500">({previousOrder.phone})</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-stone-700">
              <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-stone-400 font-normal">배송지:</span>{' '}
                <span className="font-medium text-stone-800 leading-snug">
                  {previousOrder.address} {previousOrder.detailAddress}
                </span>
              </div>
            </div>

            {previousOrder.deliveryRequest && (
              <div className="text-stone-500 pt-1 border-t border-stone-200/60 truncate">
                요청사항: {previousOrder.deliveryRequest}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 pt-0 space-y-2">
          <button
            onClick={() => onApplyPreviousOrder(previousOrder)}
            className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl text-base shadow-md shadow-orange-600/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
            id="apply-previous-order-btn"
          >
            <span>[ 지난번처럼 주문 ]</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-center text-xs font-semibold text-stone-500 hover:text-stone-800 transition"
            id="dismiss-previous-order-btn"
          >
            새로 직접 골라 주문할게요
          </button>
        </div>
      </div>
    </div>
  );
};
