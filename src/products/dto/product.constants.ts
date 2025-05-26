/**
 * Constants for product validation
 */
export const PRODUCT_CONSTANTS = {
  NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  DESCRIPTION: {
    MAX_LENGTH: 500,
  },
  STOCK: {
    MIN: 0,
    MAX: 999999,
  },
  PRICE: {
    MIN: 0.01,
    MAX: 999999.99,
    DECIMAL_PLACES: 2,
  },
  VALIDATION_MESSAGES: {
    NAME: {
      NOT_EMPTY: 'Product name is required',
      MIN_LENGTH: 'Product name must be at least 3 characters long',
      MAX_LENGTH: 'Product name cannot exceed 100 characters',
      STRING: 'Product name must be a string',
    },
    DESCRIPTION: {
      MAX_LENGTH: 'Product description cannot exceed 500 characters',
      STRING: 'Product description must be a string',
    },
    MIN_QUANTITY: {
      MIN: 'Minimum quantity cannot be negative',
      INTEGER: 'Minimum quantity must be an integer',
    },
    MAX_QUANTITY: {
      POSITIVE: 'Maximum quantity must be positive',
      INTEGER: 'Maximum quantity must be an integer',
      GREATER_THAN_MIN:
        'Maximum quantity must be greater than minimum quantity',
    },
    SUPPLIER_ID: {
      NOT_EMPTY: 'Supplier ID is required',
      POSITIVE: 'Supplier ID must be positive',
      INTEGER: 'Supplier ID must be an integer',
    },
    PRICE: {
      NOT_EMPTY: 'Price is required',
      POSITIVE: 'Price must be positive',
      MAX: 'Price cannot exceed 999,999.99',
      DECIMAL: 'Price must have at most 2 decimal places',
    },
    STOCK: {
      QUANTITY: {
        POSITIVE: 'Quantity must be positive',
        INTEGER: 'Quantity must be an integer',
        MAX: 'Quantity cannot exceed 999,999',
      },
      TYPE: {
        NOT_EMPTY: 'Stock adjustment type is required',
        INVALID: 'Invalid stock adjustment type',
      },
      REASON: {
        MAX_LENGTH: 'Reason cannot exceed 200 characters',
        STRING: 'Reason must be a string',
      },
      NOTES: {
        MAX_LENGTH: 'Notes cannot exceed 500 characters',
        STRING: 'Notes must be a string',
      },
    },
  },
} as const;
