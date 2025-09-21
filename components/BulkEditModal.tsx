import React, { useState } from 'react';
import { XMarkIcon, PencilSquareIcon } from './Icons';

interface BulkEditModalProps {
    onClose: () => void;
    onSave: (updates: { tagsToAdd: string[], tagsToRemove: string[] }) => void;
    itemCount: number;
}

const BulkEditModal: React.FC<BulkEditModalProps> = ({ onClose, onSave, itemCount }) => {
    const [tagsToAdd, setTagsToAdd] = useState('');
    const [tagsToRemove, setTagsToRemove] = useState('');

    const handleSave = () => {
        const toAdd = tagsToAdd.split(',').map(t => t.trim()).filter(Boolean);
        const toRemove = tagsToRemove.split(',').map(t => t.trim()).filter(Boolean);
        onSave({ tagsToAdd: toAdd, tagsToRemove: toRemove });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <PencilSquareIcon className="w-6 h-6 text-indigo-400"/>
                        Bulk Edit {itemCount} Item(s)
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700" aria-label="Close">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="tags-to-add" className="block text-sm font-medium text-slate-300 mb-1">
                            Add Tags (comma-separated)
                        </label>
                        <input
                            id="tags-to-add"
                            type="text"
                            value={tagsToAdd}
                            onChange={(e) => setTagsToAdd(e.target.value)}
                            placeholder="e.g., new-tag, important"
                            className="w-full bg-slate-900/80 border border-slate-600 rounded-md py-2 px-4 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        />
                         <p className="text-xs text-slate-500 mt-1">These tags will be added to all selected items.</p>
                    </div>
                     <div>
                        <label htmlFor="tags-to-remove" className="block text-sm font-medium text-slate-300 mb-1">
                            Remove Tags (comma-separated)
                        </label>
                        <input
                            id="tags-to-remove"
                            type="text"
                            value={tagsToRemove}
                            onChange={(e) => setTagsToRemove(e.target.value)}
                            placeholder="e.g., old-tag, review-later"
                            className="w-full bg-slate-900/80 border border-slate-600 rounded-md py-2 px-4 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        />
                        <p className="text-xs text-slate-500 mt-1">These tags will be removed from all selected items if they exist.</p>
                    </div>
                </div>
                <div className="flex justify-end p-4 border-t border-slate-700 bg-slate-800/50 rounded-b-lg gap-2">
                    <button onClick={onClose} className="bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-md hover:bg-slate-600 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-500 transition-colors">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default BulkEditModal;
