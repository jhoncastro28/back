/**
 * Inventory Movement Types and Common Interfaces
 */

/**
 * Types of inventory movements available in the system
 */
export enum MovementType {
  /**
   * Product entering the inventory (purchase, return, adjustment)
   */
  ENTRY = 'ENTRY',

  /**
   * Product leaving the inventory (sale, damage, adjustment)
   */
  EXIT = 'EXIT',
}

/**
 * Reasons for inventory movements
 */
export enum MovementReason {
  /**
   * Product purchased from supplier
   */
  PURCHASE = 'PURCHASE',

  /**
   * Product sold to customer
   */
  SALE = 'SALE',

  /**
   * Product returned by customer
   */
  RETURN = 'RETURN',

  /**
   * Product damaged or expired
   */
  DAMAGE = 'DAMAGE',

  /**
   * Inventory adjustment (count correction)
   */
  ADJUSTMENT = 'ADJUSTMENT',

  /**
   * Initial stock setup
   */
  INITIAL_STOCK = 'INITIAL_STOCK',
}

/**
 * Status of an inventory movement
 */
export enum MovementStatus {
  /**
   * Movement is pending approval
   */
  PENDING = 'PENDING',

  /**
   * Movement has been approved and processed
   */
  APPROVED = 'APPROVED',

  /**
   * Movement has been rejected
   */
  REJECTED = 'REJECTED',

  /**
   * Movement has been cancelled
   */
  CANCELLED = 'CANCELLED',
}

/**
 * Common validation constants for inventory movements
 */
export const MOVEMENT_CONSTANTS = {
  MIN_QUANTITY: 0.01,
  MAX_QUANTITY: 1000000,
  MIN_UNIT_PRICE: 0,
  MAX_UNIT_PRICE: 1000000,
  NOTES_MAX_LENGTH: 500,
  REFERENCE_MAX_LENGTH: 100,
} as const;
