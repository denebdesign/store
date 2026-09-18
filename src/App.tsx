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
import { InviteCodeAuthModal } from './components/InviteCodeAuthModal';
import { KakaoUser } from './services/kakaoService';
import { saveUserProfileToFirestore } from './services/firestoreService';
import { Store } from './types';

function AppContent() {
  const {
    stores,
    currentStore,
    setCurrentStoreId,
    activeView,
    setActiveView,
    registerManagerToStore,
  } = useStore();

  const [isBossAuthenticated, setIsBossAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('boss_auth_session') === 'true';
    }
    return false;
  });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [pendingStore, setPendingStore] = useState<Store | null>(null);
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

      // Check if user is already an authorized manager or owner of the current store or any store
      const storeToCheck = currentStore || stores[0];
      const isAuthorizedInCurrent =
        storeToCheck &&
        (storeToCheck.ownerKakaoId === user.id ||
          (storeToCheck.managerKakaoIds && storeToCheck.managerKakaoIds.includes(user.id)));

      // Check if user is manager in any other store
      const userOwnedOrManagedStore = stores.find(
        (s) => s.ownerKakaoId === user.id || (s.managerKakaoIds && s.managerKakaoIds.includes(user.id))
      );

      if (isAuthorizedInCurrent) {
        // User is already recognized as manager in this store! Directly grant access
        setIsBossAuthenticated(true);
        localStorage.setItem('boss_auth_session', 'true');
      } else if (userOwnedOrManagedStore) {
        // User already has another store they manage
        setCurrentStoreId(userOwnedOrManagedStore.id);
        setIsBossAuthenticated(true);
        localStorage.setItem('boss_auth_session', 'true');
      } else {
        // User is NOT yet in managerKakaoIds for this store!
        // Show Invite Code modal to verify if they are indeed the boss/authorized staff
        setPendingStore(storeToCheck);
        setIsInviteModalOpen(true);
      }
    } else {
      // Demo / test mode login
      setIsBossAuthenticated(true);
      localStorage.setItem('boss_auth_session', 'true');
    }
  };

  // Called when the user enters the correct inviteCode in the modal
  const handleInviteCodeVerified = async () => {
    if (pendingStore && kakaoUser) {
      try {
        await registerManagerToStore(pendingStore.id, kakaoUser.id, kakaoUser.nickname);
      } catch (e) {
        console.error('Failed to register manager:', e);
      }
      setCurrentStoreId(pendingStore.id);
    }
    setIsInviteModalOpen(false);
    setIsBossAuthenticated(true);
    localStorage.setItem('boss_auth_session', 'true');
  };

  const handleLogout = () => {
    setIsBossAuthenticated(false);
    setKakaoUser(null);
    setIsInviteModalOpen(false);
    setPendingStore(null);
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

      {/* Invite Code Verification Modal for Customers / Managers */}
      <InviteCodeAuthModal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setPendingStore(null);
        }}
        kakaoUser={kakaoUser}
        targetStore={pendingStore || currentStore}
        onVerified={handleInviteCodeVerified}
        onGoCustomerView={() => {
          setIsInviteModalOpen(false);
          setActiveView('customer');
        }}
        onOpenNewStoreModal={() => {
          setIsInviteModalOpen(false);
          setIsOnboardingOpen(true);
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
