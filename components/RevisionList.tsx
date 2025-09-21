

import React, { useMemo, useState } from 'react';
import { RevisionItem, Filters } from '../types';
import RevisionItemCard from './RevisionItemCard';
import { BellIcon, CheckCircleIcon, CalendarClockIcon, CalendarDaysIcon, TrashIcon, TagIcon, PlayCircleIcon, QueueListIcon, FireIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, Cog8ToothIcon, SitemapIcon, EyeIcon, FilterIcon, PencilSquareIcon } from './Icons';
import { getDaysUntil } from '../utils/date';

type Confidence = 'hard' | 'good' | 'easy';
type View = 'topics' | 'review';

interface RevisionListProps {
  items: RevisionItem[];
  allItems: RevisionItem[];
  archivedItems: RevisionItem[];
  completedItems: RevisionItem[];
  onComplete: (id: string, confidence: Confidence) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDeletePermanently: (id: string) => void;
  onUpdateItem: (id: string, updates: Partial<RevisionItem>) => void;
  uniqueTags: string[];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: Filters;
  onSetFilters: (filters: Filters) => void;
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
  selectedItems: Record<string, boolean>;
  onToggleSelectItem: (id: string) => void;
  onBulkArchive: () => void;
  onBulkDelete: () => void;
  onBulkEdit: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onStartReviewSession: () => void;
  onStartCramSession: (tag: string) => void;
  onNoteLinkClick: (title: string) => void;
  isValidTopicTitle: (title: string) => boolean;
  isLocked: (item: RevisionItem, allItems: RevisionItem[]) => boolean;
  onAddSubtopic: (parentId: string) => void;
  onEditPrereqs: (item: RevisionItem) => void;
}

