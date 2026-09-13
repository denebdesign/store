/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { CustomerOrderView } from './components/CustomerOrderView';
import { BossDashboardView } from './components/BossDashboardView';
import { BossKakaoLoginView } from './components/BossKakaoLoginView';
import { NewStoreOnboardingModal } from './components/NewStoreOnboardingModal';
import { KakaoUser } from './services/kakaoService';
import { saveUserProfileToFirestore } from './services/firestoreService';

function AppContent() {
  const {
    stores,
    currentStore,
    setCurrentStoreId,
    activeView,
    setActiveView,
  } = useStore();

  const [isBossAuthenticated, setIsBossAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('boss_auth_session') === 'true';
    }
    return false;
  });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [kakaoUser, setKakaoUser] = useState<KakaoUser | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('boss_kakao_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id) {
            saveUserProfileToFirestore(parsed).catch(console.error);
          }
          return parsed;
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const handleLoginSuccess = (user?: KakaoUser) => {
    if (user) {
      setKakaoUser(user);
      try {
        localStorage.setItem('boss_kakao_user', JSON.stringify(user));
      } catch (e) {
        console.error(e);
      }

      // Save user profile directly to Firestore
      saveUserProfileToFirestore(user).catch(console.error);

      // Check if user already owns a store
      const userStore = stores.find((s) => s.ownerKakaoId === user.id);
      if (userStore) {
        setCurrentStoreId(userStore.id);
        setIsBossAuthenticated(true);
        localStorage.setItem('boss_auth_session', 'true');
      } else {
        // Offer clean new store setup for real Kakao-authenticated boss
        setIsOnboardingOpen(true);
      }
    } else {
      // Demo / test mode login
      setIsBossAuthenticated(true);
      localStorage.setItem('boss_auth_session', 'true');
    }
  };

  const handleLogout = () => {
    setIsBossAuthenticated(false);
    setKakaoUser(null);
    localStorage.removeItem('boss_auth_session');
    localStorage.removeItem('boss_kakao_user');
    setActiveView('boss');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-stone-100/60 flex flex-col font-sans">
      {/* Main View Area */}
      <div className="flex-1 w-full max-w-full flex flex-col items-center justify-center overflow-x-hidden">
        {activeView === 'customer' ? (
          <div className="flex-1 w-full max-w-full flex flex-col items-center justify-start overflow-x-hidden">
            {/* Customer Order Experience */}
            <CustomerOrderView />
          </div>
        ) : !isBossAuthenticated ? (
          <BossKakaoLoginView
            onSuccess={handleLoginSuccess}
            onOpenNewStoreModal={(user) => {
              if (user) setKakaoUser(user);
              setIsOnboardingOpen(true);
            }}
            onGoCustomerOrder={() => setActiveView('customer')}
          />
        ) : (
          <BossDashboardView 
            onLogout={handleLogout} 
          />
        )}
      </div>

      {/* New Store Quick Onboarding Modal */}
      <NewStoreOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => {
          setIsOnboardingOpen(false);
          setIsBossAuthenticated(true);
          localStorage.setItem('boss_auth_session', 'true');
        }}
        kakaoUser={kakaoUser}
        onComplete={(newStoreId) => {
          setIsOnboardingOpen(false);
          setIsBossAuthenticated(true);
          localStorage.setItem('boss_auth_session', 'true');
          if (newStoreId) {
            setCurrentStoreId(newStoreId);
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
