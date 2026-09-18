import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { Phone, Copy, Check, X, Truck, Package, MapPin, AlertCircle, Share2 } from 'lucide-react';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!isOpen || !order) return null;

  const fullAddress = `${order.address} ${order.detailAddress || ''}`.trim();

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(fullAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyOrderSummary = () => {
    const text = `[주문정보]\n고객: ${order.customerName}\n연락처: ${order.phone}\n주소: ${fullAddress}\n상품: ${order.items.map((i) => `${i.productName} ${i.quantity}${i.unit}`).join(', ')}\n요청사항: ${order.deliveryRequest || '없음'}`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const statusList: { key: OrderStatus; label: string; activeColor: string; badgeColor: string; description: string }[] = [
    { key: 'new', label: '신규접수', activeColor: 'bg-amber-500 text-white ring-2 ring-amber-400/50 shadow-md', badgeColor: 'bg-amber-100 text-amber-900 border-amber-300', description: '입금 및 주문 확인 단계' },
    { key: 'preparing', label: '준비중', activeColor: 'bg-blue-600 text-white ring-2 ring-blue-400/50 shadow-md', badgeColor: 'bg-blue-100 text-blue-900 border-blue-300', description: '포장 및 택배 박스 작업 중' },
    { key: 'shipped', label: '출고완료', activeColor: 'bg-emerald-600 text-white ring-2 ring-emerald-400/50 shadow-md', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300', description: '택배 인계 및 발송 완료' },
    { key: 'cancelled', label: '취소', activeColor: 'bg-stone-600 text-white ring-2 ring-stone-400/50 shadow-md', badgeColor: 'bg-stone-100 text-stone-700 border-stone-300', description: '주문 취소 또는 반품' },
  ];

  const currentStatusConfig = statusList.find((s) => s.key === order.status) || statusList[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card - Mobile Bottom Sheet Style on Small Screens */}
      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border-t sm:border border-stone-200 animate-in slide-in-from-bottom duration-200"
        id="order-detail-modal"
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-3 sm:hidden" />

        {/* 1. Header: Customer Name & Close Button */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                {order.customerName}
              </h2>
              <span className={`text-xs px-2.5 py-0.5 font-black rounded-full border transition-all duration-200 ${currentStatusConfig.badgeColor}`}>
                {currentStatusConfig.label}
              </span>
              <span className="text-xs px-2 py-0.5 font-bold rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                {new Date(order.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} 접수
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {new Date(order.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition"
            id="close-order-detail-btn"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 2. Scrollable Body: Clean & Focused for Mobile */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          
          {/* Card 1: Ordered Items (Most Important for Packing) */}
          <div className="bg-orange-50/80 border-2 border-orange-200 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-orange-200/70">
              <span className="text-xs font-black text-orange-900 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-orange-600" />
                보낼 상품 ({order.totalUnits}박스)
              </span>
              <span className="text-base font-black text-orange-700">
                {order.totalAmount.toLocaleString()}원
              </span>
            </div>

            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-base">
                  <span className="font-extrabold text-stone-900">
                    {item.productName}
                  </span>
                  <span className="text-xl font-black text-orange-600">
                    {item.quantity}{item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Recipient Phone & Quick Call Button */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-stone-400 block">연락처</span>
              <span className="text-xl font-black text-stone-900 tracking-wide">
                {order.phone}
              </span>
            </div>

            <a
              href={`tel:${order.phone.replace(/[^0-9]/g, '')}`}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition shrink-0"
              id="call-customer-btn"
            >
              <Phone className="w-4 h-4" />
              <span>전화걸기</span>
            </a>
          </div>

          {/* Card 3: Delivery Address & Quick Copy */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-500" />
                배송 주소
              </span>
              <button
                onClick={handleCopyAddress}
                className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-lg transition flex items-center gap-1"
                id="copy-address-btn"
              >
                {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAddress ? '복사됨' : '주소복사'}</span>
              </button>
            </div>

            <div>
              <p className="text-base font-black text-stone-900 leading-snug">
                {order.address}
              </p>
              {order.detailAddress && (
                <p className="text-base font-bold text-stone-700 mt-0.5">
                  {order.detailAddress}
                </p>
              )}
            </div>

            {/* Delivery memo */}
            {order.deliveryRequest && (
              <div className="pt-2 border-t border-stone-200 text-xs text-stone-600 flex items-start gap-1">
                <span className="font-bold text-stone-800 shrink-0">요청:</span>
                <span>{order.deliveryRequest}</span>
              </div>
            )}
          </div>

          {/* Card 4: Status Selector Segment (4 buttons) with vivid indicator */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-700">
                주문 진행 상태 변경
              </span>
              <span className="text-[11px] text-stone-500">
                현재 상태: <b className="text-stone-800">{currentStatusConfig.label}</b>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 bg-stone-200/80 p-1.5 rounded-2xl border border-stone-300/80">
              {statusList.map((st) => {
                const isSelected = order.status === st.key;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => onUpdateStatus(order.id, st.key)}
                    className={`py-2.5 px-1 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 relative active:scale-95 ${
                      isSelected
                        ? `${st.activeColor} scale-[1.03] z-10`
                        : 'bg-white/70 hover:bg-white text-stone-600 shadow-2xs'
                    }`}
                    id={`modal-status-btn-${st.key}`}
                  >
                    <div className="flex items-center gap-1">
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      <span>{st.label}</span>
                    </div>
                    {isSelected && (
                      <span className="w-1 h-1 rounded-full bg-white/90 animate-pulse mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-stone-500 text-center pt-0.5">
              {currentStatusConfig.description}
            </p>
          </div>
        </div>

        {/* 3. Bottom Sticky Action Area */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-stretch gap-2 min-h-[76px]">
          {order.status !== 'shipped' ? (
            <button
              onClick={() => {
                onUpdateStatus(order.id, 'shipped');
                onClose();
              }}
              className="flex-1 min-h-[52px] py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-black text-base rounded-2xl shadow-md active:scale-98 transition flex items-center justify-center gap-2"
              id="confirm-shipped-big-btn"
            >
              <Truck className="w-5 h-5" />
              <span>[ 출고 완료 ]</span>
            </button>
          ) : (
            <div className="flex-1 min-h-[52px] py-3.5 px-4 bg-emerald-50 border-2 border-emerald-500 text-emerald-800 font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-xs">
              <Check className="w-5 h-5 stroke-[3] text-emerald-600" />
              <span>출고 완료된 주문</span>
            </div>
          )}

          <button
            onClick={handleCopyOrderSummary}
            className="min-h-[52px] py-3.5 px-4 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs rounded-2xl transition shrink-0 flex items-center justify-center"
            title="문자 발송용 주문요약 복사"
            id="copy-all-info-btn"
          >
            {copiedAll ? '복사됨' : '전체복사'}
          </button>
        </div>
      </div>
    </div>
  );
};
