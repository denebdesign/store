import React, { useState } from 'react';
import { Store } from '../types';
import {
  X,
  Copy,
  Check,
  MessageCircle,
  Smartphone,
  Send,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { getStoreOrderLinks } from '../utils/domain';
import { shareStoreToKakaoTalk } from '../services/kakaoService';

interface KakaoShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStore: Store;
  onOpenCustomerOrder?: () => void;
}

export const KakaoShareModal: React.FC<KakaoShareModalProps> = ({
  isOpen,
  onClose,
  currentStore,
  onOpenCustomerOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'kakao' | 'sms'>('kakao');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [kakaoSharedSuccess, setKakaoSharedSuccess] = useState(false);

  if (!isOpen) return null;

  // Clean, short customer order link without long base64 clutter
  const { displayUrl, actualUrl, shortUrl } = getStoreOrderLinks(currentStore);

  // High-trust, professional SMS / Messenger formatted message
  const smsMessage = `[${currentStore.shortName || currentStore.name}] 간편 주문서 안내

${currentStore.intro || '정성을 다해 준비한 신선한 직거래 상품입니다.'}

회원가입 없이 아래 링크를 터치하시면 1분 만에 편리하게 주문하실 수 있습니다.

주문서 바로가기:
${shortUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopySmsMessage = () => {
    navigator.clipboard.writeText(smsMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleSendKakaoDirect = () => {
    const success = shareStoreToKakaoTalk(currentStore, shortUrl);
    if (success) {
      setKakaoSharedSuccess(true);
      setTimeout(() => setKakaoSharedSuccess(false), 3000);
    } else {
      // If direct Kakao SDK call fails (e.g. PC browser without Kakao), copy clean message and alert
      handleCopySmsMessage();
    }
  };

  const handleOpenSmsApp = () => {
    const smsUri = `sms:?body=${encodeURIComponent(smsMessage)}`;
    window.location.href = smsUri;
  };

  const handleTestOrderLink = () => {
    if (onOpenCustomerOrder) {
      onClose();
      onOpenCustomerOrder();
    } else {
      window.open(actualUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200"
        id="kakao-share-modal"
      >
        {/* Header */}
        <div className="bg-[#FEE500] px-6 py-4 flex items-center justify-between text-[#191919]">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 fill-current" />
            <h3 className="text-lg font-black tracking-tight">주문서 공유 & 고객 발송</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-700 hover:text-stone-900 rounded-full transition hover:bg-black/5"
            id="close-kakao-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-stone-200 bg-stone-50">
          <button
            type="button"
            onClick={() => setActiveTab('kakao')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'kakao'
                ? 'border-amber-500 text-stone-900 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>카카오톡 공식 카드</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sms')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'sms'
                ? 'border-amber-500 text-stone-900 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Send className="w-4 h-4 text-orange-600" />
            <span>문자(SMS) 깔끔한 문구</span>
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Direct Link Copy for Farmers - Clean & Simple */}
          <div className="flex items-center gap-2 bg-stone-50 p-2 sm:p-2.5 rounded-xl border border-stone-200">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-stone-200 min-w-0 flex-1">
              <span className="flex-1 font-mono text-xs sm:text-sm font-bold text-stone-800 truncate">
                {shortUrl}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2 px-3 bg-stone-800 hover:bg-stone-900 active:scale-[0.98] text-white text-xs font-bold rounded-lg shrink-0 flex items-center gap-1.5 transition"
              id="copy-short-link-btn"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '복사됨!' : '링크 복사'}</span>
            </button>
          </div>

          {/* TAB 1: KAKAO CARD PREVIEW */}
          {activeTab === 'kakao' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 mb-2">
                  카카오톡 친구/단톡방에 전송되는 카드 미리보기
                </label>
                {/* Simulated Kakao Card */}
                <div className="bg-[#b2c7da] p-3.5 rounded-2xl">
                  <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-[280px] mx-auto border border-stone-100">
                    <img
                      src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&auto=format&fit=crop&q=80"
                      alt="주문서 배너"
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <div className="font-black text-stone-900 text-sm mb-1 leading-snug">
                        [{currentStore.shortName || currentStore.name}] 간편 주문서
                      </div>
                      <div className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {currentStore.intro || '회원가입 없이 터치 몇 번으로 간편하게 주문하세요.'}
                      </div>
                    </div>
                    <div className="px-3 pb-3">
                      <div className="w-full py-2 bg-[#FEE500] text-[#191919] font-black text-xs rounded-lg text-center shadow-2xs">
                        주문서 작성하기
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 mt-1.5 text-center">
                  * 카카오톡 전송 시 위와 같은 카드로 전달됩니다.
                </p>
              </div>

              {/* Kakao Share Action Button */}
              <button
                type="button"
                onClick={handleSendKakaoDirect}
                className="w-full py-3.5 sm:py-4 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-black text-base rounded-2xl shadow-md active:scale-[0.98] transition flex items-center justify-center gap-2"
                id="kakao-direct-share-btn"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>{kakaoSharedSuccess ? '카카오톡 전송 창 열림!' : '카카오톡으로 바로 공유하기'}</span>
              </button>
            </div>
          )}

          {/* TAB 2: SMS TEXT PREVIEW */}
          {activeTab === 'sms' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-stone-600">
                    문자(SMS) 전송 문구
                  </label>
                </div>

                <div className="bg-amber-50/70 border-2 border-amber-200/80 rounded-2xl p-4 font-sans text-stone-800 text-xs sm:text-sm whitespace-pre-line leading-relaxed shadow-2xs select-all">
                  {smsMessage}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopySmsMessage}
                  className="py-3 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  id="copy-sms-message-btn"
                >
                  {copiedMessage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedMessage ? '문구 복사됨!' : '문자 문구 복사'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenSmsApp}
                  className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  id="open-sms-app-btn"
                >
                  <Send className="w-4 h-4" />
                  <span>문자 앱으로 전송</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Actions: Preview screen test */}
          <div className="pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={handleTestOrderLink}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl border border-stone-300 shadow-2xs transition flex items-center justify-center gap-1.5 active:scale-[0.99]"
              id="test-customer-order-page-btn"
            >
              <Smartphone className="w-3.5 h-3.5 text-orange-600" />
              <span>손님이 보게 될 주문서 화면 미리보기</span>
              <ExternalLink className="w-3 h-3 text-stone-400 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
