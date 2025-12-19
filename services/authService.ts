const STORAGE_KEY = "autotally_auth_hash";
const SALT = "autotally-secure-salt-v1";

// Detect Electron
const isElectron = (): boolean => {
  return !!(window as any)?.auth?.hashPin;
};

export const hashPin = async (pin: string): Promise<string> => {
  // Electron path (Node crypto via preload)
  if (isElectron()) {
    return (window as any).auth.hashPin(pin);
  }

  // Browser path (Web Crypto)
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto API not available");
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(pin + SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
};

export const savePin = async (pin: string): Promise<void> => {
  const hash = await hashPin(pin);
  localStorage.setItem(STORAGE_KEY, hash);
};

export const verifyPin = async (pin: string): Promise<boolean> => {
  const storedHash = localStorage.getItem(STORAGE_KEY);
  if (!storedHash) return false;
  const inputHash = await hashPin(pin);
  return inputHash === storedHash;
};

export const hasPinSetup = (): boolean => {
  return !!localStorage.getItem(STORAGE_KEY);
};

export const removePin = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
