/**
 * Password validation utilities
 * These functions help validate password strength and provide feedback to users
 */

export interface PasswordStrength {
  score: number; // 0-4 (0: very weak, 4: very strong)
  feedback: string;
  isValid: boolean;
  validations: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

/**
 * Validates a password and returns detailed feedback
 * @param password The password to validate
 * @param minScore The minimum score required for the password to be considered valid (0-4)
 * @returns Password strength details
 */
export function validatePassword(password: string, minScore: number = 2): PasswordStrength {
  // Initialize validations
  const validations = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  // Calculate score (0-4)
  let score = 0;
  if (validations.minLength) score++;
  if (validations.hasUppercase && validations.hasLowercase) score++;
  if (validations.hasNumber) score++;
  if (validations.hasSpecialChar) score++;
  
  // Adjust score for very short passwords
  if (password.length < 6) score = 0;
  
  // Generate feedback based on score and validations
  let feedback = '';
  
  if (score === 0) {
    feedback = 'Very weak password';
  } else if (score === 1) {
    feedback = 'Weak password';
  } else if (score === 2) {
    feedback = 'Fair password';
  } else if (score === 3) {
    feedback = 'Good password';
  } else {
    feedback = 'Strong password';
  }
  
  // Add specific feedback for missing criteria
  if (!validations.minLength) {
    feedback += '. Add more characters (at least 8)';
  } else if (!validations.hasUppercase) {
    feedback += '. Add uppercase letters';
  } else if (!validations.hasLowercase) {
    feedback += '. Add lowercase letters';
  } else if (!validations.hasNumber) {
    feedback += '. Add numbers';
  } else if (!validations.hasSpecialChar) {
    feedback += '. Add special characters';
  }
  
  return {
    score,
    feedback,
    isValid: score >= minScore,
    validations,
  };
}

/**
 * Gets a color class based on password strength score
 * @param score Password strength score (0-4)
 * @returns Tailwind CSS color class
 */
export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
      return 'text-red-600';
    case 1:
      return 'text-orange-500';
    case 2:
      return 'text-yellow-500';
    case 3:
      return 'text-green-500';
    case 4:
      return 'text-emerald-600';
    default:
      return 'text-gray-500';
  }
}

/**
 * Creates a password strength meter component
 * @param score Password strength score (0-4)
 * @returns JSX for the strength meter
 */
export function getPasswordStrengthMeter(score: number): string {
  const baseClass = 'h-1.5 rounded-full';
  const filledSegments = score + 1; // +1 because we want to show something even for score 0
  
  let colorClass = '';
  switch (score) {
    case 0:
      colorClass = 'bg-red-600';
      break;
    case 1:
      colorClass = 'bg-orange-500';
      break;
    case 2:
      colorClass = 'bg-yellow-500';
      break;
    case 3:
      colorClass = 'bg-green-500';
      break;
    case 4:
      colorClass = 'bg-emerald-600';
      break;
    default:
      colorClass = 'bg-gray-300';
  }
  
  return `${baseClass} ${colorClass} w-${filledSegments * 20}%`;
} 