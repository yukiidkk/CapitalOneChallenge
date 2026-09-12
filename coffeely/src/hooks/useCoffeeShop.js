/**
 * useCoffeeShop.js
 * Hook personalizado para acceder al contexto del negocio (CoffeeShopContext).
 * Re-exporta useApp con un nombre semánticamente alineado al proyecto.
 *
 * Uso:
 *   import { useCoffeeShop } from '../hooks/useCoffeeShop'
 *   const { user, business, login, logout } = useCoffeeShop()
 */
export { useApp as useCoffeeShop } from '../context/CoffeeShopContext'
