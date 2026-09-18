export interface KakaoUser {
  id: string;
  nickname: string;
  email?: string;
  profileImage?: string;
}

const DEFAULT_KAKAO_JS_KEY = 'edef55657790eca6f8faa4f76b7beb10';

export const getKakaoJsKey = (): string => {
  return (import.meta as any).env?.VITE_KAKAO_JAVASCRIPT_KEY || DEFAULT_KAKAO_JS_KEY;
};

export const initKakaoSDK = (): boolean => {
  if (typeof window === 'undefined') return false;
  const kakao = (window as any).Kakao;
  if (!kakao) return false;
  if (!kakao.isInitialized()) {
    try {
      kakao.init(getKakaoJsKey());
    } catch (e) {
      console.warn('Kakao init err:', e);
    }
  }
  return kakao.isInitialized();
};

export const loginWithKakao = async (): Promise<{ success: boolean; user?: KakaoUser; error?: string }> => {
  initKakaoSDK();
  const kakao = (window as any).Kakao;

  if (!kakao || !kakao.Auth || typeof kakao.Auth.login !== 'function') {
    return {
      success: false,
      error: '카카오 SDK 인증 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.',
    };
  }

  return new Promise((resolve) => {
    // Safety timer in case popup is blocked
    const timer = setTimeout(() => {
      resolve({
        success: false,
        error: '팝업이 브라우저에 의해 차단되었거나 닫혔습니다. 브라우저 주소창의 팝업 차단을 해제하거나 새 탭에서 열어주세요.',
      });
    }, 15000);

    try {
      kakao.Auth.login({
        persistAccessToken: true,
        success: (authObj: any) => {
          clearTimeout(timer);
          kakao.API.request({
            url: '/v2/user/me',
            success: (res: any) => {
              const kakaoAccount = res.kakao_account || {};
              const profile = kakaoAccount.profile || {};
              resolve({
                success: true,
                user: {
                  id: String(res.id),
                  nickname: profile.nickname || '사장님',
                  profileImage: profile.profile_image_url || '',
                  email: kakaoAccount.email || '',
                },
              });
            },
            fail: () => {
              resolve({
                success: true,
                user: {
                  id: 'kakao_' + Date.now(),
                  nickname: '사장님',
                },
              });
            },
          });
        },
        fail: (err: any) => {
          clearTimeout(timer);
          resolve({
            success: false,
            error: err?.error_description || err?.msg || '로그인 취소 또는 오류',
          });
        },
      });
    } catch (err: any) {
      clearTimeout(timer);
      resolve({
        success: false,
        error: err?.message || '카카오 로그인 창을 열 수 없습니다.',
      });
    }
  });
};

export const shareStoreToKakaoTalk = (
  store: { name: string; shortName: string; intro: string; emoji?: string },
  orderUrl: string
): boolean => {
  initKakaoSDK();
  const kakao = (window as any).Kakao;
  if (!kakao) return false;

  const shareFn = kakao.Share?.sendDefault || kakao.Link?.sendDefault;
  if (typeof shareFn !== 'function') return false;

  try {
    shareFn({
      objectType: 'feed',
      content: {
        title: `[${store.shortName}] 간편 주문서`,
        description: store.intro || '회원가입 없이 터치 몇 번으로 간편하게 주문하세요.',
        imageUrl: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&auto=format&fit=crop&q=80',
        link: {
          mobileWebUrl: orderUrl,
          webUrl: orderUrl,
        },
      },
      buttons: [
        {
          title: '주문서 작성하기',
          link: {
            mobileWebUrl: orderUrl,
            webUrl: orderUrl,
          },
        },
      ],
    });
    return true;
  } catch (err) {
    console.warn('[Kakao] Share failed:', err);
    return false;
  }
};

