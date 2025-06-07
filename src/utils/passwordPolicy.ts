/**
 * Password Policy Utilities
 * Ensures strong passwords for admin-created accounts
 */

export interface PasswordValidation {
  isValid: boolean;
  score: number; // 0-100
  errors: string[];
  suggestions: string[];
}

/**
 * Validate password strength
 */
export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length >= 12) {
    score += 25;
  } else {
    score += 15;
    suggestions.push('Use 12+ characters for better security');
  }

  // Character variety checks
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters');
  } else {
    score += 15;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters');
  } else {
    score += 15;
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain numbers');
  } else {
    score += 15;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain special characters');
  } else {
    score += 20;
  }

  // Common patterns check
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Avoid repeating characters');
    score -= 10;
  }

  if (/123|abc|qwe|password|admin/i.test(password)) {
    errors.push('Avoid common patterns and words');
    score -= 20;
  }

  // Add suggestions based on score
  if (score < 50) {
    suggestions.push('Consider using a passphrase with mixed case and symbols');
  }

  return {
    isValid: errors.length === 0 && score >= 60,
    score: Math.max(0, Math.min(100, score)),
    errors,
    suggestions
  };
};

/**
 * Generate a secure random password
 */
export const generateSecurePassword = (length: number = 16): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Get password strength color for UI
 */
export const getPasswordStrengthColor = (score: number): { bg: string; text: string; label: string } => {
  if (score >= 80) {
    return { bg: 'bg-green-500', text: 'text-green-700', label: 'Strong' };
  } else if (score >= 60) {
    return { bg: 'bg-yellow-500', text: 'text-yellow-700', label: 'Good' };
  } else if (score >= 40) {
    return { bg: 'bg-orange-500', text: 'text-orange-700', label: 'Fair' };
  } else {
    return { bg: 'bg-red-500', text: 'text-red-700', label: 'Weak' };
  }
}; 