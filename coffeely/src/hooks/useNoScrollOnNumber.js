/**
 * useNoScrollOnNumber.js
 *
 * Hook que registra UN SOLO listener global (wheel) en document
 * y hace blur() sobre cualquier <input type="number"> que esté
 * enfocado cuando el usuario gira la rueda del mouse.
 *
 * - Se registra con { passive: false } para poder llamar
 *   preventDefault() si hace falta (aunque solo blur() ya
 *   es suficiente para evitar que el valor cambie).
 * - Retorna el cleanup automáticamente via useEffect.
 * - Debe montarse UNA SOLA VEZ en el nivel más alto del árbol
 *   (App.jsx o main.jsx) para proteger todos los inputs del
 *   proyecto, incluidos los que se agreguen en el futuro.
 */
import { useEffect } from 'react'

export function useNoScrollOnNumber() {
  useEffect(() => {
    function handleWheel(e) {
      const el = document.activeElement
      if (el && el.tagName === 'INPUT' && el.type === 'number') {
        el.blur()
      }
    }

    document.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      document.removeEventListener('wheel', handleWheel, { passive: false })
    }
  }, [])
}
