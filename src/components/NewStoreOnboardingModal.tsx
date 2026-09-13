import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { KakaoUser } from '../services/kakaoService';
import { Sparkles, Store, Check, Plus, Package, CreditCard, Phone, ArrowRight, X } from 'lucide-react';
import { TARGET_CUSTOM_DOMAIN } from '../utils/domain';

interface NewStoreOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  kakaoUser: KakaoUser | null;
  onComplete: (newStoreId: string) => void;
}

const COMMON_BANKS = ['농협', '국민', '신한', '우리', '하나', '카카오뱅크', '토스뱅크', '우체국', '기업'];

export const NewStoreOnboardingModal: React.FC<NewStoreOnboardingModalProps> = ({
  isOpen,
  onClose,
  kakaoUser,
  onComplete,
}) => {
  const { createNewStore } = useStore();

  const [storeName, setStoreName] = useState('');
  const [intro, setIntro] = useState('산지에서 바로 수확해 신선하게 보내드립니다.');
  const [bankName, setBankName] = useState('농협');
  const [bankAccount, setBankAccount] = useState('');
  const [bankHolder, setBankHolder] = useState(kakaoUser?.nickname || '');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [category, setCategory] = useState<'farm' | 'fish' | 'fruit' | 'market'>('farm');
  const [emoji, setEmoji] = useState('🌾');

  // First product
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState<string>('');
  const [productUnit, setProductUnit] = useState('박스');

  useEffect(() => {
    if (kakaoUser?.nickname) {
      setBankHolder(kakaoUser.nickname);
      if (!storeName) {
        setStoreName(`${kakaoUser.nickname}의 농장`);
      }
    }
  }, [kakaoUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      alert('농장/상점 이름을 입력해주세요.');
      return;
    }

    const priceNum = parseInt(productPrice.replace(/[^0-9]/g, ''), 10) || 20000;
    const initialProduct = {
      name: productName.trim() || '산지직송 대표 농산물',
      price: priceNum,
      unit: productUnit.trim() || '박스',
      emoji: emoji,
      isAvailable: true,
      description: '제철 맞은 신선한 농산물',
    };

    const newStore = createNewStore({
      name: storeName.trim(),
      shortName: storeName.trim().slice(0, 10),
      category,
      intro: intro.trim() || '정성껏 재배한 농산물 직거래',
      emoji: emoji || '🌾',
      isOrderActive: true,
      orderDeadline: '매일 오후 5:00 마감 (익일 순차발송)',
      bankName,
      bankAccount: bankAccount.trim() || '123-456-789012',
      bankHolder: bankHolder.trim() || kakaoUser?.nickname || '대표자',
      ownerPhone: ownerPhone.trim() || '010-0000-0000',
      ownerKakaoId: kakaoUser?.id,
      ownerKakaoNickname: kakaoUser?.nickname,
      products: [
        {
          id: `prod-${Date.now()}-1`,
          ...initialProduct,
        },
      ],
    });

    onComplete(newStore.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200 my-auto"
        id="new-store-onboarding-modal"
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-800 p-5 sm:p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-yellow-400/20 text-yellow-300 rounded-xl border border-yellow-400/30">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  내 농장 / 상점 시작하기
                </h3>
                <p className="text-xs text-stone-300 mt-0.5">
                  {kakaoUser?.nickname ? `${kakaoUser.nickname} 사장님 환영합니다!` : '1분 만에 주문 링크가 생성됩니다'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 px-3 py-1.5 bg-white/10 rounded-xl text-[11px] text-yellow-200 flex items-center gap-1.5">
            <span>🔗 등록 즉시</span>
            <span className="font-bold underline">{TARGET_CUSTOM_DOMAIN}</span>
            <span>전용 주문 링크가 생성됩니다.</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* 1. Store Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-stone-800 flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-orange-600" />
              <span>농장 또는 상점 이름</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="예: 햇살농원, 제주 구좌 당근, 영천 꿀사과"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold text-stone-900 focus:bg-white focus:ring-2 focus:ring-orange-500"
              required
              autoFocus
            />
          </div>

          {/* Category & Emoji selector */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">업종 분류</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900"
              >
                <option value="farm">🌾 농산물 / 채소</option>
                <option value="fruit">🍎 과수원 / 과일</option>
                <option value="fish">🐟 수산물 / 건어물</option>
                <option value="market">🛒 오일장 / 전통시장</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">대표 아이콘/이모지</label>
              <div className="flex gap-1.5">
                {['🌾', '🥕', '🍎', '🍓', '🥬', '🐟', '🌰'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmoji(em)}
                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition border ${
                      emoji === em ? 'border-orange-500 bg-orange-50 scale-110' : 'border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Bank Information */}
          <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
              <CreditCard className="w-4 h-4 text-amber-700" />
              <span>고객 입금받을 계좌 정보</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">은행</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900"
                >
                  {COMMON_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-bold text-stone-600 block mb-1">계좌번호</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="'-' 포함 또는 숫자만"
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">예금주</label>
                <input
                  type="text"
                  value={bankHolder}
                  onChange={(e) => setBankHolder(e.target.value)}
                  placeholder="예금주 성함"
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">사장님 연락처</label>
                <input
                  type="tel"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900"
                />
              </div>
            </div>
          </div>

          {/* 3. First Product */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-stone-900">
              <Package className="w-4 h-4 text-orange-600" />
              <span>판매할 대표 상품 1개 등록</span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-3">
                <label className="text-[11px] font-bold text-stone-600 block mb-1">상품명</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="예: 꿀사과 5kg 가정용"
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">단위</label>
                <input
                  type="text"
                  value={productUnit}
                  onChange={(e) => setProductUnit(e.target.value)}
                  placeholder="박스, kg"
                  className="w-full px-2 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900 text-center"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">가격(원)</label>
                <input
                  type="text"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="25,000"
                  className="w-full px-2 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900 text-right"
                />
              </div>
            </div>
            <p className="text-[11px] text-stone-500">
              * 추가 상품이나 가격 수정은 관리자 화면에서 언제든 쉽게 변경하실 수 있습니다.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-black text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2"
              id="submit-new-store-btn"
            >
              <span>내 농장 등록 완료 & 바로 시작</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
