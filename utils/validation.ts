import { ValidationError, IngredientFormData } from '@/types/types';

export function validateIngredientForm(formData: IngredientFormData): ValidationError {
  const errors: ValidationError = {};
  
  // Name validation
  if (!formData.name.trim()) {
    errors.name = 'Name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  
  // Quantity validation
  if (!formData.quantity.trim()) {
    errors.quantity = 'Quantity is required';
  }
  
  // Debug date validation (in development mode)
  if (__DEV__ && formData.debugDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.debugDate)) {
      errors.debugDate = 'Invalid date format (use YYYY-MM-DD)';
    } else if (isNaN(Date.parse(formData.debugDate))) {
      errors.debugDate = 'Invalid date';
    }
  }
  
  // Expiry date validation
  if (!(formData.expiryDate instanceof Date) || isNaN(formData.expiryDate.getTime())) {
    errors.expiryDate = 'Valid expiry date is required';
  }
  
  return errors;
}
