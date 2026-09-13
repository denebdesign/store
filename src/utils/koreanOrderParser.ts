import { Order } from '../types';

export interface ExtractedOrderInfo {
  customerName: string;
  phone: string;
  address: string;
  detailAddress: string;
  deliveryRequest: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  matchedFromHistory?: {
    source: 'name' | 'phone';
    previousOrder: Order;
  };
}

// Words that frequently appear in greetings, orders, but are NOT names
const NON_NAME_WORDS = new Set([
  '안녕하세요', '안녕하세', '안녕하십니까', '안녕',
  '감사합니다', '고맙습니다', '수고하세요', '수고많으십니다',
  '주문합니다', '주문요', '주문할게요', '주문부탁드려요', '주문드립니다', '주문',
  '배송부탁드려요', '배송해주세요', '보내주세요', '부탁드려요', '부탁합니다', '배송',
  '입금완료', '입금했습니다', '입금자', '입금',
  '택배', '박스', '상자', '전화번호', '연락처', '주소', '성함', '이름', '받는분',
  '오늘', '내일', '얼마인가요', '계좌번호', '농장', '직거래'
]);

/**
 * Intelligent Korean SMS/Kakao message parser for farm orders
 */
export function parseKoreanOrderText(
  text: string,
  existingOrders: Order[] = [],
  storeProducts: Array<{ id: string; name: string; price: number; unit?: string }> = []
): ExtractedOrderInfo {
  if (!text || !text.trim()) {
    return {
      customerName: '',
      phone: '',
      address: '',
      detailAddress: '',
      deliveryRequest: '',
      productName: '',
      quantity: 1,
      unit: '박스',
      unitPrice: 0,
      totalAmount: 0,
    };
  }

  // Pre-normalize text (replace tildes, dashes, commas with spaces for easier token scanning)
  const rawText = text.trim();
  const normalizedSpaces = rawText.replace(/[~～!！?？,،]+/g, ' ');
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Phone Extraction (010-xxxx-xxxx, 010xxxxxxxx, 02-xxx-xxxx, etc.)
  let phone = '';
  const phoneMatch = rawText.match(/01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/);
  if (phoneMatch) {
    phone = phoneMatch[0].replace(/[^0-9]/g, '').replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
  }

  // 2. Quantity & Unit Extraction
  let quantity = 1;
  let unit = '박스';
  // Check patterns like: 2박스, 2 박스, 3개, 5kg, 수량: 2, 2상자
  const qtyMatch = rawText.match(/(\d+)\s*(박스|상자|개|세트|kg|키로|봉|포대|망)/i) ||
                   rawText.match(/수량\s*[:：]?\s*(\d+)/i);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1], 10) || 1;
    if (qtyMatch[2]) {
      const u = qtyMatch[2].toLowerCase();
      unit = u === '상자' ? '박스' : (u === '키로' ? 'kg' : u);
    }
  }

  // 3. Product Extraction
  let productName = '';
  let unitPrice = 0;

  // A. Check if mentioned words match existing store products
  for (const prod of storeProducts) {
    if (prod.name && rawText.includes(prod.name)) {
      productName = prod.name;
      unitPrice = prod.price;
      unit = prod.unit || unit;
      break;
    }
  }

  // B. If not in store products, extract agricultural product names directly from Korean text!
  // e.g. "감귤2박스", "귤 2박스", "사과 3박스", "당근 5kg", "샤인머스캣", "한라봉", "천혜향", "마늘", "고구마", "양파"
  if (!productName) {
    // Pattern: [과일/채소/단어] [수량]박스
    const prodQtyMatch = rawText.match(/([가-힣a-zA-Z0-9]+)\s*(\d+)\s*(?:박스|상자|개|세트|kg|키로|봉|포대)/);
    if (prodQtyMatch) {
      const candidate = prodQtyMatch[1].trim();
      if (!NON_NAME_WORDS.has(candidate) && candidate.length >= 1 && candidate.length <= 10) {
        productName = candidate;
      }
    }
  }

  // C. Common produce dictionary match
  if (!productName) {
    const COMMON_PRODUCE = [
      '감귤', '귤', '노지감귤', '타이벡감귤', '황금향', '레드향', '천혜향', '한라봉', '카라향',
      '사과', '배', '포도', '샤인머스캣', '복숭아', '자두', '딸기', '수박', '참외', '토마토',
      '당근', '제주당근', '감자', '고구마', '마늘', '양파', '대파', '양배추', '브로콜리',
      '쌀', '현미', '잡곡', '꿀', '참기름', '들기름', '고춧가루', '배추', '무'
    ];
    for (const item of COMMON_PRODUCE) {
      if (rawText.includes(item)) {
        productName = item;
        break;
      }
    }
  }

  // Default fallback if no specific produce found
  if (!productName) {
    productName = storeProducts[0]?.name || '농산물';
    unitPrice = storeProducts[0]?.price || 30000;
  } else if (unitPrice === 0) {
    // Find matching store product price or reasonable fallback
    const matched = storeProducts.find((p) => p.name.includes(productName) || productName.includes(p.name));
    unitPrice = matched ? matched.price : (storeProducts[0]?.price || 30000);
  }

  // 4. Korean Customer Name or Business/Shop Name Extraction
  let customerName = '';

  // A. Explicit labels: 이름: 홍길동, 성함: 홍길동, 받는분: 홍길동, 주문자: 홍길동
  const explicitNameMatch = rawText.match(/(?:이름|성함|수령인|받는\s*분|주문자)\s*[:：]\s*([가-힣a-zA-Z0-9\s]{2,15})/);
  if (explicitNameMatch) {
    customerName = explicitNameMatch[1].trim();
  }

  // B. Pattern: "~입니다" or "OO입니다" (e.g. "함덕 라플라주입니다", "김철수입니다", "제주카페입니다")
  if (!customerName) {
    const imnidaMatch = rawText.match(/([가-힣a-zA-Z0-9\s]{2,16})\s*(?:입니다|이에용|예요|입니당)/);
    if (imnidaMatch) {
      let candidate = imnidaMatch[1].trim();
      // Remove greetings inside candidate (e.g., "안녕하세요 함덕 라플라주" -> "함덕 라플라주")
      candidate = candidate
        .replace(/^(안녕하세요|안녕하세|안녕하십니까|수고하세요|수고많으십니다)\s*/g, '')
        .replace(/^[~～\s\-_,]+/g, '')
        .trim();
      if (candidate && !NON_NAME_WORDS.has(candidate)) {
        customerName = candidate;
      }
    }
  }

  // C. Line-by-line first token analysis
  if (!customerName) {
    for (const line of lines) {
      const tokens = line.split(/[\s~～,:]+/).map((t) => t.trim()).filter(Boolean);
      for (const token of tokens) {
        if (NON_NAME_WORDS.has(token)) continue;
        if (token === productName || token.includes(productName)) continue;
        if (token.match(/\d/)) continue; // skip numbers/addresses/phones
        if (token.length >= 2 && token.length <= 10) {
          customerName = token;
          break;
        }
      }
      if (customerName) break;
    }
  }

  // 5. Address Extraction
  let address = '';
  let detailAddress = '';

  // Regex matching South Korean administrative division addresses
  // (e.g., 서울시 강남구 ..., 제주시 조천읍 ..., 서귀포시 남원읍 ..., 충남 서산시 ...)
  const koreanAddressRegex = /([가-힣]+(?:특별자치도|특별시|광역시|도|시|군|구)\s+[가-힣0-9\s-]+(?:읍|면|동|리|로|길)\s*[\d-]+(?:\s*번지)?)/;
  const addressMatch = rawText.match(koreanAddressRegex);
  if (addressMatch) {
    address = addressMatch[1].trim();
    // Check if there is detail address following it
    const afterAddress = rawText.slice(rawText.indexOf(address) + address.length).trim();
    const detailCandidate = afterAddress.split('\n')[0]?.trim();
    if (detailCandidate && !detailCandidate.includes('010') && detailCandidate.length < 30) {
      detailAddress = detailCandidate;
    }
  } else {
    // Look for lines containing typical address keywords
    const addrLine = lines.find((l) =>
      /(?:도\s|시\s|군\s|구\s|읍|면|동|리|로\s?\d|길\s?\d|아파트|호|층)/.test(l) &&
      !l.includes('010') &&
      !l.includes('배송부탁') &&
      !l.includes('박스')
    );
    if (addrLine) {
      address = addrLine.replace(/(?:주소|배송지)\s*[:：]?/, '').trim();
    }
  }

  // 6. Delivery Request Extraction
  let deliveryRequest = '';
  const reqMatch = rawText.match(/(?:요청사항|배송요청|메모|요청)\s*[:：]\s*([^\n]+)/);
  if (reqMatch) {
    deliveryRequest = reqMatch[1].trim();
  } else if (rawText.includes('경비실')) {
    deliveryRequest = '부재 시 경비실에 맡겨주세요.';
  } else if (rawText.includes('문 앞') || rawText.includes('문앞')) {
    deliveryRequest = '부재 시 문 앞에 놓아주세요.';
  }

  // 7. HISTORICAL DATABASE MATCHING (단골 고객 자동 매칭!)
  // If we found phone OR customer name, query existingOrders for previous address & phone!
  let matchedFromHistory: ExtractedOrderInfo['matchedFromHistory'] = undefined;

  if (existingOrders && existingOrders.length > 0) {
    let matchedOrder: Order | undefined;

    // A. Match by phone first
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      matchedOrder = existingOrders.find((o) => o.phone.replace(/[^0-9]/g, '') === cleanPhone);
      if (matchedOrder) {
        matchedFromHistory = { source: 'phone', previousOrder: matchedOrder };
      }
    }

    // B. Match by customer name or business name if no phone or incomplete address
    if (!matchedOrder && customerName) {
      const cleanTargetName = customerName.replace(/\s+/g, '').toLowerCase();
      matchedOrder = existingOrders.find((o) => {
        const oName = (o.customerName || '').replace(/\s+/g, '').toLowerCase();
        return oName && (oName === cleanTargetName || oName.includes(cleanTargetName) || cleanTargetName.includes(oName));
      });
      if (matchedOrder) {
        matchedFromHistory = { source: 'name', previousOrder: matchedOrder };
      }
    }

    // If matched with previous order, auto-complete missing fields!
    if (matchedOrder) {
      if (!phone && matchedOrder.phone) {
        phone = matchedOrder.phone;
      }
      if (!address && matchedOrder.address) {
        address = matchedOrder.address;
        detailAddress = matchedOrder.detailAddress || '';
      }
      if (!deliveryRequest && matchedOrder.deliveryRequest) {
        deliveryRequest = matchedOrder.deliveryRequest;
      }
    }
  }

  const totalAmount = unitPrice * quantity;

  return {
    customerName: customerName || '',
    phone: phone || '',
    address: address || '',
    detailAddress: detailAddress || '',
    deliveryRequest: deliveryRequest || (address ? '배송 전 연락 바랍니다.' : ''),
    productName,
    quantity,
    unit,
    unitPrice,
    totalAmount,
    matchedFromHistory,
  };
}
