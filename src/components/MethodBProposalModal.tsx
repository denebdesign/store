import React, { useRef, useState } from 'react';
import { 
  FileText, Download, Printer, CheckCircle2, ArrowRight, 
  Smartphone, ShieldCheck, Zap, AlertCircle, Sparkles, X, Copy, Check, Code, FileCode
} from 'lucide-react';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodBProposalModal: React.FC<ProposalModalProps> = ({ isOpen, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [copiedType, setCopiedType] = useState<'text' | 'html' | 'md' | null>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getProposalMarkdown = () => {
    return `# 소상공인 농가 직거래를 위한 간편송금(토스·카카오페이) 딥링크 연동 기획안
> 부제: 사업자등록 없는 개인 판매자를 위한 입금 오류 0% 실현 방안 (소비자 관점 중심)
> 작성일: ${new Date().toLocaleDateString('ko-KR')} | 서비스 기획 리포트 #B-01

---

## 1. 기획 개요 및 배경 (Executive Summary)
- **핵심 목적:** 사업자등록증이 없어 PG사 카드결제를 붙이지 못하는 농가·소상공인의 무통장 계좌이체 과정에서 발생하는 **‘입금자명 오타’**와 **‘금액 오입금’** 문제를 원천 차단합니다.
- **핵심 솔루션:** 별도의 고비용 결제 모듈이나 복잡한 인증서 설치 없이, **토스(Toss) 및 카카오페이(KakaoPay)의 무료 앱투앱(App-to-App) 딥링크 기술**을 활용합니다. 주문 완료 즉시 소비자의 금융 앱이 열리며 계좌번호·금액·받는분통장표시명이 자동으로 100% 채워집니다.

---

## 2. 소비자(구매자) 사용 시나리오 및 경험 (Customer Journey)

### [3단계 간편 송금 흐름]
1. **주문서 작성 완료**: 고객이 농산물 수량과 배송지 주소를 입력하고 [주문 완료] 클릭
2. **송금 수단 원터치 선택**: [토스로 1초 송금] 또는 [카카오페이 송금] 버튼 터치 (계좌번호 복사 동시 지원)
3. **지문/생체 인증 끝**: 앱이 자동 실행되어 계좌·금액 입력 없이 지문만 대면 송금 완료

### [기존 방식 vs B안 비교]
| 구분 | 기존 무통장 입금 방식 | B안 도입 후 (간편송금 연동) |
| :--- | :--- | :--- |
| **소요 시간** | 약 1분~2분 (계좌 외우기, 은행 앱 켜기, 붙여넣기 등) | **5초 내외 (원터치 앱 전환 + 지문 인증)** |
| **입금자명 오류** | 자녀 폰으로 주문 후 부모 이름으로 입금 등 불일치 빈번 | **받는분 통장표시 메모에 주문자명 강제 고정되어 오차 0%** |
| **금액 오입금** | 택배비 누락(15,000원 대신 12,000원 입금 등) 발생 | **최종 결제금액이 정확히 세팅되어 오입금 불가** |

---

## 3. 예외 상황(토스/카카오페이 미사용자) 대비 듀얼 지원 설계
> "만약 소비자가 어르신이거나 토스·카카오페이를 쓰지 않으면 어떻게 하나요?"
1. **기본 계좌번호 1초 원터치 복사**: 간편송금 버튼 바로 옆에 [계좌번호 복사]와 [금액 복사] 버튼을 함께 노출하여 시중 일반 은행 앱(농협, 국민, 신한 등)을 쓰시는 분도 즉시 편리하게 입금 가능
2. **입금 안내 문자 자동 생성**: [계좌 안내 문자 받기] 버튼을 누르면 본인 휴대폰 메시지 창에 계좌정보가 담긴 문자가 자동으로 작성되어 나중에 천천히 입금 가능

---

## 4. 기대 효과 (비즈니스 임팩트)
- **구매 전환율 25% 상승**: 주문서 작성 후 번거로워서 입금을 안 하고 이탈하는 노쇼(No-Show) 방지
- **사장님 입금 대조 시간 80% 단축**: 정확한 이름과 금액만 찍혀 들어오므로 은행 문자 확인 속도 대폭 단축
- **수수료 0원 유지**: PG 결제대행 수수료(3.3%)가 전혀 발생하지 않아 소상공인 순이익 100% 보존

---
*농가·소상공인 직거래 주문 플랫폼 개발팀 | CONFIDENTIAL & PROPRIETARY*
`;
  };

  const handleCopyText = () => {
    const text = getProposalMarkdown();
    navigator.clipboard.writeText(text);
    setCopiedType('text');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyHTML = () => {
    if (printRef.current) {
      const html = printRef.current.innerHTML;
      navigator.clipboard.writeText(html);
      setCopiedType('html');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-stone-300 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header & Actions */}
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between gap-3 border-b border-stone-800 shrink-0 print:hidden flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight">
                [기획안] B안: 간편송금(토스·카카오페이) 연동 기획서
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-400">웹 글쓰기 복사 / 인쇄 / PDF 저장 지원</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg text-xs font-bold transition"
              title="블로그/웹페이지 글쓰기에 바로 붙여넣을 수 있는 텍스트/마크다운 복사"
            >
              {copiedType === 'text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
              <span>{copiedType === 'text' ? '본문 복사됨!' : '글 복사'}</span>
            </button>

            <button
              onClick={handleCopyHTML}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg text-xs font-bold transition hidden sm:flex"
              title="스타일이 포함된 HTML 태그 전체 복사"
            >
              {copiedType === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5 text-stone-400" />}
              <span>{copiedType === 'html' ? 'HTML 복사됨!' : 'HTML 복사'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
              title="브라우저 인쇄창에서 PDF로 바로 저장"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>인쇄/PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Copy Guide Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-amber-200 rounded-md text-amber-800 font-black text-[10px]">안내</span>
            <span className="text-[11px] sm:text-xs text-amber-800">
              웹페이지나 블로그, 노션에 기획서를 기재하시려면 상단 <strong>[글 복사]</strong> 또는 <strong>[HTML 복사]</strong>를 누르시면 원본 서식 그대로 붙여넣을 수 있습니다.
            </span>
          </div>
        </div>

        {/* Printable Document Body */}
        <div 
          ref={printRef}
          className="p-6 sm:p-8 overflow-y-auto text-stone-800 space-y-6 leading-relaxed bg-white print:p-0 print:m-0 print:overflow-visible print:max-h-none text-[13px] sm:text-sm"
          id="printable-proposal"
        >
          {/* Header Title for Print */}
          <div className="border-b-2 border-stone-900 pb-4">
            <div className="flex items-center justify-between text-xs text-stone-500 font-mono mb-1">
              <span>서비스 기획 리포트 #B-01</span>
              <span>작성일: {new Date().toLocaleDateString('ko-KR')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              소상공인 농가 직거래를 위한<br />
              <span className="text-orange-600">간편송금(토스·카카오페이) 딥링크 연동 기획안</span>
            </h1>
            <p className="text-stone-600 text-xs sm:text-sm mt-1">
              부제: 사업자등록 없는 개인 판매자를 위한 입금 오류 0% 실현 방안 (소비자 관점 중심)
            </p>
          </div>

          {/* 1. 기획 배경 및 개요 */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-stone-900 flex items-center gap-1.5 border-l-4 border-orange-500 pl-2">
              1. 기획 개요 및 배경 (Executive Summary)
            </h2>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-stone-700 space-y-1.5">
              <p>
                <strong>핵심 목적:</strong> 사업자등록증이 없어 PG사 카드결제를 붙이지 못하는 농가·소상공인의 무통장 계좌이체 과정에서 발생하는 <strong>‘입금자명 오타’</strong>와 <strong>‘금액 오입금’</strong> 문제를 원천 차단합니다.
              </p>
              <p>
                <strong>핵심 솔루션:</strong> 별도의 고비용 결제 모듈이나 복잡한 인증서 설치 없이, <strong>토스(Toss) 및 카카오페이(KakaoPay)의 무료 앱투앱(App-to-App) 딥링크 기술</strong>을 활용합니다. 주문 완료 즉시 소비자의 금융 앱이 열리며 계좌번호·금액·받는분통장표시명이 자동으로 100% 채워집니다.
              </p>
            </div>
          </section>

          {/* 2. 소비자(구매자) 사용 시나리오 & UX 흐름 */}
          <section className="space-y-3">
            <h2 className="text-base font-black text-stone-900 flex items-center gap-1.5 border-l-4 border-orange-500 pl-2">
              2. 소비자(구매자) 사용 시나리오 및 경험 (Customer Journey)
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1 text-amber-800 font-black text-xs">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>주문서 작성 완료</span>
                </div>
                <p className="text-stone-600 text-xs">
                  고객이 농산물 수량과 배송지 주소를 입력하고 [주문 완료] 클릭
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1 text-blue-800 font-black text-xs">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>송금 수단 원터치 선택</span>
                </div>
                <p className="text-stone-600 text-xs">
                  [토스로 1초 송금] 또는 [카카오페이 송금] 버튼 터치 (계좌번호 복사도 동시 지원)
                </p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1 text-emerald-800 font-black text-xs">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>지문/생체 인증 끝</span>
                </div>
                <p className="text-stone-600 text-xs">
                  앱이 자동 실행되어 계좌·금액 입력 없이 지문만 대면 송금 완료
                </p>
              </div>
            </div>

            {/* 비교 테이블 */}
            <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                  <tr>
                    <th className="p-2.5">구분</th>
                    <th className="p-2.5 text-stone-500">기존 무통장 입금 방식</th>
                    <th className="p-2.5 text-orange-600 font-black bg-orange-50/70">B안 도입 후 (간편송금 연동)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  <tr>
                    <td className="p-2.5 font-bold bg-stone-50">소요 시간</td>
                    <td className="p-2.5 text-stone-600">약 1분~2분 (계좌 외우기, 은행 앱 켜기, 붙여넣기 등)</td>
                    <td className="p-2.5 font-black text-orange-700 bg-orange-50/40">5초 내외 (원터치 앱 전환 + 지문 인증)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold bg-stone-50">입금자명 오류</td>
                    <td className="p-2.5 text-red-600 font-medium">자녀 폰으로 주문 후 부모 이름으로 입금 등 불일치 빈번</td>
                    <td className="p-2.5 font-bold text-emerald-700 bg-orange-50/40">받는분 통장표시 메모에 주문자명이 강제 고정되어 오차 0%</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold bg-stone-50">금액 오입금</td>
                    <td className="p-2.5 text-stone-600">택배비 누락(15,000원 대신 12,000원 입금 등) 발생</td>
                    <td className="p-2.5 font-bold text-emerald-700 bg-orange-50/40">최종 결제금액이 정확히 세팅되어 오입금 불가</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. 예외 상황 및 보완 장치 (Fallback UX) */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-stone-900 flex items-center gap-1.5 border-l-4 border-orange-500 pl-2">
              3. 예외 상황(토스/카카오페이 미사용자) 대비 듀얼 지원 설계
            </h2>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-2 text-xs sm:text-sm">
              <p className="font-bold text-stone-800">
                질문: “만약 소비자가 어르신이거나 토스·카카오페이를 쓰지 않으면 어떻게 하나요?”
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                  <span className="font-bold text-stone-900 block mb-1">① 기본 계좌번호 1초 원터치 복사</span>
                  <p className="text-stone-600">
                    간편송금 버튼 바로 옆에 [계좌번호 복사]와 [금액 복사] 버튼을 함께 노출하여 시중 일반 은행 앱(농협, 국민, 신한 등)을 쓰시는 분도 아무런 불편 없이 바로 입금 가능
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                  <span className="font-bold text-stone-900 block mb-1">② 입금 안내 문자 자동 생성</span>
                  <p className="text-stone-600">
                    [계좌 안내 문자 받기] 버튼을 누르면 본인 휴대폰 메시지 창에 계좌정보가 담긴 문자가 자동으로 작성되어 나중에 천천히 입금 가능
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. 사업적 기대효과 및 로드맵 */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-stone-900 flex items-center gap-1.5 border-l-4 border-orange-500 pl-2">
              4. 기대 효과 (비즈니스 임팩트)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="border border-stone-200 p-2.5 rounded-xl bg-white space-y-1">
                <div className="text-orange-600 font-black">구매 전환율 25% 상승</div>
                <p className="text-stone-600">주문서 작성 후 귀찮아서 입금을 안 하고 이탈하는 노쇼(No-Show) 방지</p>
              </div>
              <div className="border border-stone-200 p-2.5 rounded-xl bg-white space-y-1">
                <div className="text-blue-600 font-black">사장님 입금 대조 시간 80% 단축</div>
                <p className="text-stone-600">정확한 이름과 금액만 찍혀 들어오므로 은행 문자 확인 속도가 대폭 단축</p>
              </div>
              <div className="border border-stone-200 p-2.5 rounded-xl bg-white space-y-1">
                <div className="text-emerald-600 font-black">수수료 0원 유지</div>
                <p className="text-stone-600">PG 결제대행 수수료(3.3%)가 전혀 발생하지 않아 소상공인 순이익 100% 보존</p>
              </div>
            </div>
          </section>

          {/* Footer Sign-off */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-400">
            <span>농가·소상공인 주문 플랫폼 개발팀</span>
            <span>CONFIDENTIAL & PROPRIETARY</span>
          </div>
        </div>

        {/* Modal Bottom Print & Copy Buttons for Easy Access */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between gap-2 shrink-0 print:hidden flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold transition shadow-xs"
            >
              {copiedType === 'text' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              <span>{copiedType === 'text' ? '본문 복사 완료!' : '기획서 글 전체 복사'}</span>
            </button>
            <button
              onClick={handleCopyHTML}
              className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold transition shadow-xs hidden sm:flex"
            >
              {copiedType === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Code className="w-3.5 h-3.5 text-stone-500" />}
              <span>{copiedType === 'html' ? 'HTML 서식 복사 완료!' : 'HTML 서식 복사'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs font-bold transition"
            >
              닫기
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>이 기획서 PDF로 인쇄/다운로드</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
