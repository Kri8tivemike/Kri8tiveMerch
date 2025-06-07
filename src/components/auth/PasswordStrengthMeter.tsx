import React from 'react';
import { validatePassword, getPasswordStrengthColor } from '../../utils/passwordUtils';
import { CheckCircle2, XCircle } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  minScore?: number;
}

export function PasswordStrengthMeter({ password, minScore = 2 }: PasswordStrengthMeterProps) {
  const strength = validatePassword(password, minScore);
  const { score, feedback, validations } = strength;
  
  // Get color based on score
  const colorClass = getPasswordStrengthColor(score);
  
  return (
    <div className="mt-2 space-y-2">
      {/* Strength meter bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
        <div 
          className={`h-1.5 rounded-full transition-all duration-300 ease-in-out ${colorClass.replace('text-', 'bg-')}`} 
          style={{ width: `${Math.min(100, (score + 1) * 20)}%` }}
        />
      </div>
      
      {/* Strength feedback */}
      <p className={`text-xs ${colorClass}`}>
        {feedback}
      </p>
      
      {/* Validation criteria */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
        <ValidationItem 
          isValid={validations.minLength} 
          text="At least 8 characters" 
        />
        <ValidationItem 
          isValid={validations.hasUppercase && validations.hasLowercase} 
          text="Upper & lowercase letters" 
        />
        <ValidationItem 
          isValid={validations.hasNumber} 
          text="At least 1 number" 
        />
        <ValidationItem 
          isValid={validations.hasSpecialChar} 
          text="At least 1 special character" 
        />
      </div>
    </div>
  );
}

interface ValidationItemProps {
  isValid: boolean;
  text: string;
}

function ValidationItem({ isValid, text }: ValidationItemProps) {
  return (
    <div className="flex items-center">
      {isValid ? (
        <CheckCircle2 className="h-3 w-3 text-green-500 mr-1.5 flex-shrink-0" />
      ) : (
        <XCircle className="h-3 w-3 text-gray-400 mr-1.5 flex-shrink-0" />
      )}
      <span className={`text-xs ${isValid ? 'text-green-700' : 'text-gray-500'}`}>
        {text}
      </span>
    </div>
  );
} 