export function Loader({ message = 'Processing...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" role="status" aria-label="Loading">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-700" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-vault-500 animate-spin" />
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-medium text-sm">{message}</p>
      </div>
    </div>
  );
}
