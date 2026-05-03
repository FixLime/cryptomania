// Тонкая обёртка над Telegram WebApp API + хаптики

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export const tg = (typeof window !== 'undefined' && window.Telegram?.WebApp) || null;

export function initTelegram() {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation();
  } catch {}
}

export function getInitData(): string {
  return tg?.initData ?? '';
}

export function getUser() {
  return tg?.initDataUnsafe?.user ?? null;
}

// === HAPTIC FEEDBACK ===
type ImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type NotifType = 'error' | 'success' | 'warning';

export function hapticImpact(style: ImpactStyle = 'medium') {
  try {
    tg?.HapticFeedback?.impactOccurred(style);
  } catch {}
}

export function hapticNotification(type: NotifType) {
  try {
    tg?.HapticFeedback?.notificationOccurred(type);
  } catch {}
}

export function hapticSelection() {
  try {
    tg?.HapticFeedback?.selectionChanged();
  } catch {}
}

export function showAlert(message: string) {
  if (tg?.showAlert) tg.showAlert(message);
  else alert(message);
}

export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (tg?.showConfirm) {
      tg.showConfirm(message, (ok: boolean) => resolve(ok));
    } else {
      resolve(window.confirm(message));
    }
  });
}

export function setMainButton(text: string, onClick: () => void) {
  if (!tg?.MainButton) return () => {};
  tg.MainButton.setText(text);
  tg.MainButton.show();
  tg.MainButton.onClick(onClick);
  return () => {
    tg.MainButton.offClick(onClick);
    tg.MainButton.hide();
  };
}
