import { useNoteStore } from '../store/noteStore';

export function TabBar() {
  const { tabs, addTab, removeTab, updateTabTitle } = useNoteStore();
  const activeTabId = tabs[0]?.id;

  return (
    <div className="flex items-center gap-1 border-b bg-gray-50 dark:bg-gray-900 px-2 overflow-x-auto" role="tablist">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tab"
          aria-selected={tab.id === activeTabId}
          className={`group flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-t-lg cursor-pointer whitespace-nowrap transition-colors ${
            tab.id === activeTabId
              ? 'bg-white dark:bg-gray-800 text-vault-600 dark:text-vault-400 border-b-2 border-vault-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <input
            type="text"
            value={tab.title}
            onChange={(e) => updateTabTitle(tab.id, e.target.value)}
            className="bg-transparent border-none outline-none w-20 min-w-[60px] text-inherit"
            aria-label={`Tab title: ${tab.title}`}
          />
          {tabs.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTab(tab.id);
              }}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Close tab ${tab.title}`}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        onClick={addTab}
        className="px-2 py-1 text-gray-400 hover:text-vault-600 dark:hover:text-vault-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Add new tab"
      >
        +
      </button>
    </div>
  );
}
