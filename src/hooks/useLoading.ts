"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Hook anti-double-clic pour les boutons d'action.
 * Garantit qu'une action ne peut être déclenchée qu'une seule fois
 * tant que la promesse n'est pas résolue.
 * 
 * @example
 * const { isLoading, execute } = useLoading();
 * 
 * <Button disabled={isLoading} onClick={execute(handleSubmit)}>
 *   {isLoading ? <LottieLoader size={20} /> : "Confirmer"}
 * </Button>
 */
export function useLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pendingRef = useRef(false);

  const execute = useCallback(<T>(fn: () => Promise<T>): (() => Promise<T | undefined>) => {
    return async () => {
      // Bloque si déjà en cours
      if (pendingRef.current) return undefined;
      
      pendingRef.current = true;
      setIsLoading(true);
      
      try {
        return await fn();
      } finally {
        pendingRef.current = false;
        setIsLoading(false);
      }
    };
  }, []);

  return { isLoading, execute };
}

/**
 * Version simplifiée pour les cas où on veut juste tracker l'état loading
 * sans utiliser le pattern execute.
 * 
 * @example
 * const [isLoading, setIsLoading] = useState(false);
 * 
 * const handleClick = async () => {
 *   if (isLoading) return;
 *   setIsLoading(true);
 *   try { await apiCall(); } finally { setIsLoading(false); }
 * };
 */
export { useState as useSimpleLoading };