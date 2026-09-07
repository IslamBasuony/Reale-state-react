import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext(null);

function userStorageKey(userId) {
  return userId ? `realEstateFavorites_${userId}` : "realEstateFavorites_guest";
}

function readStoredIds(key) {
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(stored)) {
      return new Set(stored);
    }
  } catch {
    /* تجاهل بيانات التخزين غير الصالحة */
  }
  return new Set();
}

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const prevUserIdRef = useRef(userId);
  const [favorites, setFavorites] = useState(() =>
    readStoredIds(userStorageKey(userId)),
  );

  useEffect(() => {
    const prevUserId = prevUserIdRef.current;
    if (prevUserId === userId) return;
    prevUserIdRef.current = userId;

    setFavorites(readStoredIds(userStorageKey(userId)));
  }, [userId]);

  useEffect(() => {
    try {
      localStorage.setItem(
        userStorageKey(userId),
        JSON.stringify([...favorites]),
      );
    } catch {
      /* تجاهل أخطاء التخزين المحلي */
    }
  }, [favorites, userId]);

  const value = useMemo(
    () => ({
      favorites,
      isFavorite: (id) => favorites.has(id),
      toggleFavorite: (id) =>
        setFavorites((previous) => {
          const next = new Set(previous);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        }),
      clearFavorites: () => setFavorites(new Set()),
    }),
    [favorites],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

const DEFAULT_CONTEXT = {
  favorites: new Set(),
  isFavorite: () => false,
  toggleFavorite: () => {},
  clearFavorites: () => {},
};

export function useFavorites() {
  const context = useContext(FavoritesContext);
  return context ?? DEFAULT_CONTEXT;
}
