import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const ShieldIcon = () => (
  <svg className="w-8 h-8 text-vault-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const BoltIcon = () => (
  <svg className="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

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
      <div className="w-full max-w-lg space-y-10 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-vault-500 to-vault-700 flex items-center justify-center shadow-lg shadow-vault-500/20">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            CipherVault
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            End-to-end encrypted notepad. Your notes, your key, your privacy.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">
              /
            </span>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="input pl-8 text-lg text-center font-medium"
              placeholder="Enter a unique vault name"
              autoFocus
              aria-label="Site name"
            />
          </div>
          <button type="submit" disabled={!siteName.trim()} className="btn-primary w-full text-lg py-3 font-semibold">
            Open Vault
            <svg className="w-5 h-5 inline-block ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <ShieldIcon />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">AES-256-GCM</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Military-grade encryption</p>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <BoltIcon />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">WebCrypto</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Hardware-accelerated</p>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <KeyIcon />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Zero Knowledge</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Client-side only</p>
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
