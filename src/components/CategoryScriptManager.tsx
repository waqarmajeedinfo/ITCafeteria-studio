/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Unified Category Script Manager & Prompt Instructions
 * Maps all 10 IT Cafeteria categories to their respective prompt instructions and multi-category binds.
 * Strictly English & Roman Urdu only (no pure Urdu script).
 */

import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Edit2,
  Plus,
  RotateCcw,
  Tag,
  Link,
  Check,
  X,
  Save,
  Layers,
  HelpCircle,
  Video,
  FileText
} from 'lucide-react';

export interface CategoryRuleItem {
  id: number | string;
  name: string;
  instructions: string;
  boundCategoryIds?: number[];
  defaultRatio?: '9:16' | '16:9';
}

export interface CategoryScriptManagerProps {
  channelId?: string;
  categoryRules: CategoryRuleItem[];
  activeRuleId?: string | number;
  currentInstructions: string;
  availableCategories?: Array<{ id: number; name: string }>;
  onSelectRule: (rule: CategoryRuleItem) => void;
  onUpdateInstructions: (instructions: string) => void;
  onSaveCategoryRules: (updatedRules: CategoryRuleItem[]) => void;
  onResetDefaults?: () => void;
  onShowToast?: (message: string) => void;
  className?: string;
}

export const IT_CAFETERIA_DEFAULT_10_CATEGORIES: Array<{ id: number; name: string; ratio: '9:16' | '16:9' }> = [
  { id: 1, name: 'AI & Smart Technology', ratio: '9:16' },
  { id: 2, name: 'AI Chatbots, Workflows & AI Tools', ratio: '9:16' },
  { id: 3, name: 'AI Prompt Hacks & Shortcuts', ratio: '9:16' },
  { id: 4, name: 'PC & Windows Hacks', ratio: '9:16' },
  { id: 5, name: 'New Technology & Product Tutorials', ratio: '9:16' },
  { id: 6, name: 'Future Tech & Positive Breakthroughs', ratio: '9:16' },
  { id: 7, name: 'Secrets (WhatsApp, Google, Windows, ChatGPT, etc.)', ratio: '9:16' },
  { id: 8, name: 'Income & Skills: Tools That Earn', ratio: '9:16' },
  { id: 9, name: 'YT Automation (Mandatory 16:9)', ratio: '16:9' },
  { id: 10, name: 'Custom Search & Grounded Topics', ratio: '9:16' }
];

