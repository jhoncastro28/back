/**
 * Constants for price validation
 */
export const PRICE_CONSTANTS = {
  MIN_PRICE: 0.01,
  MAX_PRICE: 999999.99,
  DECIMAL_PLACES: 2,
  MIN_PRODUCT_ID: 1,
  VALIDATION_MESSAGES: {
    PURCHASE_PRICE: {
      POSITIVE: 'Purchase price must be positive',
      MAX: 'Purchase price cannot exceed 999,999.99',
      DECIMAL: 'Purchase price must have at most 2 decimal places',
    },
    SELLING_PRICE: {
      POSITIVE: 'Selling price must be positive',
      MAX: 'Selling price cannot exceed 999,999.99',
      DECIMAL: 'Selling price must have at most 2 decimal places',
    },
    PRODUCT_ID: {
      INT: 'Product ID must be an integer',
      MIN: 'Product ID must be at least 1',
    },
  },
} as const;
