import React, { useState } from 'react';
import { Store, Product } from '../types';
import { X, Plus, Trash2, Edit2, Check, Store as StoreIcon, CreditCard, Sparkles, CheckCircle2, KeyRound, Copy, ShieldCheck } from 'lucide-react';

interface StoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStore: Store;
  onUpdateStore: (updated: Partial<Store>) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

const COMMON_BANKS = ['농협', '국민', '신한', '우리', '하나', '카카오뱅크', '토스뱅크', '우체국', '기업', '새마을', '수협', '신협'];

export const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({
  isOpen,
  onClose,
  currentStore,
  onUpdateStore,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [storeName, setStoreName] = useState(currentStore.name);
  const [intro, setIntro] = useState(currentStore.intro);
  const [notice, setNotice] = useState(currentStore.notice || '');
  const [bankName, setBankName] = useState(currentStore.bankName);
  const [bankAccount, setBankAccount] = useState(currentStore.bankAccount);
  const [bankHolder, setBankHolder] = useState(currentStore.bankHolder);
  const [ownerPhone, setOwnerPhone] = useState(currentStore.ownerPhone);
  const [inviteCode, setInviteCode] = useState(currentStore.inviteCode || currentStore.ownerPhone.replace(/[^0-9]/g, '').slice(-4) || '7788');
  const [copiedCode, setCopiedCode] = useState(false);

  // New product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdPriceStr, setNewProdPriceStr] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('박스');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Editing existing product
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPriceStr, setEditPriceStr] = useState('');
  const [editUnit, setEditUnit] = useState('박스');
  const [editDesc, setEditDesc] = useState('');
  const [editIsAvailable, setEditIsAvailable] = useState(true);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleSaveStoreInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStore({
      name: storeName,
      shortName: storeName.split('(')[0].trim(),
      intro,
      notice,
      bankName,
      bankAccount,
      bankHolder,
      ownerPhone,
      inviteCode: inviteCode.trim(),
    });
    showToast('농장 및 상점 정보가 저장되었습니다.');
  };

  const handlePriceChange = (val: string, setter: (v: string) => void) => {
    // Only allow numbers
    const cleanNum = val.replace(/[^0-9]/g, '');
    if (!cleanNum) {
      setter('');
      return;
    }
    const num = parseInt(cleanNum, 10);
    setter(num.toLocaleString());
  };

  const addAmount = (addWon: number, currentStr: string, setter: (v: string) => void) => {
    const currentNum = parseInt(currentStr.replace(/[^0-9]/g, ''), 10) || 0;
    const newTotal = currentNum + addWon;
    setter(newTotal.toLocaleString());
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newProdName.trim();
    if (!cleanName) {
      alert('상품명을 입력해주세요.');
      return;
    }
    const numPrice = parseInt(newProdPriceStr.replace(/[^0-9]/g, ''), 10);
    if (!numPrice || numPrice <= 0) {
      alert('판매 가격을 올바르게 입력해주세요 (예: 25,000원).');
      return;
    }

    onAddProduct({
      name: cleanName,
      price: numPrice,
      unit: newProdUnit.trim() || '박스',
      emoji: '',
      description: newProdDesc.trim(),
      isAvailable: true,
    });

    setNewProdName('');
    setNewProdPriceStr('');
    setNewProdDesc('');
    setShowAddForm(false);
    showToast(`'${cleanName}' 상품이 추가되었습니다.`);
  };

  const startEditProduct = (prod: Product) => {
    setEditingProdId(prod.id);
    setEditName(prod.name);
    setEditPriceStr(prod.price.toLocaleString());
    setEditUnit(prod.unit || '박스');
    setEditDesc(prod.description || '');
    setEditIsAvailable(prod.isAvailable !== false);
  };

  const handleSaveEditProduct = (productId: string) => {
    const cleanName = editName.trim();
    if (!cleanName) {
      alert('상품명을 입력해주세요.');
      return;
    }
    const numPrice = parseInt(editPriceStr.replace(/[^0-9]/g, ''), 10);
    if (!numPrice || numPrice <= 0) {
      alert('가격을 올바르게 입력해주세요.');
      return;
    }

    onUpdateProduct({
      id: productId,
      name: cleanName,
      price: numPrice,
      unit: editUnit.trim() || '박스',
      emoji: '',
      description: editDesc.trim(),
      isAvailable: editIsAvailable,
    });

    setEditingProdId(null);
    showToast(`'${cleanName}' 상품이 수정되었습니다.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-stone-200 animate-in zoom-in-95 duration-200"
        id="store-settings-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2">
            <StoreIcon className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg sm:text-xl font-bold text-stone-900">농장 및 상품 설정</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full transition"
            id="close-store-settings-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-2 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Farm basic info form */}
          <form onSubmit={handleSaveStoreInfo} className="space-y-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <h3 className="text-sm font-bold text-stone-900">
              농장/가게 기본정보
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">상호명</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">대표 연락처</label>
                <input
                  type="tel"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">한 줄 소개</label>
              <input
                type="text"
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">공지사항 (선택)</label>
              <textarea
                value={notice}
                onChange={(e) => setNotice(e.target.value)}
                rows={2}
                placeholder="예: 주문 마감 시간, 산지 직배송 안내 등"
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Bank Info */}
            <div className="pt-2 border-t border-stone-200 space-y-2">
              <h4 className="text-xs font-bold text-stone-700 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-orange-600" />
                <span>무통장 입금 계좌</span>
              </h4>

              {/* Row 1: Bank & Account Holder */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">은행명</label>
                  <div className="flex gap-1">
                    <select
                      value={COMMON_BANKS.includes(bankName) ? bankName : '직접입력'}
                      onChange={(e) => {
                        if (e.target.value !== '직접입력') {
                          setBankName(e.target.value);
                        }
                      }}
                      className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800"
                    >
                      {COMMON_BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                      <option value="직접입력">기타 (직접입력)</option>
                    </select>
                  </div>
                  {!COMMON_BANKS.includes(bankName) && (
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="은행명 입력"
                      className="mt-1 w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-bold"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">예금주</label>
                  <input
                    type="text"
                    value={bankHolder}
                    onChange={(e) => setBankHolder(e.target.value)}
                    placeholder="예금주 성함"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900"
                  />
                </div>
              </div>

              {/* Row 2: Full-width Bank Account Number */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  계좌번호 <span className="text-stone-400 font-normal">(- 포함 또는 숫자만 길게 입력 가능)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="예: 302-1234-5678-91 (농협)"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-mono font-bold text-stone-900 focus:ring-2 focus:ring-orange-500 tracking-wider"
                />
              </div>
            </div>

            {/* Manager Security & Invite Code (고객-사장님 분리 보안코드) */}
            <div className="pt-2 border-t border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-700 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                  <span>사장님 전용 보안 인증코드 (초대코드)</span>
                </h4>
                <span className="text-[10px] text-stone-400 font-medium">고객 접근 차단용</span>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 space-y-1.5">
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  고객이 사장님 로그인에 접속하더라도 이 보안코드를 입력하지 못하면 진입이 차단됩니다. 사장님 본인이나 가족/직원에게만 알려주세요.
                </p>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="예: 7788 또는 영문+숫자"
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-stone-900 tracking-wider"
                      maxLength={12}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!inviteCode) return;
                      navigator.clipboard.writeText(inviteCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? '복사됨' : '코드 복사'}</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-stone-800 hover:bg-stone-900 active:scale-[0.99] text-white font-bold text-xs rounded-xl transition"
              id="save-store-info-btn"
            >
              기본정보 저장하기
            </button>
          </form>

          {/* Products List & Add */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-stone-900">
                판매 상품 관리 ({currentStore.products.length}개)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-xs"
                id="toggle-add-product-form-btn"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>새 상품 추가</span>
              </button>
            </div>

            {/* Add product form */}
            {showAddForm && (
              <form onSubmit={handleCreateProduct} className="p-4 bg-orange-50 border-2 border-orange-300 rounded-2xl space-y-3 shadow-sm animate-in fade-in">
                <div className="flex items-center justify-between pb-1 border-b border-orange-200">
                  <span className="text-xs font-black text-orange-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                    새 상품 등록
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-stone-400 hover:text-stone-700 text-xs"
                  >
                    닫기
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    상품명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="예) 당근 2kg, 감귤주스 2리터, 사과 5kg"
                    required
                    autoFocus
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      가격 (원) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9,]*"
                        value={newProdPriceStr}
                        onChange={(e) => handlePriceChange(e.target.value, setNewProdPriceStr)}
                        placeholder="예: 25,000"
                        required
                        className="w-full pl-3 pr-7 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:ring-2 focus:ring-orange-500 outline-hidden"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-bold">
                        원
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">단위</label>
                    <input
                      type="text"
                      value={newProdUnit}
                      onChange={(e) => setNewProdUnit(e.target.value)}
                      placeholder="박스, kg, 병, 세트"
                      required
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-hidden"
                    />
                  </div>
                </div>

                {/* Quick Price Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-stone-500 font-semibold">간편금액:</span>
                  <button
                    type="button"
                    onClick={() => addAmount(5000, newProdPriceStr, setNewProdPriceStr)}
                    className="px-2 py-0.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-md text-[10px] font-bold text-stone-700 active:scale-95"
                  >
                    +5천원
                  </button>
                  <button
                    type="button"
                    onClick={() => addAmount(10000, newProdPriceStr, setNewProdPriceStr)}
                    className="px-2 py-0.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-md text-[10px] font-bold text-stone-700 active:scale-95"
                  >
                    +1만원
                  </button>
                  <button
                    type="button"
                    onClick={() => addAmount(30000, newProdPriceStr, setNewProdPriceStr)}
                    className="px-2 py-0.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-md text-[10px] font-bold text-stone-700 active:scale-95"
                  >
                    +3만원
                  </button>
                  <button
                    type="button"
                    onClick={() => addAmount(50000, newProdPriceStr, setNewProdPriceStr)}
                    className="px-2 py-0.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-md text-[10px] font-bold text-stone-700 active:scale-95"
                  >
                    +5만원
                  </button>
                  {newProdPriceStr && (
                    <button
                      type="button"
                      onClick={() => setNewProdPriceStr('')}
                      className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-[10px] font-bold active:scale-95 ml-auto"
                    >
                      지우기
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">상품 설명 (선택)</label>
                  <input
                    type="text"
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    placeholder="예: 산지직송 무농약 감귤 100% 원액"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs outline-hidden"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white text-xs font-black rounded-xl shadow-xs transition"
                    id="submit-new-product-btn"
                  >
                    상품 등록하기
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 active:scale-98 text-stone-700 text-xs font-semibold rounded-xl"
                  >
                    취소
                  </button>
                </div>
              </form>
            )}

            {/* Existing products list with inline edit capability */}
            <div className="space-y-2">
              {currentStore.products.map((prod) => {
                const isEditing = editingProdId === prod.id;

                if (isEditing) {
                  return (
                    <div
                      key={prod.id}
                      className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-2.5 shadow-sm animate-in fade-in"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-amber-900 border-b border-amber-200 pb-1">
                        <span>상품 정보 수정</span>
                        <button
                          type="button"
                          onClick={() => setEditingProdId(null)}
                          className="text-stone-400 hover:text-stone-700 text-[11px]"
                        >
                          취소
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-0.5">상품명</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-600 mb-0.5">가격 (원)</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9,]*"
                            value={editPriceStr}
                            onChange={(e) => handlePriceChange(e.target.value, setEditPriceStr)}
                            className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-orange-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-600 mb-0.5">단위</label>
                          <input
                            type="text"
                            value={editUnit}
                            onChange={(e) => setEditUnit(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      {/* Quick Price Buttons for edit */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => addAmount(5000, editPriceStr, setEditPriceStr)}
                          className="px-2 py-0.5 bg-white border border-stone-200 rounded text-[10px] font-bold text-stone-700"
                        >
                          +5천원
                        </button>
                        <button
                          type="button"
                          onClick={() => addAmount(10000, editPriceStr, setEditPriceStr)}
                          className="px-2 py-0.5 bg-white border border-stone-200 rounded text-[10px] font-bold text-stone-700"
                        >
                          +1만원
                        </button>
                        <button
                          type="button"
                          onClick={() => addAmount(30000, editPriceStr, setEditPriceStr)}
                          className="px-2 py-0.5 bg-white border border-stone-200 rounded text-[10px] font-bold text-stone-700"
                        >
                          +3만원
                        </button>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsAvailable}
                            onChange={(e) => setEditIsAvailable(e.target.checked)}
                            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                          />
                          <span className="font-semibold">주문 가능 상태</span>
                        </label>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSaveEditProduct(prod.id)}
                          className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>수정 완료</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProdId(null)}
                          className="px-3 py-1.5 bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={prod.id}
                    className={`p-3 bg-white border rounded-xl flex items-center justify-between shadow-xs transition hover:border-stone-300 ${
                      prod.isAvailable === false ? 'opacity-60 bg-stone-50 border-stone-200' : 'border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-stone-900 truncate">{prod.name}</h4>
                          {prod.isAvailable === false && (
                            <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded font-bold">
                              품절
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-orange-600 font-bold">
                          {prod.price.toLocaleString()}원 <span className="text-stone-400 font-normal">/ {prod.unit}</span>
                        </p>
                        {prod.description && (
                          <p className="text-[11px] text-stone-500 truncate max-w-[200px] sm:max-w-xs">
                            {prod.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditProduct(prod)}
                        className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg transition flex items-center gap-1"
                        title="상품 수정"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-stone-600" />
                        <span>수정</span>
                      </button>

                      {currentStore.products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`'${prod.name}' 상품을 정말 삭제하시겠습니까?`)) {
                              onDeleteProduct(prod.id);
                              showToast(`'${prod.name}' 상품이 삭제되었습니다.`);
                            }
                          }}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="상품 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