export const CategoryScriptManager: React.FC<CategoryScriptManagerProps> = ({
  channelId = 'itcafeteria',
  categoryRules,
  activeRuleId,
  currentInstructions,
  availableCategories = IT_CAFETERIA_DEFAULT_10_CATEGORIES,
  onSelectRule,
  onUpdateInstructions,
  onSaveCategoryRules,
  onResetDefaults,
  onShowToast,
  className = ''
}) => {
  // Modal states
  const [editingRule, setEditingRule] = useState<CategoryRuleItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editBoundIds, setEditBoundIds] = useState<number[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newBoundIds, setNewBoundIds] = useState<number[]>([1]);

  // Active Category Rule resolution
  const activeRule =
    categoryRules.find(
      (r) => String(r.id) === String(activeRuleId) || r.instructions === currentInstructions
    ) || categoryRules[0];

  const charCount = currentInstructions.length;
  const wordCount = currentInstructions.trim() ? currentInstructions.trim().split(/\s+/).length : 0;

  const handleStartEdit = (rule: CategoryRuleItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRule(rule);
    setEditName(rule.name);
    setEditInstructions(rule.instructions);
    setEditBoundIds(rule.boundCategoryIds || [Number(rule.id) || 1]);
  };

  const handleToggleBinding = (catId: number) => {
    setEditBoundIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId].sort((a, b) => a - b)
    );
  };

  const handleToggleNewBinding = (catId: number) => {
    setNewBoundIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId].sort((a, b) => a - b)
    );
  };

  const handleSaveEdit = () => {
    if (!editingRule) return;
    const updated = categoryRules.map((r) =>
      r.id === editingRule.id
        ? {
            ...r,
            name: editName.trim() || r.name,
            instructions: editInstructions.trim() || r.instructions,
            boundCategoryIds: editBoundIds.length > 0 ? editBoundIds : [Number(r.id) || 1]
          }
        : r
    );
    onSaveCategoryRules(updated);

    // If edited rule is the currently active rule, sync instructions
    if (String(activeRuleId) === String(editingRule.id) || currentInstructions === editingRule.instructions) {
      onUpdateInstructions(editInstructions.trim() || editingRule.instructions);
    }

    setEditingRule(null);
    if (onShowToast) {
      onShowToast(`Category rule "${editName.trim()}" aur category bindings kamyabi se save ho gayin!`);
    }
  };

  const handleSaveNew = () => {
    if (!newName.trim()) return;
    const nextId = Date.now();
    const newRuleItem: CategoryRuleItem = {
      id: nextId,
      name: newName.trim(),
      instructions: newInstructions.trim() || 'Custom high-retention Roman Urdu script prompt instructions.',
      boundCategoryIds: newBoundIds.length > 0 ? newBoundIds : [1]
    };
    const updated = [...categoryRules, newRuleItem];
    onSaveCategoryRules(updated);
    setShowAddModal(false);
    setNewName('');
    setNewInstructions('');
    setNewBoundIds([]);
    if (onShowToast) {
      onShowToast(`Naya custom rule "${newRuleItem.name}" create ho kar target categories se bind ho gaya!`);
    }
  };

  const handleQuickInsertSnippet = (snippet: string) => {
    const updated = currentInstructions ? `${currentInstructions}\n${snippet}` : snippet;
    onUpdateInstructions(updated);
    if (onShowToast) {
      onShowToast('Prompt rule snippet add ho gaya.');
    }
  };

  return (
    <div className={`p-4 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-4 ${className}`}>
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-white text-xs tracking-wider uppercase">
                Category Script Manager &amp; Prompt Instructions
              </h4>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                10 Categories Unified
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              IT Cafeteria channel profile ke liye centralized prompt architecture aur multi-category bindings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setNewName('');
              setNewInstructions('');
              setNewBoundIds([1]);
              setShowAddModal(true);
            }}
            className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-500/40 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
            title="Create a new custom category rule"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Custom Rule</span>
          </button>

          {onResetDefaults && (
            <button
              type="button"
              onClick={onResetDefaults}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-[10px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Reset all 10 categories to official IT Cafeteria defaults"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset 10 Categories</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Card in Spoken Roman Urdu / English */}
      <div className="p-3 bg-gradient-to-r from-cyan-950/40 to-slate-900/60 border border-cyan-500/20 rounded-xl text-[11px] text-slate-300 leading-relaxed">
        <p>
          IT Cafeteria ke liye <strong>Agent Script Rules &amp; Prompt Instructions</strong> aur{' '}
          <strong>10 Category-Specific Rules &amp; Multi-Category Bind</strong> ko combine kar diya gaya hai. Har
          category ka apna specific script writing criteria, hook style aur video structure hai. Kisi bhi category card par
          click kar ke active prompt instructions load karein, ya <strong>✏️ Edit &amp; Bind</strong> ke zariye
          prompts aur multi-category bindings ko customize karein.
        </p>
      </div>

      {/* 10-Category Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
        {categoryRules.map((catRule) => {
          const catIdNum = Number(catRule.id);
          const isActive =
            String(activeRuleId) === String(catRule.id) || currentInstructions === catRule.instructions;
          const boundCount = catRule.boundCategoryIds?.length || 0;
          const boundLabels = (catRule.boundCategoryIds || []).map((id) => `Cat ${id}`).join(', ');
          const isCat9 = catIdNum === 9 || (catRule.name && catRule.name.includes('YT Automation'));

          return (
            <div
              key={catRule.id}
              onClick={() => {
                onSelectRule(catRule);
                if (onShowToast) {
                  onShowToast(`Category ${catRule.id} Script Rules & Prompt Instructions load ho gayin!`);
                }
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative group flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-950/80'
                  : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isActive ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {catIdNum || '•'}
                    </span>
                    <div className="font-bold text-white text-xs truncate">
                      {catRule.name.replace(/^\d+\.\s*/, '')}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-[9px] font-mono px-1 py-0.5 rounded font-bold ${
                        isCat9
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isCat9 ? '16:9' : '9:16'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleStartEdit(catRule, e)}
                      className="p-1 rounded-md bg-slate-800/90 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/50 transition-colors shrink-0 cursor-pointer"
                      title={`Edit Script Rules & Multi-Category Binds for ${catRule.name}`}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 line-clamp-3 leading-snug">
                  {catRule.instructions}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px]">
                <span
                  className="font-mono text-indigo-300 truncate font-semibold flex items-center gap-1"
                  title={`Bound categories: ${boundLabels}`}
                >
                  <Link className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                  <span>{boundCount > 1 ? `${boundCount} Binds (${boundLabels})` : boundLabels || `Cat ${catRule.id}`}</span>
                </span>
                <span
                  className={`font-semibold px-1.5 py-0.5 rounded text-[9px] ${
                    isActive ? 'bg-cyan-400/20 text-cyan-300' : 'text-slate-500 group-hover:text-cyan-400'
                  }`}
                >
                  {isActive ? 'Active Rule' : 'Select'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Rule Details & Prompt Editor */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 text-[11px] text-slate-300 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-cyan-300 font-bold">Active Category Script Rules &amp; Prompt Instructions:</span>
            {activeRule && (
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-semibold">
                {activeRule.name}
              </span>
            )}
          </div>
          <span className="text-slate-400">
            {charCount} chars • {wordCount} words
          </span>
        </div>

        <textarea
          value={currentInstructions}
          onChange={(e) => onUpdateInstructions(e.target.value)}
          rows={5}
          className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-cyan-400 resize-none shadow-inner"
          placeholder="Category script rules aur prompt instructions enter karein..."
        />

        {/* Quick Rule Injection Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-slate-400 font-semibold mr-1">Quick Rule Snippets:</span>
          <button
            type="button"
            onClick={() =>
              handleQuickInsertSnippet(
                'Language: Spoken Roman Urdu with natural English technical terms. Pure Urdu script is strictly prohibited.'
              )
            }
            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded border border-slate-700 text-[9px] transition-colors"
          >
            + Spoken Roman Urdu
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickInsertSnippet(
                'Presenter: Waqar Majeed (@WM25-1) delivers the punchy hook (0-10s) and closing CTA. Middle scenes feature full screencast and concept UI.'
              )
            }
            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded border border-slate-700 text-[9px] transition-colors"
          >
            + Presenter Waqar Majeed Hook
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickInsertSnippet(
                'Acronyms: All technical acronyms must be hyphenated for natural phonetic TTS reading (e.g. A-I, G-P-U, C-M-D, P-C).'
              )
            }
            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded border border-slate-700 text-[9px] transition-colors"
          >
            + Hyphenated Acronyms
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickInsertSnippet(
                'Visual Mode: High-contrast desktop screencast with zoomed hotkey overlays, cursor tracking, and zero generic stock b-roll.'
              )
            }
            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded border border-slate-700 text-[9px] transition-colors"
          >
            + Screencast Mode
          </button>
        </div>

        <p className="text-[10px] text-slate-400">
          Yeh prompt instructions IT Cafeteria ke AI Script Generator, Agent Simulator aur Target Queue mein script banate waqt har scene par direct enforce hongi.
        </p>
      </div>

      {/* SUB-MODAL: Edit Category Rule & Multi-Category Binding */}
      {editingRule && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col p-5 shadow-2xl space-y-4 text-xs text-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-cyan-400" />
                <div>
                  <h4 className="font-bold text-white text-sm">Edit Rule &amp; Bind to Multiple Categories</h4>
                  <p className="text-[11px] text-slate-400">
                    Ek hi rule ko aap 2, 3 ya ziada categories ke sath bind kar sakte hain.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Rule Name / Module Title</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Rule Prompt Instructions</label>
                <textarea
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-cyan-400 leading-relaxed resize-none"
                />
              </div>

              {/* Multi-Category Binding Checklist */}
              <div className="p-3.5 bg-slate-950 border border-indigo-500/30 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Bind this Rule to Categories (Select all that apply):</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditBoundIds(availableCategories.map((c) => c.id))}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setEditBoundIds([])}
                      className="text-[10px] text-slate-400 hover:text-white font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400">
                  Currently bound to <strong>{editBoundIds.length}</strong> categories. In categories par yeh rule auto-apply hoga:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto">
                  {availableCategories.map((cat) => {
                    const isChecked = editBoundIds.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        onClick={() => handleToggleBinding(cat.id)}
                        className={`p-2 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-cyan-950/60 border-cyan-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by label onClick
                          className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-400 h-3.5 w-3.5"
                        />
                        <span className="font-mono text-cyan-300 font-bold shrink-0">#{cat.id}</span>
                        <span className="truncate text-xs">{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800 shrink-0">
              <span className="text-[10px] font-mono text-slate-400">
                Bound: {editBoundIds.length > 0 ? editBoundIds.map((id) => `#${id}`).join(', ') : 'None'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-950 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Rule &amp; Category Binds</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Add New Custom Category Rule */}
      {showAddModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col p-5 shadow-2xl space-y-4 text-xs text-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <div>
                  <h4 className="font-bold text-white text-sm">Naya Category Script Rule Shamil Karein</h4>
                  <p className="text-[11px] text-slate-400">
                    Naya rule banayein aur ek ya ziada categories ke sath bind karein.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g., Short-Form Turbo Tutorial Rule"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Rule Prompt Instructions</label>
                <textarea
                  placeholder="Enter detailed prompt rules, scene beat guidelines and tone instructions in Roman Urdu / English..."
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-cyan-400 leading-relaxed resize-none"
                />
              </div>

              {/* Multi-Category Binding Checklist */}
              <div className="p-3.5 bg-slate-950 border border-indigo-500/30 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Bind this Rule to Categories:</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewBoundIds(availableCategories.map((c) => c.id))}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setNewBoundIds([])}
                      className="text-[10px] text-slate-400 hover:text-white font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto">
                  {availableCategories.map((cat) => {
                    const isChecked = newBoundIds.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        onClick={() => handleToggleNewBinding(cat.id)}
                        className={`p-2 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-cyan-950/60 border-cyan-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-400 h-3.5 w-3.5"
                        />
                        <span className="font-mono text-cyan-300 font-bold shrink-0">#{cat.id}</span>
                        <span className="truncate text-xs">{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNew}
                disabled={!newName.trim()}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-950 disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save New Rule &amp; Bindings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
