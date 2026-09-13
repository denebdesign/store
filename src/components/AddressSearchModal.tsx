import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin, Loader2, Edit3, Search } from 'lucide-react';

interface AddressSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (roadAddress: string) => void;
  initialQuery?: string;
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: {
          roadAddress: string;
          jibunAddress: string;
          userSelectedType: 'R' | 'J';
          bname: string;
          buildingName: string;
          apartment: 'Y' | 'N';
          zonecode: string;
        }) => void;
        onresize?: (size: { width: number; height: number }) => void;
        width?: string;
        height?: string;
        q?: string;
        autoMapping?: boolean;
        animation?: boolean;
      }) => {
        embed: (container: HTMLElement, options?: { autoClose?: boolean }) => void;
      };
    };
  }
}

export const AddressSearchModal: React.FC<AddressSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectAddress,
  initialQuery = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualAddress, setManualAddress] = useState(initialQuery);

  useEffect(() => {
    if (!isOpen) {
      setLoading(true);
      setLoadError(false);
      setIsManualMode(false);
      return;
    }

    let isCancelled = false;

    const initPostcode = () => {
      if (!containerRef.current || isCancelled) return;

      if (window.daum && window.daum.Postcode) {
        setLoading(false);
        try {
          containerRef.current.innerHTML = '';
          new window.daum.Postcode({
            oncomplete: (data) => {
              // Extract road or jibun address based on user selection
              let fullAddress = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
              if (!fullAddress) {
                fullAddress = data.roadAddress || data.jibunAddress;
              }

              // Extract extra address reference (e.g. bname, building name)
              let extraAddress = '';
              if (data.userSelectedType === 'R') {
                if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
                  extraAddress += data.bname;
                }
                if (data.buildingName !== '' && data.apartment === 'Y') {
                  extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
                }
                if (extraAddress !== '') {
                  fullAddress += ` (${extraAddress})`;
                }
              }

              onSelectAddress(fullAddress);
              onClose();
            },
            width: '100%',
            height: '100%',
            autoMapping: true,
            animation: false,
          }).embed(containerRef.current, { autoClose: false });
        } catch (err) {
          console.error('[Daum Postcode] Init error:', err);
          setLoadError(true);
        }
      } else {
        // Dynamically load Daum Postcode script if not ready
        const scriptId = 'daum-postcode-script-v2';
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement('script');
          script.id = scriptId;
          script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
          script.async = true;
          document.head.appendChild(script);
        }

        const handleLoad = () => {
          if (!isCancelled) {
            initPostcode();
          }
        };

        const handleError = () => {
          if (!isCancelled) {
            setLoading(false);
            setLoadError(true);
            setIsManualMode(true);
          }
        };

        script.addEventListener('load', handleLoad);
        script.addEventListener('error', handleError);

        // Polling fallback check
        const timer = setInterval(() => {
          if (window.daum && window.daum.Postcode) {
            clearInterval(timer);
            if (!isCancelled) {
              initPostcode();
            }
          }
        }, 150);

        setTimeout(() => {
          clearInterval(timer);
          if (!window.daum?.Postcode && !isCancelled) {
            setLoading(false);
            setLoadError(true);
            setIsManualMode(true);
          }
        }, 4000);
      }
    };

    // Small delay to ensure DOM container is attached
    const mountTimer = setTimeout(() => {
      initPostcode();
    }, 100);

    return () => {
      isCancelled = true;
      clearTimeout(mountTimer);
    };
  }, [isOpen, onClose, onSelectAddress]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualAddress.trim()) {
      onSelectAddress(manualAddress.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col h-[85vh] sm:h-[620px] max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-200"
        id="address-search-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 bg-stone-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 leading-tight">주소 검색</h3>
              <p className="text-[11px] text-stone-500">
                {isManualMode ? '주소를 직접 입력해 주세요' : '도로명, 지번, 건물명으로 실시간 검색'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsManualMode(!isManualMode)}
              className="px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition border border-stone-200"
              id="toggle-manual-address-mode-btn"
            >
              {isManualMode ? '검색 모드로' : '직접 입력'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full transition"
              id="close-address-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full relative overflow-hidden bg-stone-50 flex flex-col">
          {/* Daum Postcode Container */}
          <div
            className={`flex-1 w-full h-full relative ${isManualMode ? 'hidden' : 'block'}`}
          >
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                <Loader2 className="w-8 h-8 text-orange-600 animate-spin mb-2" />
                <p className="text-xs font-semibold text-stone-500">
                  우편번호·도로명 주소 검색을 불러오는 중...
                </p>
              </div>
            )}

            {loadError && (
              <div className="p-6 text-center">
                <p className="text-sm font-semibold text-stone-800 mb-1">
                  주소 검색 서비스를 불러올 수 없습니다.
                </p>
                <p className="text-xs text-stone-500 mb-4">
                  네트워크 환경에 따라 로딩이 지연될 수 있습니다. 주소를 직접 입력해 주세요.
                </p>
                <button
                  type="button"
                  onClick={() => setIsManualMode(true)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
                >
                  주소 직접 입력하기
                </button>
              </div>
            )}

            <div
              ref={containerRef}
              className="w-full h-full min-h-[380px]"
              id="daum-postcode-container"
            />
          </div>

          {/* Manual Input Fallback Mode */}
          {isManualMode && (
            <div className="p-5 flex-1 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center gap-2 mb-3 text-stone-700">
                  <Edit3 className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold">주소 직접 입력하기</span>
                </div>
                <p className="text-xs text-stone-500 mb-3 leading-relaxed">
                  도로명 주소 또는 지번 주소를 건물명과 함께 입력해 주시면 택배 발송 시 정확하게 반영됩니다.
                </p>
                <textarea
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="예: 제주특별자치도 제주시 구좌읍 일주동로 2973 (세화리)"
                  rows={4}
                  className="w-full p-3.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-stone-900 resize-none font-medium leading-relaxed"
                  autoFocus
                  id="manual-address-textarea"
                />
              </div>

              <div className="pt-4 border-t border-stone-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualMode(false)}
                  className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm rounded-xl transition"
                >
                  검색으로 찾기
                </button>
                <button
                  type="button"
                  onClick={handleManualSubmit}
                  disabled={!manualAddress.trim()}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 text-white font-bold text-sm rounded-xl transition shadow-sm"
                  id="apply-manual-address-btn"
                >
                  이 주소 적용하기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer tip */}
        {!isManualMode && (
          <div className="px-4 py-2.5 bg-stone-100 border-t border-stone-200 text-center shrink-0">
            <span className="text-[11px] text-stone-500">
              💡 검색 결과에서 해당 주소를 터치하시면 자동으로 입력됩니다.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