const TagFilter: React.FC<{
    tags: string[];
    activeTag: string | null;
    onSelectTag: (tag: string | null) => void;
    onStartCramSession: (tag: string) => void;
}> = ({ tags, activeTag, onSelectTag, onStartCramSession }) => {
    if (tags.length === 0) return null;

    return (
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-400 mb-3">
              <TagIcon className="w-5 h-5" />
              Filter by Tag
            </h3>
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => onSelectTag(null)}
                    className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                        activeTag === null
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                    All
                </button>
                {tags.map(tag => (
                    <div key={tag} className="group relative">
                        <button
                            onClick={() => onSelectTag(tag)}
                            className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                                activeTag === tag
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                            {tag}
                        </button>
                        <button 
                            onClick={() => onStartCramSession(tag)}
                            className="absolute -top-2 -right-2 p-1 bg-amber-500 text-slate-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                            title={`Start Cram Session for "${tag}"`}
                        >
                            <FireIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// FIX: Properly type ListSectionProps to ensure props are passed down correctly.
type ListSectionProps = Omit<RevisionListProps, 'items' | 'filters' | 'onSetFilters' > & {
    title: string;
    items: RevisionItem[];
    icon: React.ReactNode;
};

const ListSection: React.FC<ListSectionProps> = ({ title, items, icon, ...props }) => {
  if (items.length === 0) {
    return null;
  }
  const { isLocked, ...cardProps } = props;
  return (
    <section className="mb-8">
      <h2 className="flex items-center gap-3 mb-4 text-xl font-semibold text-slate-300">
        {icon}
        {title}
      </h2>
      <div className="space-y-4">
        {items.map(item => (
          <RevisionItemCard 
            key={item.id} 
            item={item} 
            isLocked={isLocked(item, cardProps.allItems)}
            {...cardProps}
            childCount={0}
            isExpanded={false}
            onToggleExpand={() => {}}
            indentationLevel={0}
          />
        ))}
      </div>
    </section>
  );
};

const RevisionList: React.FC<RevisionListProps> = (props) => {
  const { 
    items, allItems, archivedItems, completedItems,
    uniqueTags, activeTag, onSelectTag, searchQuery, onSearchChange,
    filters, onSetFilters,
    selectionMode, onToggleSelectionMode, selectedItems,
    onBulkArchive, onBulkDelete, onBulkEdit, onExport, onImport,
    onStartReviewSession, onStartCramSession, isLocked
  } = props;
  
  const { isLocked: _, ...cardProps } = props;

  const [activeView, setActiveView] = useState<View>('topics');
  const [showArchived, setShowArchived] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);

  const { overdue, dueToday, upcoming } = useMemo(() => {
    const unlockedItems = items.filter(item => !isLocked(item, allItems));
    const groups = { overdue: [] as RevisionItem[], dueToday: [] as RevisionItem[], upcoming: [] as RevisionItem[] };
    const sorted = [...unlockedItems].sort((a, b) => new Date(a.nextRevisionDate).getTime() - new Date(b.nextRevisionDate).getTime());
    sorted.forEach(item => {
        const days = getDaysUntil(item.nextRevisionDate);
        if (days < 0) groups.overdue.push(item);
        else if (days === 0) groups.dueToday.push(item);
        else groups.upcoming.push(item);
    });
    return groups;
  }, [items, allItems, isLocked]);

  const { rootTopics, childrenMap } = useMemo(() => {
    const itemMap = new Map(items.map(item => [item.id, { ...item, children: [] as RevisionItem[] }]));
    const rootTopics: RevisionItem[] = [];
    const childrenMap = new Map<string, RevisionItem[]>();

    for (const item of items) {
        if (item.parentId && itemMap.has(item.parentId)) {
            const children = childrenMap.get(item.parentId) || [];
            children.push(item);
            childrenMap.set(item.parentId, children);
        } else {
            rootTopics.push(item);
        }
    }
    rootTopics.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    childrenMap.forEach(children => children.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));

    return { rootTopics, childrenMap };
  }, [items]);
  
  const toggleExpand = (topicId: string) => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const renderTopicTree = (topics: RevisionItem[], level: number = 0) => {
      return topics.map(item => {
          const children = childrenMap.get(item.id) || [];
          const isExpanded = expandedTopics[item.id] !== false;
          return (
              <div key={item.id}>
                  <RevisionItemCard
                      {...cardProps}
                      item={item}
                      isLocked={isLocked(item, allItems)}
                      childCount={children.length}
                      isExpanded={isExpanded}
                      onToggleExpand={toggleExpand}
                      indentationLevel={level}
                  />
                  {isExpanded && children.length > 0 && (
                      <div className="pl-4 border-l-2 border-slate-700 ml-6">
                           {renderTopicTree(children, level + 1)}
                      </div>
                  )}
              </div>
          );
      });
  };
  
  const numSelected = Object.values(selectedItems).filter(Boolean).length;
  const dueItemsCount = overdue.length + dueToday.length;
  const isFilterActive = Object.keys(filters).length > 0;
  
  if (items.length === 0 && archivedItems.length === 0 && completedItems.length === 0 && !activeTag && !searchQuery && !isFilterActive) {
    return (
      <div className="text-center py-16 px-6 bg-slate-800/50 border border-slate-700 rounded-lg shadow-inner">
        <BellIcon className="w-12 h-12 mx-auto text-slate-500 mb-4" />
        <h3 className="text-xl font-semibold text-slate-300">No Topics Yet</h3>
        <p className="text-slate-400 mt-2">Add a topic above to start your learning journey!</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="space-y-4 my-8">
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-2">
                 <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search by title or in notes..."
                    className="flex-grow bg-slate-900/80 border border-slate-600 rounded-md py-2 px-4 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                />
                 <button onClick={() => setShowFilters(!showFilters)} className={`relative flex items-center justify-center sm:justify-start gap-2 font-semibold py-2 px-4 rounded-md transition-colors ${showFilters || isFilterActive ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                    <FilterIcon className="w-5 h-5"/>
                    <span>Filter</span>
                    {isFilterActive && <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-800"></span>}
                </button>
            </div>
             {showFilters && (
                <div className="mt-4 p-4 bg-slate-900/50 rounded-md border border-slate-700 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                            <select value={filters.status || 'any'} onChange={e => onSetFilters({...filters, status: e.target.value as any})} className="w-full bg-slate-800 border border-slate-600 rounded-md py-2 px-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                <option value="any">Any</option>
                                <option value="unlocked">Unlocked</option>
                                <option value="locked">Locked</option>
                            </select>
                       </div>
                       <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Level</label>
                            <div className="flex gap-1">
                                <select value={filters.level?.comparison || 'gt'} onChange={e => onSetFilters({...filters, level: {...(filters.level || {value: 0}), comparison: e.target.value as any}})} className="bg-slate-800 border border-slate-600 rounded-l-md py-2 px-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                    <option value="gt">&gt;</option>
                                    <option value="lt">&lt;</option>
                                    <option value="eq">=</option>
                                </select>
                                <input type="number" value={filters.level?.value || ''} onChange={e => onSetFilters({...filters, level: {...(filters.level || {comparison: 'gt'}), value: parseInt(e.target.value) || 0}})} className="w-full bg-slate-800 border-y border-r border-slate-600 rounded-r-md py-2 px-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="e.g. 5" />
                            </div>
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-400 mb-1">Created After</label>
                           <input type="date" value={filters.createdAfter || ''} onChange={e => onSetFilters({...filters, createdAfter: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-md py-2 px-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                       </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-400 mb-1">Created Before</label>
                           <input type="date" value={filters.createdBefore || ''} onChange={e => onSetFilters({...filters, createdBefore: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-md py-2 px-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                       </div>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={() => { onSetFilters({}); onSearchChange(''); onSelectTag(null); }} className="font-semibold text-sm py-2 px-4 rounded-md text-slate-300 hover:bg-slate-700 transition-colors">Clear All Filters</button>
                    </div>
                </div>
            )}
        </div>
        <TagFilter tags={uniqueTags} activeTag={activeTag} onSelectTag={onSelectTag} onStartCramSession={onStartCramSession}/>

        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 border border-slate-700 rounded-md p-1 w-full sm:w-auto">
                <button onClick={() => setActiveView('topics')} className={`flex flex-1 sm:flex-none items-center justify-center gap-2 font-semibold py-1.5 px-3 rounded-md transition-colors text-sm ${activeView === 'topics' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                    <SitemapIcon className="w-5 h-5"/> Topics View
                </button>
                 <button onClick={() => setActiveView('review')} className={`flex flex-1 sm:flex-none items-center justify-center gap-2 font-semibold py-1.5 px-3 rounded-md transition-colors text-sm ${activeView === 'review' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                    <EyeIcon className="w-5 h-5"/> Review View
                </button>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button onClick={onStartReviewSession} disabled={dueItemsCount === 0} className="flex w-full sm:w-auto items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-500 disabled:bg-indigo-800/50 disabled:cursor-not-allowed transition-colors">
                    <PlayCircleIcon className="w-5 h-5"/>
                    <span>Review Due ({dueItemsCount})</span>
                </button>
                <button onClick={onToggleSelectionMode} className={`flex w-full sm:w-auto items-center justify-center gap-2 font-semibold py-2 px-4 rounded-md transition-colors ${selectionMode ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                    <QueueListIcon className="w-5 h-5"/>
                    <span>{selectionMode ? 'Cancel' : 'Bulk Select'}</span>
                </button>
            </div>
        </div>
      </div>

      {selectionMode && numSelected > 0 && (
          <div className="sticky bottom-4 z-10 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-lg flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="font-semibold mb-2 sm:mb-0">{numSelected} item(s) selected</span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button onClick={onBulkEdit} className="flex flex-1 sm:flex-none items-center justify-center gap-2 font-semibold py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"><PencilSquareIcon className="w-5 h-5"/> Bulk Edit</button>
                  <button onClick={onBulkArchive} className="flex-1 sm:flex-none justify-center font-semibold py-2 px-4 rounded-md bg-slate-600 hover:bg-slate-500 transition-colors">Archive</button>
                  <button onClick={onBulkDelete} className="flex-1 sm:flex-none justify-center font-semibold py-2 px-4 rounded-md bg-red-800 hover:bg-red-700 text-white transition-colors">Delete</button>
              </div>
          </div>
      )}

      {items.length === 0 && (activeTag || searchQuery || isFilterActive) && (
        <div className="text-center py-12 px-6 bg-slate-800/50 border border-slate-700 rounded-lg shadow-inner">
            <h3 className="text-lg font-semibold text-slate-300">No items match your filter/search.</h3>
            <p className="text-slate-400 mt-1">Clear the filter or search to see all active items.</p>
        </div>
      )}

      {activeView === 'topics' && (
         <section className="space-y-2">
            {renderTopicTree(rootTopics)}
        </section>
      )}

      {activeView === 'review' && (
        <>
            <ListSection title="Overdue" items={overdue} icon={<CalendarClockIcon className="w-6 h-6 text-red-400" />} {...props} />
            <ListSection title="Due Today" items={dueToday} icon={<CheckCircleIcon className="w-6 h-6 text-amber-400" />} {...props} />
            <ListSection title="Upcoming" items={upcoming} icon={<CalendarDaysIcon className="w-6 h-6 text-sky-400" />} {...props} />
        </>
      )}

      {(archivedItems.length > 0 || completedItems.length > 0 || true) && (
        <div className="mt-12 border-t border-slate-700 pt-8 space-y-6">
            {completedItems.length > 0 && (
                <div>
                    <button onClick={() => setShowCompleted(!showCompleted)} className="font-semibold text-emerald-400 hover:text-emerald-300 transition w-full text-left flex items-center gap-2">
                        {showCompleted ? 'Hide' : 'Show'} {completedItems.length} Mastered Item(s)
                    </button>
                    {showCompleted && (
                        <section className="mt-4 space-y-4">
                            {[...completedItems].sort((a,b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()).map(item => (
                                <RevisionItemCard 
                                    key={item.id} 
                                    item={item} 
                                    isLocked={false} 
                                    {...cardProps} 
                                    onDeletePermanently={props.onDeletePermanently} 
                                    childCount={0}
                                    isExpanded={false}
                                    onToggleExpand={() => {}}
                                    indentationLevel={0}
                                />
                            ))}
                        </section>
                    )}
                </div>
            )}
            {archivedItems.length > 0 && (
                <div>
                    <button onClick={() => setShowArchived(!showArchived)} className="font-semibold text-slate-400 hover:text-slate-300 transition w-full text-left flex items-center gap-2">
                        {showArchived ? 'Hide' : 'Show'} {archivedItems.length} Archived Item(s)
                    </button>
                    {showArchived && (
                        <section className="mt-4 space-y-4">
                            {[...archivedItems].sort((a,b) => new Date(b.archivedAt!).getTime() - new Date(a.archivedAt!).getTime()).map(item => (
                                <RevisionItemCard 
                                    key={item.id} 
                                    item={item} 
                                    isLocked={false} 
                                    {...cardProps} 
                                    onRestore={props.onRestore} 
                                    onDeletePermanently={props.onDeletePermanently}
                                    childCount={0}
                                    isExpanded={false}
                                    onToggleExpand={() => {}}
                                    indentationLevel={0}
                                />
                            ))}
                        </section>
                    )}
                </div>
            )}
            <div>
              <button onClick={() => setShowSettings(!showSettings)} className="font-semibold text-indigo-400 hover:text-indigo-300 transition w-full text-left flex items-center gap-2">
                  <Cog8ToothIcon className="w-5 h-5"/>
                  {showSettings ? 'Hide' : 'Show'} Settings & Data
              </button>
              {showSettings && (
                  <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <p className="text-slate-400 text-sm max-w-md">Backup your data to a file or restore from a previous backup. This is highly recommended as all data is stored locally in your browser.</p>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                              <label htmlFor="import-file" className="cursor-pointer flex items-center gap-2 bg-sky-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-sky-500 transition-colors">
                                  <ArrowUpTrayIcon className="w-5 h-5"/> Import
                              </label>
                              <input type="file" id="import-file" accept=".json" onChange={onImport} className="hidden" />
                              <button onClick={onExport} className="flex items-center gap-2 bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-md hover:bg-slate-600 transition-colors">
                                  <ArrowDownTrayIcon className="w-5 h-5"/> Export
                              </button>
                          </div>
                      </div>
                  </div>
              )}
            </div>
        </div>
      )}
    </>
  );
};

export default RevisionList;