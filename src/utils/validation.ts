import { CustomerInfo } from '../types';

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

// Password validation
export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

// Name validation
export function isValidName(name: string): boolean {
  const nameRegex = /^[a-zA-Z\s-']{2,50}$/;
  return nameRegex.test(name.trim());
}

// Phone validation
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone.trim());
}

// Search query sanitization
export function sanitizeSearchQuery(query: string): string {
  // Only allow alphanumeric characters and spaces
  return query
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove all non-alphanumeric characters except spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
}

// Text sanitization for general input
export function sanitizeText(text: string): string {
  return text.trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// Validate all customer information
export function validateCustomerInfo(info: CustomerInfo): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!isValidName(info.firstName)) {
    errors.firstName = 'Please enter a valid first name (2-50 characters, letters only)';
  }

  if (!isValidName(info.lastName)) {
    errors.lastName = 'Please enter a valid last name (2-50 characters, letters only)';
  }

  if (!isValidEmail(info.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!info.address.trim() || info.address.length < 5) {
    errors.address = 'Please enter a valid address (minimum 5 characters)';
  }

  if (!isValidPhone(info.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Password strength checker
export function getPasswordStrength(password: string): {
  score: number;
  feedback: string;
} {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score < 2) {
    feedback.push('Very weak - Use a longer password with mixed characters');
  } else if (score < 3) {
    feedback.push('Weak - Add numbers and special characters');
  } else if (score < 4) {
    feedback.push('Moderate - Add more variety in characters');
  } else if (score < 5) {
    feedback.push('Strong - Good password!');
  } else {
    feedback.push('Very strong - Excellent password!');
  }

  return {
    score,
    feedback: feedback[0]
  };
}