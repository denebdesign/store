import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus } from '../types';
import { OrderDetailModal } from './OrderDetailModal';
import { StoreSettingsModal } from './StoreSettingsModal';
import { KakaoShareModal } from './KakaoShareModal';
import { DataImportModal } from './DataImportModal';
import { NewStoreOnboardingModal } from './NewStoreOnboardingModal';
import { 
  FileSpreadsheet, Share2, Settings, Power, Clock, Search, 
  Package, ChevronRight, CheckCircle2, AlertCircle, Phone, ArrowUpRight, Filter, Calendar, LogOut, Upload, Plus, ChevronDown, Trash2, Smartphone
} from 'lucide-react';

interface BossDashboardViewProps {
  onLogout?: () => void;
}

export const BossDashboardView: React.FC<BossDashboardViewProps> = ({ onLogout }) => {
  const {
    stores,
    currentStore,
    orders,
    currentStoreOrders,
    setCurrentStoreId,
    updateOrderStatus,
    toggleOrderActive,
    updateDeadline,
    updateStoreDetails,
    addStoreProduct,
    updateStoreProduct,
    deleteStoreProduct,
    exportOrdersToCSV,
    clearStoreOrders,
    setActiveView,
  } = useStore();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isKakaoModalOpen, setIsKakaoModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNewStoreModalOpen, setIsNewStoreModalOpen] = useState(false);

  // Active selected order resolved directly from latest orders state
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find((o) => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  // Date Filter: 'all' | 'today' | 'yesterday' | 'week' | specific 'YYYY-MM-DD'
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | string>('today');
  // Status Filter: 'all' | 'new' | 'preparing' | 'shipped' | 'cancelled'
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [tempDeadline, setTempDeadline] = useState(currentStore.orderDeadline);

  // Helper to format date into YYYY-MM-DD in local time
  const getLocalDateKey = (isoString: string) => {
    const d = new Date(isoString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayKey = useMemo(() => getLocalDateKey(new Date().toISOString()), []);
  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateKey(d.toISOString());
  }, []);

  // Today's Date formatted in Korean (e.g. 오늘 9월 4일)
  const todayFormatted = useMemo(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    return `오늘 ${month}월 ${date}일`;
  }, []);

  // All distinct dates available in orders
  const availableDates = useMemo(() => {
    const dateSet = new Set<string>();
    currentStoreOrders.forEach((o) => {
      dateSet.add(getLocalDateKey(o.createdAt));
    });
    return Array.from(dateSet).sort((a, b) => b.localeCompare(a));
  }, [currentStoreOrders]);

  // Orders filtered by dateFilter first
  const dateScopedOrders = useMemo(() => {
    return currentStoreOrders.filter((ord) => {
      if (dateFilter === 'all') return true;
      const orderDateKey = getLocalDateKey(ord.createdAt);
      if (dateFilter === 'today') return orderDateKey === todayKey;
      if (dateFilter === 'yesterday') return orderDateKey === yesterdayKey;
      if (dateFilter === 'week') {
        const orderTime = new Date(ord.createdAt).getTime();
        const weekAgoTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return orderTime >= weekAgoTime;
      }
      // Specific date
      return orderDateKey === dateFilter;
    });
  }, [currentStoreOrders, dateFilter, todayKey, yesterdayKey]);

  // Compute metrics for the selected date scope:
  const activeOrders = useMemo(() => {
    return dateScopedOrders.filter((o) => o.status !== 'cancelled');
  }, [dateScopedOrders]);

  const totalOrderCount = dateScopedOrders.length;
  const activeOrderCount = activeOrders.length;
  const totalBoxesCount = activeOrders.reduce((sum, ord) => sum + ord.totalUnits, 0);
  const totalRevenue = activeOrders.reduce((sum, ord) => sum + ord.totalAmount, 0);

  // Breakdown by product name for current date scope
  const productBreakdown = useMemo(() => {
    const counts: Record<string, { name: string; count: number; unit: string }> = {};
    activeOrders.forEach((ord) => {
      ord.items.forEach((it) => {
        if (!counts[it.productName]) {
          counts[it.productName] = {
            name: it.productName,
            count: 0,
            unit: it.unit,
          };
        }
        counts[it.productName].count += it.quantity;
      });
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [activeOrders]);

  // Orders filtered by search & status inside dateScopedOrders
  const filteredOrders = useMemo(() => {
    return dateScopedOrders.filter((ord) => {
      if (statusFilter !== 'all' && ord.status !== statusFilter) {
        return false;
      }
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchesName = ord.customerName.toLowerCase().includes(kw);
        const matchesPhone = ord.phone.includes(kw);
        const matchesAddr = ord.address.toLowerCase().includes(kw);
        const matchesOrderNo = String(ord.orderNumber).includes(kw);
        return matchesName || matchesPhone || matchesAddr || matchesOrderNo;
      }
      return true;
    });
  }, [dateScopedOrders, statusFilter, searchKeyword]);

  // Pending orders needing action in current store
  const pendingOrdersCount = dateScopedOrders.filter(
    (o) => o.status === 'new' || o.status === 'preparing'
  ).length;

  const handleOpenOrderDetail = (order: Order) => {
    setSelectedOrderId(order.id);
    setIsDetailModalOpen(true);
  };

  const handleSaveDeadline = () => {
    updateDeadline(currentStore.id, tempDeadline);
    setEditingDeadline(false);
  };

  const statusBadges: Record<OrderStatus, { label: string; dot: string; badge: string }> = {
    new: { label: '신규', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-900 border-amber-300' },
    preparing: { label: '준비중', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-900 border-blue-300' },
    shipped: { label: '출고', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    cancelled: { label: '취소', dot: 'bg-stone-400', badge: 'bg-stone-100 text-stone-600 border-stone-300' },
  };

  return (
    <div className="min-h-screen w-full bg-stone-100 pb-20 text-stone-900" id="boss-dashboard-container">
      {/* Top Header - Unified hierarchy with clear visual balance */}
      <header className="bg-stone-900 text-white px-3 sm:px-6 py-2.5 sm:py-3.5 sticky top-0 z-30 shadow-lg border-b border-stone-800" id="boss-main-header">
        <div className="max-w-4xl mx-auto flex flex-col gap-2 sm:gap-2.5">
          {/* Row 1: Brand / Store info & System Utilities */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Store identity & Status badges */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-800 border border-stone-700/80 flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-xs">
                {currentStore.emoji}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {stores.length > 1 ? (
                    <select
                      value={currentStore.id}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setIsNewStoreModalOpen(true);
                        } else {
                          setCurrentStoreId(e.target.value);
                        }
                      }}
                      className="bg-stone-800 hover:bg-stone-750 border border-stone-700 text-white text-xs sm:text-sm font-black rounded-lg px-2 py-0.5 focus:ring-1 focus:ring-orange-500 cursor-pointer max-w-[140px] sm:max-w-none truncate"
                    >
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.emoji} {s.shortName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <h1 className="text-sm sm:text-base font-black text-stone-100 truncate max-w-[150px] sm:max-w-none">
                      {currentStore.name}
                    </h1>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-md font-bold shrink-0">
                    사장님용
                  </span>
                  <span className="hidden xs:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-md shrink-0" title="Firebase Cloud DB 실시간 자동 동기화">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>DB연동</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Unified Utility Controls (Customer View, Settings, Logout) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={() => setActiveView('customer')}
                className="h-8 sm:h-9 px-2.5 sm:px-3 bg-stone-800 hover:bg-stone-750 text-stone-200 hover:text-white border border-stone-700/80 text-xs font-bold rounded-xl transition flex items-center gap-1 active:scale-95"
                id="boss-header-customer-view-btn"
                title="손님이 보는 주문서 화면 열기"
              >
                <Smartphone className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="whitespace-nowrap">손님 화면</span>
              </button>

              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white border border-stone-700/80 rounded-xl transition flex items-center justify-center active:scale-95 shrink-0"
                title="농장 및 상품 설정"
                id="open-settings-btn"
              >
                <Settings className="w-4 h-4" />
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-8 h-8 sm:w-9 sm:h-9 bg-stone-800 hover:bg-red-950/60 text-stone-400 hover:text-red-400 border border-stone-700/80 rounded-xl transition flex items-center justify-center active:scale-95 shrink-0"
                  title="사장님 로그아웃"
                  id="boss-logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Core Operational Action Bar - High Impact 2-Column Grid */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            {/* Kakao Share Button */}
            <button
              onClick={() => setIsKakaoModalOpen(true)}
              className="h-10 sm:h-11 px-3 bg-[#FEE500] hover:bg-[#FDD800] active:scale-[0.98] text-[#191919] font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              id="open-kakao-share-btn"
              title="손님에게 카카오톡 주문서 링크 보내기"
            >
              <Share2 className="w-4 h-4 shrink-0 text-[#191919]" />
              <span className="whitespace-nowrap font-black">카톡 주문링크 공유</span>
            </button>

            {/* Data Import Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="h-10 sm:h-11 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              id="open-data-import-btn"
              title="문자, 카톡, 엑셀 주문 데이터 일괄 불러오기"
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">데이터 불러오기</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-2.5 sm:p-6 space-y-3 sm:space-y-6">

        {/* 10. 사장님에게 가장 중요한 화면: 📊 주문 핵심 요약 (날짜 필터 연동) */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-stone-200 space-y-4 sm:space-y-6" id="todays-summary-widget">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-stone-100 gap-2.5">
            <div>
              <span className="text-xs font-extrabold text-orange-600 uppercase tracking-wider">
                📊 {dateFilter === 'today' ? '오늘의 주문 핵심 현황' : dateFilter === 'yesterday' ? '어제의 주문 현황' : dateFilter === 'week' ? '최근 7일 주문 현황' : dateFilter === 'all' ? '전체 주문 누적 현황' : `${dateFilter} 주문 현황`}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-0.5">
                {dateFilter === 'today' ? todayFormatted : dateFilter === 'yesterday' ? '어제 주문 내역' : dateFilter === 'week' ? '최근 7일 주문' : dateFilter === 'all' ? '전체 기간' : `${dateFilter} 주문`}
              </h2>
            </div>

            {/* Quick Date Scope Switcher Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  dateFilter === 'today'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
                id="date-filter-today-btn"
              >
                <span>오늘</span>
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('yesterday')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  dateFilter === 'yesterday'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
                id="date-filter-yesterday-btn"
              >
                <span>어제</span>
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('week')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  dateFilter === 'week'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
                id="date-filter-week-btn"
              >
                <span>최근 7일</span>
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  dateFilter === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
                id="date-filter-all-btn"
              >
                <span>전체기간</span>
              </button>
            </div>
          </div>

          {/* 사장님이 보는 2대 핵심: "몇 건인가? 몇 박스인가?" */}
          <div className="grid grid-cols-2 gap-4">
            {/* 주문건 */}
            <div className="bg-orange-50/70 border-2 border-orange-200 rounded-3xl p-5 text-center shadow-xs">
              <span className="text-xs sm:text-sm font-bold text-stone-500 block">
                {dateFilter === 'today' ? '오늘 총 접수' : '선택 기간 총 접수'}
              </span>
              <div className="my-2">
                <span className="text-4xl sm:text-5xl font-black text-orange-600 tracking-tight" id="summary-total-orders">
                  {totalOrderCount}
                </span>
                <span className="text-base sm:text-xl font-bold text-stone-700 ml-1">주문건</span>
              </div>
              <span className="text-xs text-orange-800 font-bold bg-orange-200/60 px-2.5 py-0.5 rounded-full inline-block">
                처리대기 {pendingOrdersCount}건
              </span>
            </div>

            {/* 박스/수량 */}
            <div className="bg-amber-50/70 border-2 border-amber-200 rounded-3xl p-5 text-center shadow-xs">
              <span className="text-xs sm:text-sm font-bold text-stone-500 block">
                출고할 총 수량
              </span>
              <div className="my-2">
                <span className="text-4xl sm:text-5xl font-black text-amber-700 tracking-tight" id="summary-total-boxes">
                  {totalBoxesCount}
                </span>
                <span className="text-base sm:text-xl font-bold text-stone-700 ml-1">박스</span>
              </div>
              <span className="text-xs text-amber-800 font-bold bg-amber-200/60 px-2.5 py-0.5 rounded-full inline-block">
                상품 포장 단위
              </span>
            </div>
          </div>

          {/* 상품별 출고 박스 상세 (흙당근 57, 못난이 14, 당근즙 11...) */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
            <span className="text-xs font-bold text-stone-500 block mb-3">
              품목별 출고 필요 수량 ({dateFilter === 'today' ? '오늘 기준' : '선택 기간'})
            </span>
            {productBreakdown.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {productBreakdown.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs flex justify-between items-center">
                    <span className="font-bold text-stone-800 text-sm truncate">
                      {item.name}
                    </span>
                    <span className="text-lg font-black text-stone-900 shrink-0 ml-2">
                      {item.count}<span className="text-xs font-normal text-stone-500">{item.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 py-3 text-center">출고 대기 중인 상품 내역이 없습니다.</p>
            )}
          </div>

          {/* 총 주문 금액 */}
          <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="text-xs font-bold text-stone-500">💰 {dateFilter === 'today' ? '오늘 총 주문금액' : '선택 기간 총 주문금액'}</span>
              <p className="text-xs text-stone-400">취소 주문 제외한 실매출 합계</p>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight" id="summary-total-revenue">
              {totalRevenue.toLocaleString()}원
            </div>
          </div>
        </section>

        {/* 6. 주문 목록 & 관리 화면 */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4" id="orders-management-section">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🔴</span>
                <h3 className="text-xl font-black text-stone-900">
                  주문 목록 관리
                </h3>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-black rounded-full">
                  처리대기 {pendingOrdersCount}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                날짜별로 주문을 모아보고 상세 주소 확인 및 전화걸기가 가능합니다
              </p>
            </div>

            {/* 9. [엑셀 다운로드] 버튼 (ParcelScan 연동용) */}
            <button
              onClick={exportOrdersToCSV}
              className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center gap-2 self-stretch sm:self-auto justify-center"
              id="download-excel-btn"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>[ 엑셀 다운로드 (송장용) ]</span>
            </button>
          </div>

          {/* 📅 Date selector bar for orders management */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-bold text-stone-700">날짜별 조회:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  dateFilter === 'today'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
                id="filter-date-today"
              >
                오늘 ({currentStoreOrders.filter((o) => getLocalDateKey(o.createdAt) === todayKey).length})
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('yesterday')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  dateFilter === 'yesterday'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
                id="filter-date-yesterday"
              >
                어제 ({currentStoreOrders.filter((o) => getLocalDateKey(o.createdAt) === yesterdayKey).length})
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('week')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  dateFilter === 'week'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
                id="filter-date-week"
              >
                최근 7일
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  dateFilter === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
                id="filter-date-all"
              >
                전체 ({currentStoreOrders.length})
              </button>

              {/* Direct specific date dropdown */}
              {availableDates.length > 0 && (
                <div className="relative">
                  <select
                    value={dateFilter.startsWith('20') ? dateFilter : ''}
                    onChange={(e) => {
                      if (e.target.value) setDateFilter(e.target.value);
                    }}
                    className="px-2.5 py-1 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    id="select-specific-date"
                  >
                    <option value="">특정 날짜 선택</option>
                    {availableDates.map((dateStr) => (
                      <option key={dateStr} value={dateStr}>
                        {dateStr}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 8. 주문 상태 필터 탭: [전체] [신규] [준비중] [출고] [취소] */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-100">
            <div className="flex gap-1.5 flex-1 overflow-x-auto pb-1 sm:pb-0">
              {(
                [
                  { id: 'all', label: '전체', count: dateScopedOrders.length },
                  { id: 'new', label: '🟡 신규', count: dateScopedOrders.filter((o) => o.status === 'new').length },
                  { id: 'preparing', label: '🔵 준비중', count: dateScopedOrders.filter((o) => o.status === 'preparing').length },
                  { id: 'shipped', label: '🟢 출고', count: dateScopedOrders.filter((o) => o.status === 'shipped').length },
                  { id: 'cancelled', label: '⚪ 취소', count: dateScopedOrders.filter((o) => o.status === 'cancelled').length },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
                    statusFilter === tab.id
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                  id={`filter-tab-${tab.id}`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === tab.id ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-700'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick search */}
            <div className="relative w-full sm:w-52 mt-2 sm:mt-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="고객명, 전화, 주소 검색"
                className="w-full pl-8 pr-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:bg-white text-stone-800"
                id="search-orders-input"
              />
            </div>
          </div>

          {/* Orders List Rows (Large, clear typography for seniors & mobile) */}
          <div className="divide-y divide-stone-100">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((ord) => {
                const itemsSummary = ord.items.map((i) => `${i.productName} ${i.quantity}${i.unit}`).join(', ');

                return (
                  <div
                    key={ord.id}
                    onClick={() => handleOpenOrderDetail(ord)}
                    className="py-3.5 sm:py-4 px-2.5 sm:px-3 hover:bg-stone-50/80 rounded-2xl transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 group"
                    id={`order-row-${ord.orderNumber}`}
                  >
                    {/* Customer & Items */}
                    <div className="flex items-start gap-3 min-w-0 w-full sm:w-auto">
                      <div className="pt-1 shrink-0">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusBadges[ord.status].dot}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between sm:justify-start gap-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base sm:text-lg font-black text-stone-900 group-hover:text-orange-600 transition">
                              {ord.customerName}
                            </h4>
                            <span className={`text-[11px] sm:text-xs px-2 py-0.5 rounded-md font-bold border ${statusBadges[ord.status].badge}`}>
                              {statusBadges[ord.status].label}
                            </span>
                          </div>
                          {/* Mobile timestamp */}
                          <span className="sm:hidden text-xs text-stone-400 font-medium">
                            {getLocalDateKey(ord.createdAt) === todayKey 
                              ? `오늘 ${new Date(ord.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
                              : `${new Date(ord.createdAt).getMonth() + 1}/${new Date(ord.createdAt).getDate()}`
                            }
                          </span>
                        </div>

                        <p className="text-sm font-extrabold text-stone-800 mt-1 line-clamp-1">
                          📦 {itemsSummary}
                        </p>

                        <p className="text-xs text-stone-500 mt-0.5 truncate">
                          {ord.address} {ord.detailAddress}
                        </p>
                      </div>
                    </div>

                    {/* Right side / Bottom on mobile: Amount & Quick Process button */}
                    <div
                      className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-left sm:text-right">
                        <span className="text-base sm:text-lg font-black text-stone-900 block">
                          {ord.totalAmount.toLocaleString()}원
                        </span>
                        <span className="hidden sm:block text-xs text-stone-500 font-medium">
                          {getLocalDateKey(ord.createdAt) === todayKey 
                            ? `오늘 ${new Date(ord.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
                            : getLocalDateKey(ord.createdAt) === yesterdayKey
                            ? `어제 ${new Date(ord.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
                            : `${new Date(ord.createdAt).getMonth() + 1}/${new Date(ord.createdAt).getDate()} ${new Date(ord.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
                          }
                        </span>
                      </div>

                      {/* [처리] / [출고완료] Fast Toggle Button */}
                      <div className="flex items-center gap-1.5">
                        {ord.status === 'new' && (
                          <button
                            onClick={() => updateOrderStatus(ord.id, 'preparing')}
                            className="py-1.5 sm:py-2 px-3 sm:px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95"
                            id={`btn-prep-${ord.orderNumber}`}
                          >
                            [ 준비 ]
                          </button>
                        )}

                        {ord.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(ord.id, 'shipped')}
                            className="py-1.5 sm:py-2 px-3 sm:px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95"
                            id={`btn-ship-${ord.orderNumber}`}
                          >
                            [ 출고 ]
                          </button>
                        )}

                        {ord.status === 'shipped' && (
                          <span className="py-1 sm:py-1.5 px-2.5 sm:px-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                            출고완료
                          </span>
                        )}

                        <button
                          onClick={() => handleOpenOrderDetail(ord)}
                          className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-200 rounded-xl transition"
                          title="상세보기"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 px-4 text-center">
                <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-stone-400">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-stone-800 mb-1">
                  {currentStoreOrders.length === 0 
                    ? '아직 접수된 주문이 없습니다' 
                    : '해당 조건의 주문이 없습니다'}
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mb-5 leading-relaxed">
                  {currentStoreOrders.length === 0 
                    ? '카톡 주문서 링크를 고객님들이나 단톡방에 공유하여 첫 주문을 받아보세요!' 
                    : '날짜 필터 또는 검색 조건을 변경해보세요.'}
                </p>
                {currentStoreOrders.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setIsKakaoModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-black text-xs rounded-xl shadow-xs transition active:scale-95"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>카톡 주문링크 복사 & 공유하기</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onUpdateStatus={updateOrderStatus}
      />

      {/* Store Settings Modal */}
      <StoreSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentStore={currentStore}
        onUpdateStore={updateStoreDetails}
        onAddProduct={addStoreProduct}
        onUpdateProduct={updateStoreProduct}
        onDeleteProduct={deleteStoreProduct}
      />

      {/* Kakao Share Modal */}
      <KakaoShareModal
        isOpen={isKakaoModalOpen}
        onClose={() => setIsKakaoModalOpen(false)}
        currentStore={currentStore}
        onOpenCustomerOrder={() => setActiveView('customer')}
      />

      {/* External Data Import Modal */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* New Store Quick Onboarding Modal */}
      <NewStoreOnboardingModal
        isOpen={isNewStoreModalOpen}
        onClose={() => setIsNewStoreModalOpen(false)}
        kakaoUser={null}
        onComplete={(newStoreId) => {
          setIsNewStoreModalOpen(false);
          setCurrentStoreId(newStoreId);
        }}
      />
    </div>
  );
};
