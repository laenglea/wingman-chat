import { Fragment, useState } from 'react';
import { X, Settings, MessageSquare, Trash2 } from 'lucide-react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { useSettings } from '../hooks/useSettings';
import { useChat } from '../hooks/useChat';
import type { Theme } from '../contexts/ThemeContext';
import type { LayoutMode } from '../types/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const themeOptions: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const layoutOptions: { value: LayoutMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
];

const sections = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'chats', label: 'Chats', icon: MessageSquare },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme, layoutMode, setLayoutMode } = useSettings();
  const { chats, deleteChat } = useChat();
  const [activeSection, setActiveSection] = useState('general');

  const handleDeleteAllChats = () => {
    if (chats.length === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete all ${chats.length} chat${chats.length === 1 ? '' : 's'}? This action cannot be undone.`
    );
    
    if (confirmed) {
      // Delete all chats by calling deleteChat for each one
      chats.forEach(chat => {
        deleteChat(chat.id);
      });
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-8">
            {/* Theme Setting */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Theme
              </label>
              <Listbox value={theme} onChange={setTheme}>
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-neutral-800 py-3 pl-4 pr-10 text-left shadow-sm border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <span className="block truncate text-neutral-900 dark:text-neutral-100">
                      {themeOptions.find(option => option.value === theme)?.label}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="h-5 w-5 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-neutral-800 py-1 text-base shadow-lg ring-1 ring-black/5 dark:ring-white/5 focus:outline-none sm:text-sm z-[70]">
                      {themeOptions.map((option) => (
                        <Listbox.Option
                          key={option.value}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                              active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-neutral-900 dark:text-neutral-100'
                            }`
                          }
                          value={option.value}
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {option.label}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600 dark:text-blue-400">
                                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                System will follow your device's theme setting.
              </p>
            </div>

            {/* Layout Setting */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Layout
              </label>
              <Listbox value={layoutMode} onChange={setLayoutMode}>
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-neutral-800 py-3 pl-4 pr-10 text-left shadow-sm border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <span className="block truncate text-neutral-900 dark:text-neutral-100">
                      {layoutOptions.find(option => option.value === layoutMode)?.label}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="h-5 w-5 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-neutral-800 py-1 text-base shadow-lg ring-1 ring-black/5 dark:ring-white/5 focus:outline-none sm:text-sm z-[70]">
                      {layoutOptions.map((option) => (
                        <Listbox.Option
                          key={option.value}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                              active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-neutral-900 dark:text-neutral-100'
                            }`
                          }
                          value={option.value}
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {option.label}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600 dark:text-blue-400">
                                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Choose between normal responsive layout or wide layout for larger screens.
              </p>
            </div>
          </div>
        );

      case 'chats':
        return (
          <div className="space-y-8">
            {/* Chat Management */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Chat Management
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                  You currently have {chats.length} chat{chats.length === 1 ? '' : 's'} saved locally.
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleDeleteAllChats}
                  disabled={chats.length === 0}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    chats.length === 0
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <Trash2 size={16} />
                  Delete All Chats
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-visible rounded-2xl bg-white dark:bg-neutral-900 p-0 text-left align-middle shadow-xl transition-all flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-4 flex-1">
                    <Dialog.Title as="h3" className="hidden sm:block text-lg font-medium leading-6 text-neutral-900 dark:text-neutral-100">
                      Settings
                    </Dialog.Title>
                    
                    {/* Mobile Section Selector */}
                    <div className="sm:hidden flex-1 max-w-48">
                      <Listbox value={activeSection} onChange={setActiveSection}>
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-neutral-100 dark:bg-neutral-800 py-2 pl-3 pr-8 text-left text-sm">
                            <span className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                              <Settings size={14} />
                              {sections.find(s => s.id === activeSection)?.label}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
                              </svg>
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-neutral-800 py-1 text-sm shadow-lg ring-1 ring-black/5 dark:ring-white/5 focus:outline-none z-[80]">
                              {sections.map((section) => (
                                <Listbox.Option
                                  key={section.id}
                                  className={({ active }) =>
                                    `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                                      active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-neutral-900 dark:text-neutral-100'
                                    }`
                                  }
                                  value={section.id}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={`flex items-center gap-2 ${selected ? 'font-medium' : 'font-normal'}`}>
                                        <section.icon size={14} />
                                        {section.label}
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600 dark:text-blue-400">
                                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                          </svg>
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>
                  </div>
                  
                  <button
                    onClick={onClose}
                    className="rounded-md p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex flex-1">
                  {/* Desktop Sidebar */}
                  <div className="hidden sm:block w-48 bg-neutral-50 dark:bg-neutral-800/50">
                    <nav>
                      {sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                            activeSection === section.id
                              ? 'text-neutral-900 dark:text-neutral-100 bg-neutral-200 dark:bg-neutral-700'
                              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                          }`}
                        >
                          <section.icon size={16} />
                          {section.label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 sm:p-6">
                    {renderSectionContent()}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
