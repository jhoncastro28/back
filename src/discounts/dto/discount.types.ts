/**
 * Discount Types and Common Interfaces
 */

/**
 * Types of discounts available in the system
 */
export enum DiscountType {
  /**
   * Percentage discount (e.g., 10% off)
   */
  PERCENTAGE = 'PERCENTAGE',

  /**
   * Fixed amount discount (e.g., $10 off)
   */
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

/**
 * Status of a discount based on its dates and active flag
 */
export enum DiscountStatus {
  /**
   * Discount is active and currently applicable
   */
  ACTIVE = 'ACTIVE',

  /**
   * Discount is inactive (manually disabled)
   */
  INACTIVE = 'INACTIVE',

  /**
   * Discount hasn't started yet
   */
  SCHEDULED = 'SCHEDULED',

  /**
   * Discount has expired
   */
  EXPIRED = 'EXPIRED',
}

/**
 * Common validation constants for discounts
 */
export const DISCOUNT_CONSTANTS = {
  MIN_PERCENTAGE: 0.01,
  MAX_PERCENTAGE: 100,
  MIN_FIXED_AMOUNT: 0.01,
  MAX_FIXED_AMOUNT: 1000000,
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
} as const;
