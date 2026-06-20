'use client';

import React, { useEffect, useState } from 'react';
import { SettingsService } from '@/services/settingsService';
import { AppSetting } from '@/types';
import Button from '@/components/Button';
import { Save, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await SettingsService.getAll();
    setSettings(data);
    setLoading(false);
  };

  const handleChange = (key: string, newValue: string) => {
    setSettings(prev => 
      prev.map(s => s.key === key ? { ...s, value: newValue } : s)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(settings.map(s => SettingsService.update(s.key, s.value)));
      toast.success('Configurações atualizadas com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Carregando configurações...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="text-primary" />
          Configurações de Rastreamento (Pixel/Ads)
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-6">
          <strong>Atenção:</strong> Insira apenas os IDs fornecidos pelas plataformas (ex: <code>AW-123456</code> ou <code>1234567890</code>). Não cole o código <code>&lt;script&gt;</code> inteiro.
        </div>

        {settings.map((setting) => (
          <div key={setting.key} className="grid gap-2">
            <label className="font-semibold text-gray-700">{setting.label}</label>
            <input
              type="text"
              value={setting.value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              placeholder={`Insira o ${setting.label}`}
            />
            {setting.description && (
              <p className="text-sm text-gray-500">{setting.description}</p>
            )}
          </div>
        ))}

        <div className="pt-4 border-t mt-4">
          <Button onClick={handleSave} disabled={saving} fullWidth>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>
    </div>
  );
}