'use client';

import { useState, useEffect, useCallback } from 'react';
import { Globe, ArrowLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PanelPreset, Locale } from '@/lib/types';
import nl from '@/i18n/nl.json';
import en from '@/i18n/en.json';

type PresetFormData = {
  name: string;
  description: string;
  wp_per_side: number;
  technology: string;
  system_loss: number;
  is_default: boolean;
};

const emptyForm: PresetFormData = {
  name: '',
  description: '',
  wp_per_side: 0,
  technology: 'crystSi',
  system_loss: 14,
  is_default: false,
};

export default function AdminPage() {
  const [locale, setLocale] = useState<Locale>('nl');
  const t = (locale === 'nl' ? nl : en) as Record<string, Record<string, string>>;
  const a = t.admin || {};

  const [presets, setPresets] = useState<PanelPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<PresetFormData>(emptyForm);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchPresets = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('panel_presets')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');
    if (error) {
      showMessage(error.message, 'error');
    } else {
      setPresets(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const handleSave = async () => {
    if (!supabase) return;
    if (!form.name.trim()) return;

    // If setting as default, unset others first
    if (form.is_default) {
      await supabase
        .from('panel_presets')
        .update({ is_default: false })
        .eq('is_default', true);
    }

    if (editingId) {
      const { error } = await supabase
        .from('panel_presets')
        .update({
          name: form.name,
          description: form.description || null,
          wp_per_side: form.wp_per_side,
          technology: form.technology,
          system_loss: form.system_loss,
          is_default: form.is_default,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);
      if (error) {
        showMessage(error.message, 'error');
        return;
      }
      showMessage(a.saved || 'Saved', 'success');
    } else {
      const { error } = await supabase
        .from('panel_presets')
        .insert({
          name: form.name,
          description: form.description || null,
          wp_per_side: form.wp_per_side,
          technology: form.technology,
          system_loss: form.system_loss,
          is_default: form.is_default,
        });
      if (error) {
        showMessage(error.message, 'error');
        return;
      }
      showMessage(a.saved || 'Saved', 'success');
    }

    resetForm();
    fetchPresets();
  };

  const handleEdit = (preset: PanelPreset) => {
    setEditingId(preset.id);
    setShowAddForm(true);
    setForm({
      name: preset.name,
      description: preset.description || '',
      wp_per_side: preset.wp_per_side,
      technology: preset.technology,
      system_loss: preset.system_loss,
      is_default: preset.is_default,
    });
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    if (!confirm(a.confirmDelete || 'Are you sure you want to delete this preset?')) return;

    const { error } = await supabase.from('panel_presets').delete().eq('id', id);
    if (error) {
      showMessage(error.message, 'error');
      return;
    }
    showMessage(a.deleted || 'Deleted', 'success');
    fetchPresets();
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowAddForm(false);
  };

  const toggleLocale = () => setLocale(locale === 'nl' ? 'en' : 'nl');

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#EDEAE5]">
        <div className="glass-card p-8 max-w-md text-center">
          <p className="text-[#707070]">{a.noSupabase || 'Supabase is not configured.'}</p>
          <a href="/" className="mt-4 inline-block text-spirit-cinnabar hover:underline">
            {a.backToCalculator || 'Back to calculator'}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEAE5]">
      {/* Header */}
      <header className="w-full bg-spirit-black border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="flex items-center gap-2 text-spirit-gray-400 hover:text-spirit-cinnabar transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                {a.backToCalculator || 'Back to calculator'}
              </a>
            </div>
            <button
              onClick={toggleLocale}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-spirit-dark border border-white/10 text-spirit-gray-200 hover:bg-spirit-cinnabar/20 hover:border-spirit-cinnabar/40 transition-colors text-sm font-medium cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              {t.header?.language || 'EN'}
            </button>
          </div>
        </div>
        <div className="w-full overflow-hidden">
          <img
            src="https://spiritsolarlighting.com/assets/globals/spirit-lijnlogo.svg"
            alt=""
            className="w-full h-2 object-cover opacity-80"
            aria-hidden="true"
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Title and Add button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-[#1A1B1A]">
            {a.title || 'Panel Configuration Management'}
          </h1>
          {!showAddForm && (
            <button
              onClick={() => { setShowAddForm(true); setEditingId(null); setForm(emptyForm); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-spirit-cinnabar text-white font-medium hover:bg-spirit-cinnabar-light transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {a.addPreset || 'Add Preset'}
            </button>
          )}
        </div>

        {/* Toast message */}
        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
              message.type === 'success'
                ? 'bg-spirit-cinnabar/20 text-spirit-cinnabar border border-spirit-cinnabar/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Add/Edit form */}
        {showAddForm && (
          <div className="glass-card p-6 mb-6">
            <h2 className="text-lg font-semibold text-[#1A1B1A] mb-4">
              {editingId ? (a.editPreset || 'Edit Preset') : (a.addPreset || 'Add Preset')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm text-[#707070] mb-1">
                  {a.name || 'Name'} *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#D7D3CD] text-[#1A1B1A] focus:outline-none focus:border-[#E14C2A] transition-colors"
                />
              </div>

              {/* Wp per side */}
              <div>
                <label className="block text-sm text-[#707070] mb-1">
                  {a.wpPerSide || 'Wp per side'}
                </label>
                <input
                  type="number"
                  value={form.wp_per_side}
                  onChange={(e) => setForm({ ...form, wp_per_side: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#D7D3CD] text-[#1A1B1A] focus:outline-none focus:border-[#E14C2A] transition-colors"
                />
              </div>

              {/* Technology */}
              <div>
                <label className="block text-sm text-[#707070] mb-1">
                  {a.technology || 'Technology'}
                </label>
                <select
                  value={form.technology}
                  onChange={(e) => setForm({ ...form, technology: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#D7D3CD] text-[#1A1B1A] focus:outline-none focus:border-[#E14C2A] transition-colors"
                >
                  <option value="crystSi">crystSi</option>
                  <option value="CIS">CIS</option>
                  <option value="CdTe">CdTe</option>
                </select>
              </div>

              {/* System loss */}
              <div>
                <label className="block text-sm text-[#707070] mb-1">
                  {a.systemLoss || 'System loss %'}
                </label>
                <input
                  type="number"
                  value={form.system_loss}
                  onChange={(e) => setForm({ ...form, system_loss: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#D7D3CD] text-[#1A1B1A] focus:outline-none focus:border-[#E14C2A] transition-colors"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-sm text-[#707070] mb-1">
                  {a.description || 'Description'}
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#D7D3CD] text-[#1A1B1A] focus:outline-none focus:border-[#E14C2A] transition-colors"
                />
              </div>

              {/* Is default */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm text-[#1A1B1A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                    className="w-4 h-4 rounded accent-spirit-cinnabar"
                  />
                  {a.isDefault || 'Default preset'}
                </label>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={!form.name.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-spirit-cinnabar text-white font-medium hover:bg-spirit-cinnabar-light transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                {a.save || 'Save'}
              </button>
              <button
                onClick={resetForm}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#D7D3CD] text-[#1A1B1A] hover:bg-[#F0EDE8] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                {a.cancel || 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* Presets table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-[#707070]">Loading...</div>
          ) : presets.length === 0 ? (
            <div className="p-8 text-center text-[#707070]">
              {locale === 'nl' ? 'Geen presets gevonden.' : 'No presets found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#F5F5F5] text-[#707070]">
                    <th className="text-left px-4 py-3 font-medium">{a.name || 'Name'}</th>
                    <th className="text-left px-4 py-3 font-medium">{a.wpPerSide || 'Wp per side'}</th>
                    <th className="text-left px-4 py-3 font-medium">{a.technology || 'Technology'}</th>
                    <th className="text-left px-4 py-3 font-medium">{a.systemLoss || 'System loss %'}</th>
                    <th className="text-left px-4 py-3 font-medium">{a.isDefault || 'Default'}</th>
                    <th className="text-right px-4 py-3 font-medium">{locale === 'nl' ? 'Acties' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {presets.map((preset) => (
                    <tr
                      key={preset.id}
                      className="border-b border-[#E5E5E5] hover:bg-[#F0EDE8] transition-colors"
                    >
                      <td className="px-4 py-3 text-[#1A1B1A] font-medium">{preset.name}</td>
                      <td className="px-4 py-3 text-[#3E3D3D]">{preset.wp_per_side}</td>
                      <td className="px-4 py-3 text-[#3E3D3D]">{preset.technology}</td>
                      <td className="px-4 py-3 text-[#3E3D3D]">{preset.system_loss}%</td>
                      <td className="px-4 py-3">
                        {preset.is_default && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-spirit-cinnabar/20 text-spirit-cinnabar">
                            <Check className="w-3 h-3 mr-1" />
                            {locale === 'nl' ? 'Ja' : 'Yes'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(preset)}
                            className="p-1.5 rounded-lg text-spirit-gray-400 hover:text-spirit-cinnabar hover:bg-spirit-cinnabar/10 transition-colors cursor-pointer"
                            title={a.editPreset || 'Edit'}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(preset.id)}
                            className="p-1.5 rounded-lg text-spirit-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title={a.delete || 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
