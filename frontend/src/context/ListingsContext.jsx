import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { getListings } from "../api/api.js";

const ListingsContext = createContext(null);

const STALE_MS = 5 * 60 * 1000;

export const ListingsProvider = ({ children }) => {
  const [listings, setListings] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const fetchedAt = useRef(0);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (listings && Date.now() - fetchedAt.current < STALE_MS) return;
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(false);
    getListings()
      .then((data) => {
        setListings(data);
        fetchedAt.current = Date.now();
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        loadingRef.current = false;
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetch = useCallback(() => {
    fetchedAt.current = 0;
    setListings(null);
    setLoading(true);
    setError(false);
    loadingRef.current = true;
    getListings()
      .then((data) => {
        setListings(data);
        fetchedAt.current = Date.now();
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        loadingRef.current = false;
        setLoading(false);
      });
  }, []);

  const value = React.useMemo(
    () => ({
      listings,
      loading,
      error,
      refetch,
    }),
    [listings, loading, error, refetch]
  );

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  );
};

export const useListings = () => {
  const ctx = useContext(ListingsContext);
  if (!ctx) {
    throw new Error("useListings must be used within a ListingsProvider");
  }
  return ctx;
};
