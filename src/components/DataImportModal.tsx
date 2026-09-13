import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';
import { 
  FileSpreadsheet, MessageSquare, Upload, Check, X, 
  AlertCircle, Sparkles, Plus, Copy, FileText, ArrowRight,
  Edit3, Phone, MapPin, Package, UserCheck, ShieldAlert
} from 'lucide-react';
import { parseKoreanOrderText, ExtractedOrderInfo } from '../utils/koreanOrderParser';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({ isOpen, onClose }) => {
  const { currentStore, importOrders, orders } = useStore();
  const [activeTab, setActiveTab] = useState<'text' | 'csv'>('text');

  // Text parser state
  const [rawText, setRawText] = useState('');
  const [editableOrder, setEditableOrder] = useState<ExtractedOrderInfo | null>(null);
  const [parsingError, setParsingError] = useState('');
  const [isManualEditing, setIsManualEditing] = useState(false);

  if (!isOpen) return null;

  const handleApplySample = (sample: string) => {
    setRawText(sample);
    processText(sample);
  };

  const processText = (text: string) => {
    setParsingError('');
    if (!text.trim()) {
      setEditableOrder(null);
      return;
    }

    try {
      const extracted = parseKoreanOrderText(
        text,
        orders,
        currentStore.products || []
      );
      setEditableOrder(extracted);
    } catch (err: any) {
      console.error(err);
      setParsingError('텍스트 형식을 분석하는 중 오류가 발생했습니다.');
    }
  };

  // CSV / Sample File Import Handler
  const handleImportSampleCSV = () => {
    const defaultProduct = currentStore.products[0] || {
      id: 'p-1',
      name: '대표 상품',
      price: 30000,
      unit: '박스',
    };

    const nextNumber = orders.length > 0 ? Math.max(...orders.map((o) => o.orderNumber)) + 1 : 1001;

    const sampleOrders: Order[] = [
      {
        id: `ord-ext-${Date.now()}-1`,
        orderNumber: nextNumber,
        storeId: currentStore.id,
        createdAt: new Date().toISOString(),
        customerName: '이영희',
        phone: '010-3344-5566',
        address: '경기도 성남시 분당구 판교역로 166',
        detailAddress: '카카오아지트 8층',
        deliveryRequest: '부재 시 경비실에 맡겨주세요',
        items: [
          {
            productId: defaultProduct.id,
            productName: defaultProduct.name,
            price: defaultProduct.price,
            unit: defaultProduct.unit,
            quantity: 2,
          },
        ],
        totalAmount: defaultProduct.price * 2,
        totalUnits: 2,
        status: 'new',
      },
      {
        id: `ord-ext-${Date.now()}-2`,
        orderNumber: nextNumber + 1,
        storeId: currentStore.id,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        customerName: '박찬호',
        phone: '010-7788-9900',
        address: '대전광역시 유성구 대학로 291',
        detailAddress: '공학동 201호',
        deliveryRequest: '도착 전 문자 부탁드립니다',
        items: [
          {
            productId: defaultProduct.id,
            productName: defaultProduct.name,
            price: defaultProduct.price,
            unit: defaultProduct.unit,
            quantity: 1,
          },
        ],
        totalAmount: defaultProduct.price * 1,
        totalUnits: 1,
        status: 'new',
      },
      {
        id: `ord-ext-${Date.now()}-3`,
        orderNumber: nextNumber + 2,
        storeId: currentStore.id,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        customerName: '정미경',
        phone: '010-4455-6677',
        address: '부산광역시 해운대구 마린시티2로 33',
        detailAddress: '102동 1502호',
        deliveryRequest: '문 앞 배송 부탁드립니다',
        items: [
          {
            productId: defaultProduct.id,
            productName: defaultProduct.name,
            price: defaultProduct.price,
            unit: defaultProduct.unit,
            quantity: 3,
          },
        ],
        totalAmount: defaultProduct.price * 3,
        totalUnits: 3,
        status: 'new',
      },
    ];

    importOrders(sampleOrders);
    alert(`외부 엑셀 데이터 3건이 주문 목록에 정상 등록되었습니다!`);
    onClose();
  };

  // Register parsed order
  const handleRegisterParsedOrder = () => {
    if (!editableOrder) return;

    if (!editableOrder.customerName.trim()) {
      alert('받는 분 성함을 입력해주세요.');
      return;
    }

    const nextNumber = orders.length > 0 ? Math.max(...orders.map((o) => o.orderNumber)) + 1 : 1001;

    // Find or create product
    const existingProd = currentStore.products.find(
      (p) => p.name.trim().toLowerCase() === editableOrder.productName.trim().toLowerCase()
    );

    const productId = existingProd ? existingProd.id : `prod-custom-${Date.now()}`;
    const unitPrice = editableOrder.unitPrice > 0 
      ? editableOrder.unitPrice 
      : (existingProd?.price || 30000);
    const quantity = Math.max(1, editableOrder.quantity);

    const fullOrder: Order = {
      id: `ord-text-${Date.now()}`,
      orderNumber: nextNumber,
      storeId: currentStore.id,
      createdAt: new Date().toISOString(),
      customerName: editableOrder.customerName.trim(),
      phone: editableOrder.phone.trim() || '010-0000-0000',
      address: editableOrder.address.trim() || '주소 미기재 (단골 고객 확인 필요)',
      detailAddress: editableOrder.detailAddress.trim(),
      deliveryRequest: editableOrder.deliveryRequest.trim() || '배송 전 연락 바랍니다.',
      items: [
        {
          productId,
          productName: editableOrder.productName.trim() || '농산물',
          price: unitPrice,
          unit: editableOrder.unit || '박스',
          quantity,
          emoji: '📦',
        },
      ],
      totalAmount: editableOrder.totalAmount > 0 ? editableOrder.totalAmount : unitPrice * quantity,
      totalUnits: quantity,
      status: 'new',
    };

    importOrders([fullOrder]);
    alert(`[${fullOrder.customerName}]님의 주문이 관리자 주문 목록에 즉시 등록되었습니다!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-stone-200 animate-in zoom-in-95 duration-200 my-auto"
        id="data-import-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-800 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-600/30 border border-orange-500/40 rounded-xl text-orange-400">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight">
                문자/카톡 주문 스마트 등록
              </h3>
              <p className="text-[11px] text-stone-400">
                손님이 보낸 문자를 복사해서 붙여넣으면 성함·주소·품목을 자동 추출합니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-700/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2.5 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-t-xl transition border-t-2 border-x ${
              activeTab === 'text'
                ? 'bg-white text-stone-900 border-t-orange-500 border-stone-200 shadow-xs'
                : 'text-stone-500 border-transparent hover:text-stone-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
            <span>문자/카톡 복사·붙여넣기</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-t-xl transition border-t-2 border-x ${
              activeTab === 'csv'
                ? 'bg-white text-stone-900 border-t-orange-500 border-stone-200 shadow-xs'
                : 'text-stone-500 border-transparent hover:text-stone-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>엑셀/CSV 일괄 등록</span>
          </button>
        </div>

        {/* Tab 1: Smart Text Parser */}
        {activeTab === 'text' && (
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            {/* Quick Helper Samples */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-stone-700 flex items-center gap-1.5">
                <span>받으신 문자/카톡 내용을 그대로 붙여넣으세요:</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplySample('안녕하세요~함덕 라플라주입니다~감귤2박스 배송부탁드려요')}
                  className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200"
                >
                  감귤 2박스 예시
                </button>
              </div>
            </div>

            {/* Input Text Area */}
            <div className="relative">
              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  processText(e.target.value);
                }}
                placeholder="예: 안녕하세요~함덕 라플라주입니다~감귤2박스 배송부탁드려요&#10;또는: 김철수 010-1234-5678 제주시 애월읍 애월로 10 사과 2박스 입금완료"
                rows={3}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-2xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition leading-relaxed placeholder:text-stone-400"
                id="raw-order-text-input"
              />
              {rawText && (
                <button
                  type="button"
                  onClick={() => {
                    setRawText('');
                    setEditableOrder(null);
                  }}
                  className="absolute right-2.5 top-2.5 p-1 text-stone-400 hover:text-stone-700 bg-stone-200/60 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Smart Parsed & Editable Preview Card */}
            {editableOrder && (
              <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 border-2 border-orange-300 rounded-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-orange-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-stone-900">
                      AI 주문 정보 자동 분석 결과
                    </span>
                    <span className="text-[10px] font-bold text-orange-700 bg-white border border-orange-200 px-2 py-0.5 rounded-full">
                      클릭하여 수정 가능
                    </span>
                  </div>

                  {editableOrder.matchedFromHistory && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-700" />
                      <span>단골 고객({editableOrder.matchedFromHistory.previousOrder.customerName}) DB 주소 연동됨</span>
                    </span>
                  )}
                </div>

                {/* Editable Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {/* Customer Name */}
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200 focus-within:border-orange-500 shadow-2xs">
                    <label className="text-[10px] text-stone-500 font-bold block mb-0.5">
                      받는 분 (성함/상호명) *
                    </label>
                    <input
                      type="text"
                      value={editableOrder.customerName}
                      onChange={(e) =>
                        setEditableOrder({ ...editableOrder, customerName: e.target.value })
                      }
                      placeholder="성함 또는 상호명"
                      className="w-full font-black text-stone-900 text-xs focus:outline-none bg-transparent"
                    />
                  </div>

                  {/* Phone */}
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200 focus-within:border-orange-500 shadow-2xs">
                    <label className="text-[10px] text-stone-500 font-bold block mb-0.5">
                      전화번호 {editableOrder.phone ? '' : '(문자 수신 번호 입력)'}
                    </label>
                    <input
                      type="text"
                      value={editableOrder.phone}
                      onChange={(e) =>
                        setEditableOrder({ ...editableOrder, phone: e.target.value })
                      }
                      placeholder="010-0000-0000"
                      className="w-full font-bold text-stone-900 text-xs focus:outline-none bg-transparent"
                    />
                  </div>

                  {/* Delivery Address */}
                  <div className="sm:col-span-2 bg-white p-2.5 rounded-xl border border-stone-200 focus-within:border-orange-500 shadow-2xs">
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] text-stone-500 font-bold block">
                        배송지 주소
                      </label>
                      {!editableOrder.address && (
                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          문자에 주소 미기재 (단골 또는 추후 확인)
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editableOrder.address}
                      onChange={(e) =>
                        setEditableOrder({ ...editableOrder, address: e.target.value })
                      }
                      placeholder="기존 단골 주소 또는 주소를 입력해주세요"
                      className="w-full font-bold text-stone-900 text-xs focus:outline-none bg-transparent"
                    />
                  </div>

                  {/* Product & Quantity */}
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200 focus-within:border-orange-500 shadow-2xs">
                    <label className="text-[10px] text-stone-500 font-bold block mb-0.5">
                      주문 상품명 *
                    </label>
                    <input
                      type="text"
                      value={editableOrder.productName}
                      onChange={(e) =>
                        setEditableOrder({ ...editableOrder, productName: e.target.value })
                      }
                      placeholder="상품명 (예: 감귤, 당근 등)"
                      className="w-full font-black text-stone-900 text-xs focus:outline-none bg-transparent"
                    />
                  </div>

                  {/* Quantity & Unit Price */}
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200 focus-within:border-orange-500 shadow-2xs flex items-center justify-between gap-2">
                    <div>
                      <label className="text-[10px] text-stone-500 font-bold block mb-0.5">
                        수량
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={editableOrder.quantity}
                          onChange={(e) => {
                            const q = parseInt(e.target.value, 10) || 1;
                            setEditableOrder({
                              ...editableOrder,
                              quantity: q,
                              totalAmount: editableOrder.unitPrice * q,
                            });
                          }}
                          className="w-12 font-black text-stone-900 text-xs focus:outline-none bg-transparent border-b border-stone-300 text-center"
                        />
                        <span className="text-xs font-bold text-stone-600">{editableOrder.unit}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <label className="text-[10px] text-stone-500 font-bold block mb-0.5">
                        결제 예정 금액
                      </label>
                      <div className="flex items-center gap-1 justify-end">
                        <input
                          type="number"
                          step="1000"
                          value={editableOrder.totalAmount}
                          onChange={(e) => {
                            const amt = parseInt(e.target.value, 10) || 0;
                            setEditableOrder({ ...editableOrder, totalAmount: amt });
                          }}
                          className="w-20 font-black text-orange-600 text-xs focus:outline-none bg-transparent border-b border-orange-300 text-right"
                        />
                        <span className="text-xs font-black text-orange-600">원</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={handleRegisterParsedOrder}
                  className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  id="submit-parsed-order-btn"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>이 주문을 관리자 장부에 즉시 추가하기</span>
                </button>
              </div>
            )}

            {/* Helpful Guide for Farmers */}
            <div className="text-[11px] text-stone-600 bg-stone-100/70 p-3.5 rounded-2xl border border-stone-200 leading-relaxed space-y-1">
              <p className="font-bold text-stone-800 flex items-center gap-1.5">
                <span>💡</span>
                <span>단골 고객 문자 주문 200% 활용법:</span>
              </p>
              <ul className="list-disc list-inside text-stone-600 space-y-0.5 text-[10.5px]">
                <li><strong>성함/상호명 자동 판별</strong>: "안녕하세요~함덕 라플라주입니다"처럼 상호명이나 인사말이 섞여 있어도 정확히 분리합니다.</li>
                <li><strong>품목 자동 인식</strong>: 상점에 등록되지 않은 과일/채소 이름("감귤 2박스")이라도 문맥 그대로 추출합니다.</li>
                <li><strong>단골 장부 자동 연동</strong>: 이전에 한 번이라도 주문하셨던 고객은 주소와 연락처가 자동으로 이어집니다.</li>
                <li><strong>원클릭 직접 수정</strong>: 분석된 모든 항목은 칸을 클릭하여 즉시 자유롭게 수정할 수 있습니다.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Excel / CSV Batch Import */}
        {activeTab === 'csv' && (
          <div className="p-5 space-y-5 overflow-y-auto flex-1">
            <div className="border-2 border-dashed border-stone-300 hover:border-orange-500 rounded-3xl p-6 text-center space-y-3 bg-stone-50 transition cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-stone-900">
                  기존 엑셀(.xlsx) 또는 CSV 파일을 드래그하여 올려주세요
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  스마트스토어, 쿠팡, 기존 엑셀 장부의 주문 내역을 한 번에 가져옵니다
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleImportSampleCSV}
                  className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition inline-flex items-center gap-2"
                  id="import-sample-csv-btn"
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span>[체험하기] 샘플 엑셀 주문 3건 즉시 불러오기</span>
                </button>
              </div>
            </div>

            {/* Excel column guide */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-2">
              <p className="font-bold text-stone-700">지원하는 엑셀 컬럼 형식:</p>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                <span className="px-2 py-1 bg-white border border-stone-200 rounded-md">받는분(성함)</span>
                <span className="px-2 py-1 bg-white border border-stone-200 rounded-md">전화번호</span>
                <span className="px-2 py-1 bg-white border border-stone-200 rounded-md">배송주소</span>
                <span className="px-2 py-1 bg-white border border-stone-200 rounded-md">상세주소</span>
                <span className="px-2 py-1 bg-white border border-stone-200 rounded-md">상품명</span>
                <span className="px-2 py-1 bg-white border border-stone-200 rounded-md">수량</span>
                <span className="px-2 py-1 bg-white border border-stone-200 rounded-md">배송요청</span>
              </div>
              <p className="text-[11px] text-stone-400">
                * 열 순서가 달라도 제목행(받는분, 주소 등)을 자동 인식하여 정상 병합됩니다.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 bg-stone-50 border-t border-stone-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-xl transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
