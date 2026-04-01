import type { PasswordStrength } from '../types';

interface PasswordStrengthProps {
  password: string;
}

function calculateStrength(password: string): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');

  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  else feedback.push('Mix uppercase and lowercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Include at least one number');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Include at least one special character');

  if (password.length >= 20) score += 1;

  const labels: PasswordStrength['label'][] = ['weak', 'fair', 'good', 'strong', 'very-strong'];
  const labelIndex = Math.min(Math.floor(score / 1.5), 4);

  const crackTimes = [
    'Instantly',
    'Minutes',
    'Hours to days',
    'Months to years',
    'Centuries'
  ];

  return {
    score: Math.min(score, 7),
    label: labels[labelIndex],
    feedback,
    crackTime: crackTimes[labelIndex]
  };
}

export function PasswordStrengthMeter({ password }: PasswordStrengthProps) {
  const strength = calculateStrength(password);

  if (!password) return null;

  const colorMap = {
    weak: 'bg-red-500',
    fair: 'bg-orange-500',
    good: 'bg-yellow-500',
    strong: 'bg-green-500',
    'very-strong': 'bg-emerald-500'
  };

  const widthPercent = (strength.score / 7) * 100;

  return (
    <div className="space-y-2" role="status" aria-label={`Password strength: ${strength.label}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">Password strength</span>
        <span className={`font-medium capitalize ${
          strength.label === 'weak' ? 'text-red-500' :
          strength.label === 'fair' ? 'text-orange-500' :
          strength.label === 'good' ? 'text-yellow-500' :
          strength.label === 'strong' ? 'text-green-500' :
          'text-emerald-500'
        }`}>
          {strength.label}
        </span>
      </div>
      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorMap[strength.label]}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Estimated crack time: {strength.crackTime}
      </p>
      {strength.feedback.length > 0 && (
        <ul className="text-xs text-gray-400 dark:text-gray-500 space-y-0.5">
          {strength.feedback.map((tip, i) => (
            <li key={i}>• {tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
