import React from 'react';
import { cn } from '../../../lib/utils';

type FormStep = 'technique' | 'design' | 'details';

interface ProgressIndicatorProps {
  currentStep: FormStep;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { id: 'technique', label: 'Printing Technique', number: 1 },
    { id: 'design', label: 'Create Design', number: 2 },
    { id: 'details', label: 'Order Details', number: 3 }
  ];

  const getStepIndex = (step: FormStep): number => {
    return steps.findIndex(s => s.id === step);
  };

  const currentStepIndex = getStepIndex(currentStep);

  return (
    <div className="mb-6 sm:mb-8 md:mb-10">
      <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold mr-2 sm:mr-3",
              currentStep === step.id 
                ? "bg-indigo-600 text-white" 
                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            )}>
              {step.number}
            </div>
            <span className={cn(
              "text-xs sm:text-sm font-medium",
              currentStep === step.id 
                ? "text-indigo-600 dark:text-indigo-400" 
                : "text-gray-500 dark:text-gray-400"
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 shadow-inner">
        <div 
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 sm:h-3 rounded-full transition-all duration-500 ease-in-out shadow-sm"
          style={{ 
            width: `${((currentStepIndex + 1) / steps.length) * 100}%`
          }}
        />
      </div>
    </div>
  );
}; 