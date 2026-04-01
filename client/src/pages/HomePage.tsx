import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const [siteName, setSiteName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = siteName.trim();
    if (trimmed) {
      navigate(`/${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8 text-center">
        <div className="space-y-3">
          <div className="flex justify-center">
            <svg className="w-20 h-20 text-vault-600 dark:text-vault-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            CipherVault
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            End-to-end encrypted notepad. Your notes, your key, your privacy.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              /
            </span>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="input pl-8 text-lg text-center"
              placeholder="Enter a unique site name"
              autoFocus
              aria-label="Site name"
            />
          </div>
          <button type="submit" disabled={!siteName.trim()} className="btn-primary w-full text-lg py-3">
            Open Vault →
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="text-center">
            <div className="text-2xl mb-1">🔒</div>
            <h3 className="font-medium text-gray-900 dark:text-white text-sm">AES-256-GCM</h3>
            <p className="text-xs text-gray-500">Military-grade encryption</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">⚡</div>
            <h3 className="font-medium text-gray-900 dark:text-white text-sm">WebCrypto</h3>
            <p className="text-xs text-gray-500">Hardware-accelerated</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🔑</div>
            <h3 className="font-medium text-gray-900 dark:text-white text-sm">Zero Knowledge</h3>
            <p className="text-xs text-gray-500">Client-side only</p>
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 pt-4">
          All encryption happens in your browser. The server stores only encrypted blobs.
          <br />
          Open source • Self-hostable • No tracking
        </p>
      </div>
    </div>
  );
}
