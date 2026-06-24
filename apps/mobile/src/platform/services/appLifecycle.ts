import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export type AppLifecycleSnapshot = {
  status: AppStateStatus;
  isActive: boolean;
};

export function useAppLifecycle(): AppLifecycleSnapshot {
  const [status, setStatus] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setStatus);
    return () => subscription.remove();
  }, []);

  return {
    status,
    isActive: status === 'active',
  };
}
