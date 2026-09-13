import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ArrowRight, Bell, FileSpreadsheet, 
  Smartphone, Sparkles, Store, Copy, Check, AlertCircle, PlusCircle, ShoppingBag, ExternalLink
} from 'lucide-react';
import { loginWithKakao, KakaoUser, initKakaoSDK } from '../services/kakaoService';
import { TARGET_CUSTOM_DOMAIN, FIREBASE_HOSTING_DOMAIN } from '../utils/domain';

interface BossKakaoLoginViewProps {
  onSuccess: (user?: KakaoUser) => void;
  onOpenNewStoreModal?: (user?: KakaoUser) => void;
  onGoCustomerOrder?: () => void;
}

export const BossKakaoLoginView: React.FC<BossKakaoLoginViewProps> = ({
  onSuccess,
  onOpenNewStoreModal,
  onGoCustomerOrder,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showDomainGuide, setShowDomainGuide] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  useEffect(() => {
    // Warm up Kakao SDK in the background
    initKakaoSDK();
  }, []);

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    setLoginError(null);

    try {
      const result = await loginWithKakao();

      if (result.success && result.user) {
        setIsLoading(false);
        onSuccess(result.user);
      } else {
        setIsLoading(false);
        setLoginError(result.error || '카카오 로그인을 완료할 수 없습니다.');
        setShowDomainGuide(true);
      }
    } catch (err: any) {
      setIsLoading(false);
      setLoginError(err?.message || '카카오 로그인 중 오류가 발생했습니다.');
      setShowDomainGuide(true);
    }
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopyDomains = () => {
    const domainList = `https://${TARGET_CUSTOM_DOMAIN}\nhttps://${FIREBASE_HOSTING_DOMAIN}\n${currentOrigin}`;
    navigator.clipboard.writeText(domainList);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto">
      <div
        className="w-full max-w-sm bg-white rounded-3xl border border-stone-200/90 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        id="boss-kakao-login-card"
      >
        {/* Top visual banner - Service Title before login */}
        <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-800 p-3.5 sm:p-5 text-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 rounded-full text-[10px] sm:text-[11px] font-black">
              <Sparkles className="w-3 h-3" />
              <span>사장님 전용 오피스</span>
            </span>

            <div className="p-1 sm:p-1.5 bg-white/10 rounded-xl backdrop-blur-xs text-yellow-300">
              <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">
            농산물 직거래 / 주문관리
          </h2>
          <p className="text-[11px] sm:text-xs text-stone-300 mt-0.5 font-medium">
            카톡 주문 접수 · 실시간 알림 · 송장 엑셀 원클릭
          </p>
        </div>

        {/* Card Body */}
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          {/* Key Advantages Checklist for Bosses */}
          <div className="space-y-1.5 sm:space-y-2 bg-stone-50 p-2 sm:p-2.5 rounded-xl border border-stone-100 text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-yellow-100 text-yellow-800 rounded-md shrink-0">
                <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <p className="font-extrabold text-stone-800 text-[11px] sm:text-xs">새 주문 접수 시 실시간 카톡 알림</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1 bg-emerald-100 text-emerald-800 rounded-md shrink-0">
                <FileSpreadsheet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <p className="font-extrabold text-stone-800 text-[11px] sm:text-xs">엑셀 & 카톡 문자 주문 자동 정리</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1 bg-blue-100 text-blue-800 rounded-md shrink-0">
                <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <p className="font-extrabold text-stone-800 text-[11px] sm:text-xs">우체국/CJ 택배 송장 엑셀 원클릭 다운</p>
            </div>
          </div>

          {/* Official Kakao Login Button */}
          <div className="space-y-2 pt-0.5">
            <button
              type="button"
              onClick={handleKakaoLogin}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#FEE500] hover:bg-[#FDD800] active:scale-[0.98] text-[#191919] font-black text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-sm transition flex items-center justify-center gap-2 border border-[#F2DA00] relative group touch-manipulation min-h-[44px]"
              id="kakao-login-btn"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold">카카오 인증 진행 중...</span>
                </div>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-[#191919] shrink-0" viewBox="0 0 24 24">
                    <path d="M12 3c-5.523 0-10 3.582-10 8 0 2.857 1.862 5.368 4.675 6.746l-.978 3.593c-.114.417.348.746.696.502l4.331-3.037c.414.043.837.068 1.276.068 5.523 0 10-3.582 10-8s-4.477-8-10-8z" />
                  </svg>
                  <span className="tracking-tight font-black">사장님 카카오 로그인</span>
                  <ArrowRight className="w-4 h-4 ml-auto text-stone-600 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Quick Demo Login Option */}
            <div>
              <button
                type="button"
                onClick={() => onSuccess()}
                className="w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 active:scale-[0.99] text-stone-800 text-xs font-bold rounded-lg sm:rounded-xl transition text-center shadow-xs flex items-center justify-center gap-1.5"
                id="demo-login-bypass-btn"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>[사장님용] 샘플 데이터로 관리자 체험하기</span>
              </button>
            </div>

            {/* Customer Order Experience (고객 주문서 바로가기 및 체험 안내) */}
            {onGoCustomerOrder && (
              <div className="p-2.5 sm:p-3 bg-gradient-to-br from-orange-50/90 via-amber-50/50 to-stone-50 border border-orange-200/80 rounded-xl sm:rounded-2xl space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="p-0.5 sm:p-1 bg-orange-500 text-white rounded-md text-xs font-bold flex items-center justify-center">
                      <ShoppingBag className="w-3 h-3" />
                    </span>
                    <span className="font-extrabold text-[11px] sm:text-xs text-stone-900">소비자가 보게 되는 고객 주문서</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-orange-100 text-orange-700 rounded-full border border-orange-200">
                    체험
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onGoCustomerOrder}
                  className="w-full py-1.5 sm:py-2 px-3 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs group"
                  id="go-customer-order-btn"
                >
                  <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-200" />
                  <span>고객 주문서 화면 둘러보기</span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-200 group-hover:translate-x-1 transition-transform ml-auto" />
                </button>
              </div>
            )}

            {/* Remember Login checkbox */}
            <div className="flex items-center justify-between px-1 text-xs text-stone-500 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none py-0.5">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-stone-300 text-yellow-500 focus:ring-yellow-400 w-3.5 h-3.5"
                />
                <span className="text-[11px] sm:text-xs">이 기기에서 로그인 유지</span>
              </label>

              <span className="text-[10px] sm:text-[11px] text-stone-400">SSL 보안</span>
            </div>
          </div>

          {/* Domain Setup Assistant Guide (Shows if Kakao domain error occurs) */}
          {showDomainGuide && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-900 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-black text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>카카오 디벨로퍼스 도메인 설정 안내</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                카카오 로그인 팝업을 띄우려면 <b>카카오 디벨로퍼스</b> [내 애플리케이션] &gt; [플랫폼] &gt; <b>Web 사이트 도메인</b>에 아래 도메인을 등록해야 합니다.
              </p>

              <div className="bg-white/80 p-2 rounded-xl border border-amber-200 font-mono text-[10px] space-y-1">
                <div>• https://{TARGET_CUSTOM_DOMAIN}</div>
                <div>• https://{FIREBASE_HOSTING_DOMAIN}</div>
                {currentOrigin && <div>• {currentOrigin}</div>}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyDomains}
                  className="flex-1 py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition"
                >
                  {copiedDomain ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedDomain ? '도메인 목록 복사됨' : '도메인 전체 복사'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSuccess()}
                  className="py-1.5 px-2.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-bold text-[11px] transition"
                >
                  샘플 데이터로 체험하기
                </button>
              </div>
            </div>
          )}

          {/* Privacy & Safe SaaS Notice */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>사업자등록 번호 또는 휴대폰 본인확인 불필요</span>
          </div>

        </div>
      </div>
    </div>
  );
};
