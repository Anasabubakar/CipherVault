import { useState, FormEvent } from 'react';
import { PasswordStrengthMeter } from './PasswordStrength';

interface PasswordDialogProps {
  isOpen: boolean;
  isNew: boolean;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

export function PasswordDialog({ isOpen, isNew, onSubmit, onCancel }: PasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password is required');
      return;
    }

    if (isNew && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (isNew && password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    onSubmit(password);
    setPassword('');
    setConfirm('');
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isNew ? 'Create password' : 'Enter password'}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {isNew ? 'Create Password' : 'Enter Password'}
        </h2>

        {isNew && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            This password encrypts your notes. If you forget it, your data is unrecoverable.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-10"
                placeholder="Enter your password"
                autoFocus
                autoComplete={isNew ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {isNew && (
            <>
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
              </div>
              <PasswordStrengthMeter password={password} />
            </>
          )}

          {error && (
            <p className="text-sm text-red-500" role="alert">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {isNew ? 'Create' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
