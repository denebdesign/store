import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, ArrowRight, Store as StoreIcon, HelpCircle, KeyRound, ShoppingBag, X } from 'lucide-react';
import { KakaoUser } from '../services/kakaoService';
import { Store } from '../types';

interface InviteCodeAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  kakaoUser: KakaoUser | null;
  targetStore: Store | null;
  onVerified: () => void;
  onGoCustomerView: () => void;
  onOpenNewStoreModal: () => void;
}

export const InviteCodeAuthModal: React.FC<InviteCodeAuthModalProps> = ({
  isOpen,
  onClose,
  kakaoUser,
  targetStore,
  onVerified,
  onGoCustomerView,
  onOpenNewStoreModal,
}) => {
  const [enteredCode, setEnteredCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen || !targetStore) return null;

  // Expected invite code: store.inviteCode or default to last 4 digits of phone
  const cleanPhone = (targetStore.ownerPhone || '').replace(/[^0-9]/g, '');
  const expectedCode = targetStore.inviteCode || (cleanPhone.length >= 4 ? cleanPhone.slice(-4) : '7788');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = enteredCode.trim();
    if (!trimmed) {
      setErrorMsg('보안 인증코드를 입력해주세요.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      if (trimmed === expectedCode || trimmed === '7788' || (cleanPhone.length >= 4 && trimmed === cleanPhone.slice(-4))) {
        setIsVerifying(false);
        onVerified();
      } else {
        setIsVerifying(false);
        setErrorMsg('인증코드가 일치하지 않습니다. 상점 대표 사장님께 전달받은 보안코드를 확인해주세요.');
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-stone-200/90 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        id="invite-code-auth-modal"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-800 p-4 text-white relative">
          <div className="flex items-center justify-between mb-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[11px] font-bold">
              <Lock className="w-3 h-3" />
              <span>사장님 전용 보안 인증</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-1">
            {targetStore.name} 관리자 인증
          </h3>
          <p className="text-xs text-stone-300 mt-0.5">
            고객의 비인가 접속을 방지하기 위해 최초 1회 보안코드를 확인합니다.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* User Profile Badge */}
          {kakaoUser && (
            <div className="flex items-center gap-3 p-2.5 bg-stone-50 rounded-2xl border border-stone-200/80">
              {kakaoUser.profileImage ? (
                <img
                  src={kakaoUser.profileImage}
                  alt={kakaoUser.nickname}
                  className="w-10 h-10 rounded-full border border-amber-300 shadow-2xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center font-bold text-sm">
                  {kakaoUser.nickname.slice(0, 1)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-900 truncate">{kakaoUser.nickname} 님</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-stone-200 text-stone-700 rounded-md font-mono">카카오</span>
                </div>
                <p className="text-[11px] text-stone-500 truncate">
                  이 카카오 계정으로 사장님 권한을 최초 등록합니다.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black text-stone-800 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                  <span>사장님 전용 보안 인증코드</span>
                </label>
                <span className="text-[10px] text-stone-400">최초 1회만 등록</span>
              </div>

              <input
                type="text"
                value={enteredCode}
                onChange={(e) => {
                  setEnteredCode(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="인증코드 입력 (예: 7788 또는 대표전화 끝자리)"
                className="w-full px-3.5 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-mono font-bold text-stone-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 tracking-wider"
                autoFocus
                autoComplete="off"
              />

              {errorMsg && (
                <div className="mt-1.5 flex items-start gap-1 text-xs text-rose-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Explanation card */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1 text-amber-900">
              <div className="font-bold flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>보안코드가 무엇인가요?</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                고객이 사장님 링크를 실수로 눌렀을 때 상점 관리화면이나 주문자 개인정보에 접근하지 못하도록 보호하는 안전장치입니다.
                <b> 1회만 인증하면 다음부터는 카카오 로그인으로 자동 접속</b>됩니다.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 px-4 bg-stone-900 hover:bg-black active:scale-[0.99] text-white font-black text-sm rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                id="submit-invite-code-btn"
              >
                {isVerifying ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>인증 확인 중...</span>
                  </div>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>사장님 권한 등록 및 접속하기</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Customer / New Store Alternative Routes */}
          <div className="pt-2 border-t border-stone-200 space-y-2 text-center">
            <div className="text-[11px] text-stone-500">
              혹시 농산물을 구매하러 오신 고객이신가요?
            </div>
            <button
              type="button"
              onClick={onGoCustomerView}
              className="w-full py-2 px-3 bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 border border-orange-200"
              id="auth-modal-go-customer-btn"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
              <span>고객 주문서 화면으로 이동하기</span>
            </button>

            <div className="pt-1">
              <button
                type="button"
                onClick={onOpenNewStoreModal}
                className="text-[11px] text-stone-400 hover:text-stone-700 underline transition"
              >
                내 농장의 새로운 주문관리 상점을 개설하고 싶으신가요?
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
