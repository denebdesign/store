import { Store, Order } from '../types';

export const INITIAL_STORES: Store[] = [
  {
    id: 'store-1789042553761',
    slug: '팜제주-gvjy',
    name: '팜.제주',
    shortName: '팜.제주',
    category: 'farm',
    intro: '산지에서 바로 수확해 신선하게 보내드립니다.',
    notice: '',
    emoji: '🌾',
    isOrderActive: true,
    orderDeadline: '매일 오후 5:00 마감 (익일 순차발송)',
    bankName: '농협',
    bankAccount: '123456789',
    bankHolder: '김경수',
    ownerPhone: '01026177201',
    ownerKakaoId: '5080914486',
    ownerKakaoNickname: '제주나는',
    managerKakaoIds: ['5080914486'],
    inviteCode: '7201', // Default invite code matching last 4 digits of phone
    products: [
      {
        id: 'p-1789124477209',
        name: '사과 3kg',
        price: 120,
        unit: '박스',
        emoji: '📦',
        description: '',
        isAvailable: true,
      },
    ],
  },
];

// Helper to generate realistic seed orders matching the prompt:
// 37 total orders, 82 boxes/units, ~1,247,000 won
function generateRealisticOrders(): Order[] {
  const customerNames = [
    '홍길동', '김미영', '박순자', '이영희', '최동원', '정수진', '한상우', '강민호', '윤서아', '조현우',
    '배지현', '임재범', '송혜교', '유재석', '하동훈', '노홍철', '정형돈', '김태호', '이효리', '이상순',
    '공효진', '조인성', '차은우', '박보검', '손흥민', '이강인', '김연아', '박지성', '아이유', '황정민',
    '마동석', '전지현', '이정재', '정우성', '고현정', '한지민', '공유'
  ];

  const sampleAddresses = [
    { city: '부산광역시 금정구 중앙대로 1793', detail: '101동 302호' },
    { city: '서울특별시 송파구 올림픽로 300', detail: '15층 1502호' },
    { city: '대전광역시 유성구 대학로 99', detail: '동화아파트 104동 502호' },
    { city: '경기도 수원시 영통구 광교호수공원로 80', detail: '201동 1204호' },
    { city: '대구광역시 수성구 범어동 128', detail: '자연채 식당 1층' },
    { city: '인천광역시 연수구 송도동 24-5', detail: '302동 1101호' },
    { city: '광주광역시 북구 용봉로 77', detail: '단독주택 대문 안' },
    { city: '울산광역시 남구 삼산로 228', detail: '롯데캐슬 102동 804호' },
    { city: '세종특별자치시 한누리대로 411', detail: '청사빌딩 403호' },
    { city: '강원도 춘천시 중앙로 1', detail: '2층 헤어스튜디오' },
    { city: '충청북도 청주시 상당구 상당로 69', detail: '103동 701호' },
    { city: '전라북도 전주시 완산구 홍산로 245', detail: '빌라 202호' },
    { city: '경상남도 창원시 성산구 원이대로 590', detail: '105동 402호' },
    { city: '제주시 도령로 40', detail: '신성빌딩 3층' }
  ];

  const deliveryMemos = [
    '문 앞에 놓아주세요.',
    '경비실에 맡겨주세요.',
    '배송 전 미리 문자 부탁드립니다.',
    '택배함에 넣어주세요.',
    '부재 시 전화 주세요.',
    '현관문 비밀번호 #1234'
  ];

  // Specific planned distribution:
  // 57 흙당근, 14 못난이, 11 당근즙 = 82 boxes total across 37 orders!
  // Prices: 흙당근 (25,000 / 10kg), 못난이 (15,000 / 10kg), 당근즙 (28,000 / 박스)
  // Let's create realistic items per order.
  const orderPlans = [
    { soil: 2, ugly: 0, juice: 0, status: 'new' as const }, // #1027 홍길동
    { soil: 1, ugly: 0, juice: 0, status: 'preparing' as const }, // #1028 김미영
    { soil: 3, ugly: 0, juice: 0, status: 'new' as const }, // #1029 박순자
    { soil: 0, ugly: 2, juice: 1, status: 'preparing' as const }, // #1030
    { soil: 5, ugly: 0, juice: 0, status: 'shipped' as const }, // #1031
    { soil: 2, ugly: 0, juice: 0, status: 'shipped' as const }, // #1032
    { soil: 0, ugly: 1, juice: 0, status: 'cancelled' as const }, // #1033
    { soil: 2, ugly: 0, juice: 1, status: 'new' as const },
    { soil: 1, ugly: 1, juice: 0, status: 'new' as const },
    { soil: 3, ugly: 0, juice: 0, status: 'preparing' as const },
    { soil: 2, ugly: 0, juice: 0, status: 'shipped' as const },
    { soil: 1, ugly: 0, juice: 1, status: 'shipped' as const },
    { soil: 2, ugly: 1, juice: 0, status: 'new' as const },
    { soil: 1, ugly: 0, juice: 0, status: 'preparing' as const },
    { soil: 2, ugly: 0, juice: 0, status: 'new' as const },
    { soil: 3, ugly: 0, juice: 0, status: 'shipped' as const },
    { soil: 0, ugly: 2, juice: 1, status: 'preparing' as const },
    { soil: 2, ugly: 0, juice: 0, status: 'new' as const },
    { soil: 1, ugly: 1, juice: 0, status: 'shipped' as const },
    { soil: 2, ugly: 0, juice: 1, status: 'shipped' as const },
    { soil: 1, ugly: 0, juice: 0, status: 'new' as const },
    { soil: 2, ugly: 1, juice: 0, status: 'new' as const },
    { soil: 1, ugly: 0, juice: 1, status: 'preparing' as const },
    { soil: 2, ugly: 0, juice: 0, status: 'shipped' as const },
    { soil: 3, ugly: 0, juice: 0, status: 'new' as const },
    { soil: 0, ugly: 2, juice: 0, status: 'shipped' as const },
    { soil: 2, ugly: 0, juice: 1, status: 'preparing' as const },
    { soil: 1, ugly: 0, juice: 0, status: 'new' as const },
    { soil: 2, ugly: 1, juice: 0, status: 'shipped' as const },
    { soil: 1, ugly: 0, juice: 1, status: 'shipped' as const },
    { soil: 2, ugly: 0, juice: 0, status: 'new' as const },
    { soil: 1, ugly: 1, juice: 0, status: 'new' as const },
    { soil: 2, ugly: 0, juice: 1, status: 'preparing' as const },
    { soil: 1, ugly: 0, juice: 0, status: 'shipped' as const },
    { soil: 2, ugly: 1, juice: 0, status: 'shipped' as const },
    { soil: 1, ugly: 0, juice: 1, status: 'new' as const },
    { soil: 1, ugly: 0, juice: 1, status: 'new' as const },
  ];

  const now = Date.now();

  return orderPlans.map((plan, index) => {
    const items = [];
    if (plan.soil > 0) {
      items.push({
        productId: 'p-carrot-soil-10kg',
        productName: '흙당근 10kg',
        price: 25000,
        unit: '박스',
        emoji: '📦',
        quantity: plan.soil,
      });
    }
    if (plan.ugly > 0) {
      items.push({
        productId: 'p-carrot-ugly-10kg',
        productName: '못난이 당근 10kg',
        price: 15000,
        unit: '박스',
        emoji: '📦',
        quantity: plan.ugly,
      });
    }
    if (plan.juice > 0) {
      items.push({
        productId: 'p-carrot-juice-30ea',
        productName: '구좌 당근즙 (30포 1박스)',
        price: 28000,
        unit: '박스',
        emoji: '🧃',
        quantity: plan.juice,
      });
    }

    const totalAmount = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const totalUnits = items.reduce((sum, it) => sum + it.quantity, 0);
    const addr = sampleAddresses[index % sampleAddresses.length];
    const phoneMid = String(1000 + (index * 73) % 8999).padStart(4, '0');
    const phoneEnd = String(2000 + (index * 91) % 7999).padStart(4, '0');

    // Realistic date spread: 
    // index 0~14: Today (0~10 hours ago)
    // index 15~26: Yesterday (24~34 hours ago)
    // index 27~36: 2 days ago (48~58 hours ago)
    let timeOffsetMinutes = 10 + index * 18;
    if (index >= 15 && index < 27) {
      timeOffsetMinutes = 24 * 60 + (index - 15) * 45;
    } else if (index >= 27) {
      timeOffsetMinutes = 48 * 60 + (index - 27) * 50;
    }
    const createdAt = new Date(now - timeOffsetMinutes * 60 * 1000).toISOString();

    return {
      id: `ord-${1027 + index}`,
      orderNumber: 1027 + index,
      storeId: 'store-jeju-carrot',
      createdAt,
      customerName: customerNames[index % customerNames.length],
      phone: `010-${phoneMid}-${phoneEnd}`,
      address: addr.city,
      detailAddress: addr.detail,
      deliveryRequest: deliveryMemos[index % deliveryMemos.length],
      items,
      totalAmount,
      totalUnits,
      status: plan.status,
    };
  });
}

export const INITIAL_ORDERS: Order[] = generateRealisticOrders();

