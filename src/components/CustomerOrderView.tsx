import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { OrderItem, PreviousOrderProfile, Order } from '../types';
import { AddressSearchModal } from './AddressSearchModal';
import { PreviousOrderModal } from './PreviousOrderModal';
import { PhoneLookupModal } from './PhoneLookupModal';
import { 
  ArrowLeft, Plus, Minus, CheckCircle2, RotateCcw, 
  MapPin, Phone, User, MessageSquare, Share2, Copy, Check, Clock, AlertTriangle, ChevronRight, Sparkles 
} from 'lucide-react';

export const CustomerOrderView: React.FC = () => {
  const {
    currentStore,
    createOrder,
    previousOrder,
    savePreviousOrderProfile,
    findPreviousOrderByPhone,
    setActiveView,
  } = useStore();

  // Selected quantities for products in current store: { productId: quantity }
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [step, setStep] = useState<'select' | 'info' | 'completed'>('select');

  // Address search modal
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  // Previous order modal prompt (used if personalized link is opened)
  const [isPrevOrderModalOpen, setIsPrevOrderModalOpen] = useState(false);
  const [isPhoneLookupModalOpen, setIsPhoneLookupModalOpen] = useState(false);
  const [hasPromptedPrevOrder, setHasPromptedPrevOrder] = useState(false);

  // Customer delivery form fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [deliveryRequest, setDeliveryRequest] = useState('문 앞에 놓아주세요.');

  // Phone lookup states for realistic frictionless reordering
  const [matchedPreviousOrder, setMatchedPreviousOrder] = useState<Order | null>(null);
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  // Completed order state
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Initialize initial default quantity for 1st available product
  useEffect(() => {
    if (currentStore && currentStore.products.length > 0) {
      const initial: Record<string, number> = {};
      currentStore.products.forEach((p, idx) => {
        initial[p.id] = idx === 0 ? 1 : 0;
      });
      setQuantities(initial);
    }
  }, [currentStore.id]);

  // Only show modal prompt if customer opened a personalized re-order link (?c=01012345678 or ?ref=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refCustomer = params.get('c') || params.get('phone') || params.get('ref');
      if (refCustomer && currentStore.isOrderActive && !hasPromptedPrevOrder) {
        const found = findPreviousOrderByPhone(refCustomer);
        if (found) {
          setIsPrevOrderModalOpen(true);
          setHasPromptedPrevOrder(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentStore.isOrderActive, hasPromptedPrevOrder, findPreviousOrderByPhone]);

  const handleQtyChange = (productId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleApplyPreviousOrder = (prev: PreviousOrderProfile) => {
    // Fill customer info
    setCustomerName(prev.customerName);
    setPhone(prev.phone);
    setAddress(prev.address);
    setDetailAddress(prev.detailAddress);
    setDeliveryRequest(prev.deliveryRequest || '문 앞에 놓아주세요.');

    // Map quantities
    const newQty: Record<string, number> = {};
    currentStore.products.forEach((p) => {
      newQty[p.id] = 0;
    });
    prev.items.forEach((it) => {
      newQty[it.productId] = it.quantity;
    });
    setQuantities(newQty);
    setIsPrevOrderModalOpen(false);

    // Direct transition to info review step!
    setStep('info');
  };

  const handleApplyOrderByPhone = (matched: Order) => {
    setCustomerName(matched.customerName);
    setPhone(matched.phone);
    setAddress(matched.address);
    setDetailAddress(matched.detailAddress || '');
    if (matched.deliveryRequest) {
      setDeliveryRequest(matched.deliveryRequest);
    }
    setMatchedPreviousOrder(matched);
    setIsAutoFilled(true);
  };

  // Compute selected items
  const selectedItems: OrderItem[] = currentStore.products
    .filter((p) => (quantities[p.id] || 0) > 0)
    .map((p) => ({
      productId: p.id,
      productName: p.name,
      price: p.price,
      unit: p.unit,
      emoji: p.emoji,
      quantity: quantities[p.id] || 0,
    }));

  const totalAmount = selectedItems.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );
  const totalUnits = selectedItems.reduce((sum, it) => sum + it.quantity, 0);

  // Phone auto format (010-XXXX-XXXX) & returning customer instant detection
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    let formatted = raw;
    if (raw.length > 3 && raw.length <= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else if (raw.length > 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    }
    setPhone(formatted);

    // When phone number is complete (10-11 digits), automatically check past orders
    if (raw.length >= 10) {
      const found = findPreviousOrderByPhone(raw);
      if (found) {
        setMatchedPreviousOrder(found);
      } else {
        setMatchedPreviousOrder(null);
        setIsAutoFilled(false);
      }
    } else {
      setMatchedPreviousOrder(null);
      setIsAutoFilled(false);
    }
  };

  const handleProceedToInfo = () => {
    if (totalUnits === 0) {
      alert('상품 수량을 최소 1개 이상 선택해 주세요.');
      return;
    }

    // Pre-populate if customer info already in memory
    if (previousOrder && !customerName) {
      setCustomerName(previousOrder.customerName);
      setPhone(previousOrder.phone);
      setAddress(previousOrder.address);
      setDetailAddress(previousOrder.detailAddress);
      setDeliveryRequest(previousOrder.deliveryRequest);
    }

    setStep('info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('받는 분 성함을 입력해 주세요.');
      return;
    }
    if (!phone.trim()) {
      alert('전화번호를 입력해 주세요.');
      return;
    }
    if (!address.trim()) {
      alert('주소를 입력해 주세요.');
      return;
    }

    const order = createOrder({
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      detailAddress: detailAddress.trim(),
      deliveryRequest: deliveryRequest.trim(),
      items: selectedItems,
    });

    setCompletedOrder(order);
    setStep('completed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShareKakao = () => {
    if (!completedOrder) return;
    const text = `[${currentStore.shortName} 주문접수 완료]\n주문번호: #${completedOrder.orderNumber}\n받는분: ${completedOrder.customerName}\n상품: ${completedOrder.items.map((i) => `${i.productName} ${i.quantity}${i.unit}`).join(', ')}\n총 금액: ${completedOrder.totalAmount.toLocaleString()}원\n\n입금계좌: ${currentStore.bankName} ${currentStore.bankAccount} (${currentStore.bankHolder})`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(`${currentStore.bankName} ${currentStore.bankAccount} ${currentStore.bankHolder}`);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleResetOrder = () => {
    const initial: Record<string, number> = {};
    currentStore.products.forEach((p, idx) => {
      initial[p.id] = idx === 0 ? 1 : 0;
    });
    setQuantities(initial);
    setCompletedOrder(null);
    setStep('select');
  };

  // 13. "오늘 주문받기" OFF SCREEN
  if (!currentStore.isOrderActive) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl text-center border border-stone-200" id="order-closed-view">
          <div className="w-16 h-16 bg-stone-100 text-stone-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            {currentStore.emoji}
          </div>
          <h2 className="text-2xl font-black text-stone-900 mb-2">
            현재 주문을 받고 있지 않습니다.
          </h2>
          <p className="text-stone-600 text-base leading-relaxed mb-6">
            오늘 준비된 수량이 모두 소진되었거나<br />
            당일 주문 접수가 마감되었습니다.
          </p>

          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-left text-sm space-y-2 mb-6">
            <div className="font-bold text-stone-900 flex items-center gap-1.5">
              <span>{currentStore.emoji}</span> {currentStore.name}
            </div>
            <div className="text-stone-600 text-xs">
              다음 판매 일정 또는 주문 문의는 아래 연락처로 문의해 주시기 바랍니다.
            </div>
            <div className="pt-2 flex items-center justify-between font-semibold text-stone-800 border-t border-stone-200 text-xs">
              <span>농장/판매자 직통전화</span>
              <a href={`tel:${currentStore.ownerPhone}`} className="text-orange-600 font-bold underline">
                {currentStore.ownerPhone}
              </a>
            </div>
          </div>

          <p className="text-xs text-stone-400">
            주문이 다시 열리면 카카오톡 링크로 주문하실 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-white flex flex-col items-center justify-start text-stone-900">
      {/* Container simulating high-fidelity mobile Kakao browser / app screen */}
      <div className="w-full sm:max-w-md mx-auto bg-white min-h-screen shadow-none sm:shadow-lg flex flex-col relative overflow-x-hidden" id="customer-order-container">
        
        {/* Top Header Bar */}
        <header className="w-full px-4 py-3 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-30 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{currentStore.emoji}</span>
            <span className="text-sm sm:text-base font-extrabold text-stone-900 tracking-tight truncate max-w-[200px]">{currentStore.shortName}</span>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            주문접수중
          </span>
        </header>

        {/* STEP 1: PRODUCT SELECTION SCREEN */}
        {step === 'select' && (
          <div className="flex-1 flex flex-col w-full animate-in fade-in duration-200" id="step-product-select">
            {/* Store Intro Banner */}
            <div className="w-full px-4 py-5 sm:p-6 text-center border-b border-stone-100 bg-gradient-to-b from-orange-50/40 to-transparent">
              <div className="text-4xl mb-2">{currentStore.emoji}</div>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 mb-1">
                {currentStore.shortName}
              </h1>
              <p className="text-sm sm:text-base font-bold text-orange-600 mb-2 break-keep">
                {currentStore.intro.replace(/🥕/g, '').trim()}
              </p>
              {currentStore.notice && (
                <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed break-keep">
                  {currentStore.notice}
                </p>
              )}
            </div>

            {/* Phone Lookup & Previous Order Banner (Persistent across sessions/months) */}
            <div className="mx-3.5 sm:mx-4 my-3 p-3 sm:p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-xs gap-2">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-amber-950">
                    전화번호로 이전 배송지 찾기
                  </p>
                  <p className="text-xs text-amber-800 truncate font-medium">
                    몇 달 전 주문 주소도 번호만 입력하면 1초 만에 자동 완성!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPhoneLookupModalOpen(true)}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-black rounded-xl shrink-0 transition shadow-xs active:scale-95"
                id="open-phone-lookup-btn"
              >
                주소 찾기
              </button>
            </div>

            {/* Products List (Exact ASCII Mockup style) */}
            <div className="p-3.5 sm:p-5 flex-1 space-y-3.5 sm:space-y-4 w-full">
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                상품 및 수량 선택
              </div>

              {currentStore.products.map((product) => {
                const qty = quantities[product.id] || 0;
                return (
                  <div
                    key={product.id}
                    className={`p-4 rounded-2xl border-2 transition ${
                      qty > 0
                        ? 'border-orange-500 bg-orange-50/30'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                    id={`product-card-${product.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-black text-stone-900">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-xs text-stone-500 mt-0.5 leading-snug">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                      <div className="text-lg font-black text-stone-900">
                        {product.price.toLocaleString()}원
                        <span className="text-xs font-normal text-stone-400 ml-1">/ {product.unit}</span>
                      </div>

                      {/* [-] [count] [+] Controller */}
                      <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-200">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(product.id, -1)}
                          disabled={qty === 0}
                          className="w-9 h-9 flex items-center justify-center bg-white rounded-lg text-stone-700 font-bold shadow-xs hover:bg-stone-50 disabled:opacity-30 disabled:hover:bg-white active:scale-95 transition"
                          id={`minus-btn-${product.id}`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <span className="w-11 text-center font-black text-base text-stone-900" id={`qty-label-${product.id}`}>
                          {qty}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleQtyChange(product.id, 1)}
                          className="w-9 h-9 flex items-center justify-center bg-white rounded-lg text-orange-600 font-bold shadow-xs hover:bg-orange-50 active:scale-95 transition"
                          id={`plus-btn-${product.id}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Fixed Action Bar: 총 금액 & [주문하기] */}
            <div className="sticky bottom-0 w-full p-3.5 sm:p-4 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-xl z-20">
              <div className="flex justify-between items-center mb-2.5 sm:mb-3 px-1">
                <span className="text-sm font-semibold text-stone-500">
                  선택 {totalUnits}개
                </span>
                <div className="text-right">
                  <span className="text-xs text-stone-400 mr-1">총</span>
                  <span className="text-xl sm:text-2xl font-black text-orange-600 tracking-tight" id="total-price-label">
                    {totalAmount.toLocaleString()}원
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedToInfo}
                disabled={totalUnits === 0}
                className="w-full py-3.5 sm:py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-black text-base sm:text-lg rounded-2xl shadow-lg shadow-orange-600/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
                id="proceed-to-order-btn"
              >
                <span>[ 주문하기 ]</span>
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="text-center mt-2">
                <span className="text-[11px] text-stone-400 font-medium">
                  회원가입 없음 · 카톡에서 간편 주문
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ORDER INFORMATION INPUT (배송 정보 입력 화면) */}
        {step === 'info' && (
          <form onSubmit={handleCompleteOrder} className="flex-1 flex flex-col w-full animate-in fade-in duration-200" id="step-order-info">
            {/* Back button header */}
            <div className="w-full px-4 sm:px-5 py-3.5 sm:py-4 border-b border-stone-200 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="p-1.5 -ml-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full transition"
                id="back-to-products-btn"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-black text-stone-900">
                주문정보 입력
              </h2>
            </div>

            <div className="p-5 flex-1 space-y-4">
              {/* Recipient Name */}
              <div>
                <label className="block text-sm font-black text-stone-800 mb-1.5">
                  받는 분 <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="홍길동"
                  required
                  className="w-full px-4 py-3.5 bg-stone-100 border border-stone-200 rounded-2xl text-base font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  id="customer-name-input"
                />
              </div>

              {/* Phone */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-black text-stone-800">
                    전화번호 <span className="text-orange-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPhoneLookupModalOpen(true)}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                    id="trigger-lookup-phone-step2-btn"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>이전 주소 찾기</span>
                  </button>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="010-1234-5678"
                  required
                  className="w-full px-4 py-3.5 bg-stone-100 border border-stone-200 rounded-2xl text-base font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white tracking-wide"
                  id="customer-phone-input"
                />

                {/* Returning customer prompt when matching phone number is recognized */}
                {matchedPreviousOrder && (
                  <div className="mt-2.5 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300/90 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200 shadow-xs">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                          <span>✨</span>
                          <span>{matchedPreviousOrder.customerName} 고객님의 이전 배송지가 있습니다!</span>
                        </span>
                        <p className="text-xs text-stone-700 mt-1 font-medium">
                          📍 {matchedPreviousOrder.address} {matchedPreviousOrder.detailAddress}
                        </p>
                      </div>
                      {isAutoFilled && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-md shrink-0 border border-emerald-300">
                          적용완료
                        </span>
                      )}
                    </div>

                    {!isAutoFilled ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!customerName.trim()) setCustomerName(matchedPreviousOrder.customerName);
                          setAddress(matchedPreviousOrder.address);
                          setDetailAddress(matchedPreviousOrder.detailAddress);
                          if (matchedPreviousOrder.deliveryRequest) {
                            setDeliveryRequest(matchedPreviousOrder.deliveryRequest);
                          }
                          setIsAutoFilled(true);
                        }}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                        id="autofill-previous-address-btn"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>지난번 주소로 한 번에 채우기</span>
                      </button>
                    ) : (
                      <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <span>✓</span>
                        <span>지난번 배송지가 자동으로 입력되었습니다. (필요 시 아래에서 수정 가능)</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Address with Daum-style Address Search */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-black text-stone-800">
                    주소 <span className="text-orange-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-xs"
                    id="open-address-modal-btn"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>[ 주소 검색 ]</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="주소 검색 버튼을 눌러주세요"
                  required
                  className="w-full px-4 py-3.5 bg-stone-100 border border-stone-200 rounded-2xl text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white mb-2"
                  id="customer-address-input"
                />

                <input
                  type="text"
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  placeholder="상세주소 (예: 101동 302호)"
                  className="w-full px-4 py-3.5 bg-stone-100 border border-stone-200 rounded-2xl text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  id="customer-detail-address-input"
                />
              </div>

              {/* Delivery Memo */}
              <div>
                <label className="block text-sm font-black text-stone-800 mb-1.5">
                  배송 요청사항
                </label>
                <input
                  type="text"
                  value={deliveryRequest}
                  onChange={(e) => setDeliveryRequest(e.target.value)}
                  placeholder="예) 문 앞에 놓아주세요"
                  className="w-full px-4 py-3.5 bg-stone-100 border border-stone-200 rounded-2xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  id="customer-memo-input"
                />
                {/* Quick memo chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    '문 앞에 놓아주세요',
                    '경비실에 맡겨주세요',
                    '배송 전 연락바랍니다',
                    '택배함에 넣어주세요',
                  ].map((memo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDeliveryRequest(memo)}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-xs transition"
                    >
                      {memo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Summary box */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 mt-4 space-y-2">
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                  주문 내역 확인
                </div>
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-stone-800">
                      {(item.emoji && item.emoji !== '🥕') ? item.emoji : '📦'} {item.productName}
                    </span>
                    <span className="font-bold text-stone-900">
                      {item.quantity}{item.unit}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-stone-200 flex justify-between items-center font-black text-base text-stone-900">
                  <span>총 주문금액</span>
                  <span className="text-xl text-orange-600">{totalAmount.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            {/* Bottom Complete Button */}
            <div className="sticky bottom-0 w-full p-3.5 sm:p-4 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-xl z-20">
              <button
                type="submit"
                className="w-full py-3.5 sm:py-4 bg-orange-600 hover:bg-orange-700 text-white font-black text-lg sm:text-xl rounded-2xl shadow-lg shadow-orange-600/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
                id="submit-order-complete-btn"
              >
                <span>[ 주문 완료 ]</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: ORDER COMPLETED SCREEN (주문 완료 화면) */}
        {step === 'completed' && completedOrder && (
          <div className="flex-1 flex flex-col p-4 sm:p-6 w-full animate-in zoom-in-95 duration-200 text-center" id="step-order-completed">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-black text-stone-900 mb-2">
              🎉 주문이 접수되었습니다.
            </h2>
            <p className="text-sm font-semibold text-stone-500 mb-6">
              판매자({currentStore.shortName})에게 주문이 정상 전달되었습니다.
            </p>

            {/* Receipt Card */}
            <div className="bg-stone-50 border-2 border-stone-200 rounded-3xl p-5 text-left space-y-4 mb-6 shadow-xs">
              {/* Product items */}
              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  주문 상품
                </span>
                {completedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-base font-extrabold text-stone-900 py-0.5">
                    <span>{(it.emoji && it.emoji !== '🥕') ? it.emoji : '📦'} {it.productName}</span>
                    <span className="text-orange-600 font-black">{it.quantity}{it.unit}</span>
                  </div>
                ))}
              </div>

              {/* Recipient */}
              <div className="pt-3 border-t border-stone-200">
                <div className="flex justify-between text-sm py-0.5">
                  <span className="text-stone-500 font-medium">받는 분</span>
                  <span className="font-bold text-stone-900">{completedOrder.customerName}</span>
                </div>
                <div className="flex justify-between text-sm py-0.5">
                  <span className="text-stone-500 font-medium">연락처</span>
                  <span className="font-bold text-stone-900">{completedOrder.phone}</span>
                </div>
                <div className="text-sm py-0.5">
                  <span className="text-stone-500 font-medium block">배송지</span>
                  <span className="font-semibold text-stone-900 leading-snug">
                    {completedOrder.address} {completedOrder.detailAddress}
                  </span>
                </div>
                {completedOrder.deliveryRequest && (
                  <div className="text-xs text-stone-500 pt-1">
                    요청: {completedOrder.deliveryRequest}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="pt-3 border-t border-stone-200 flex justify-between items-center font-black text-lg text-stone-900">
                <span>입금 예정금액</span>
                <span className="text-2xl text-orange-600">{completedOrder.totalAmount.toLocaleString()}원</span>
              </div>

              {/* Bank Deposit Info */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                <span className="text-xs font-bold text-amber-900 block mb-1">
                  💰 입금 계좌 안내
                </span>
                <p className="text-base font-black text-amber-950">
                  {currentStore.bankName} {currentStore.bankAccount}
                </p>
                <div className="flex items-center justify-between mt-1 text-xs text-amber-800">
                  <span>예금주: {currentStore.bankHolder}</span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="px-2 py-1 bg-amber-200 hover:bg-amber-300 font-bold rounded text-amber-900 transition flex items-center gap-1"
                    id="copy-bank-account-btn"
                  >
                    {copiedAccount ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedAccount ? '복사완료' : '계좌복사'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action buttons: [주문내역 확인] [카카오톡으로 공유] */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleShareKakao}
                className="w-full py-3.5 px-4 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-black rounded-2xl text-base shadow-sm active:scale-[0.98] transition flex items-center justify-center gap-2"
                id="share-kakao-btn"
              >
                <Share2 className="w-5 h-5" />
                <span>{copiedShare ? '주문내역이 복사되었습니다!' : '[ 카카오톡으로 공유 ]'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetOrder}
                className="w-full py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-2xl text-sm transition"
                id="new-order-restart-btn"
              >
                새로운 추가 주문하기
              </button>
            </div>
          </div>
        )}

        {/* Footer info & discreet Boss portal link */}
        <footer className="mt-auto pt-6 pb-4 px-4 text-center border-t border-stone-100 space-y-1.5 text-stone-400 text-xs">
          <p className="font-medium text-stone-500">{currentStore.name} 직거래 주문 시스템</p>
          <div className="flex items-center justify-center gap-3 text-[11px]">
            <span>문의: {currentStore.ownerPhone}</span>
            <span>·</span>
            <button
              type="button"
              onClick={() => setActiveView('boss')}
              className="text-stone-400 hover:text-stone-600 underline cursor-pointer"
              id="switch-to-boss-footer-btn"
            >
              사장님 관리자
            </button>
          </div>
        </footer>
      </div>

      {/* Address Search Modal */}
      <AddressSearchModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        initialQuery={address}
        onSelectAddress={(road) => {
          setAddress(road);
        }}
      />

      {/* Phone Number Previous Order Lookup Modal */}
      <PhoneLookupModal
        isOpen={isPhoneLookupModalOpen}
        onClose={() => setIsPhoneLookupModalOpen(false)}
        onSelectOrder={handleApplyOrderByPhone}
      />

      {/* Previous Order Prompt Modal */}
      {previousOrder && (
        <PreviousOrderModal
          isOpen={isPrevOrderModalOpen}
          onClose={() => setIsPrevOrderModalOpen(false)}
          previousOrder={previousOrder}
          currentStore={currentStore}
          onApplyPreviousOrder={handleApplyPreviousOrder}
        />
      )}
    </div>
  );
};
