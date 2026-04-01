export function Loader({ message = 'Processing...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="status" aria-label="Loading">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 flex flex-col items-center gap-4 shadow-2xl">
        <div className="w-12 h-12 border-4 border-vault-200 border-t-vault-600 rounded-full animate-spin" />
        <p className="text-gray-600 dark:text-gray-300 font-medium">{message}</p>
      </div>
    </div>
  );
}
