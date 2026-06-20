'use client';

import React, { useEffect, useState } from 'react';
import { SettingsService } from '@/services/settingsService';
import Button from '@/components/Button';
import { Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    meta_pixel_id: '',
    google_analytics_id: '', // GA4 (G-XXXXX)
    google_ads_id: '', // AW-XXXXX
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await SettingsService.getSettingsMap();
      setSettings({
        meta_pixel_id: data.meta_pixel_id || '',
        google_analytics_id: data.google_analytics_id || '',
        google_ads_id: data.google_ads_id || '',
      });
    } catch (error) {
      console.error('Erro ao carregar configs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.all([
        SettingsService.update('meta_pixel_id', settings.meta_pixel_id),
        SettingsService.update('google_analytics_id', settings.google_analytics_id),
        SettingsService.update('google_ads_id', settings.google_ads_id),
      ]);
      toast.success('Configurações de rastreamento salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Carregando configurações...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-800">Pixel & Rastreamento</h1>
        <p className="text-gray-600">Configure os identificadores para suas campanhas de tráfego pago.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
        
        <div className="border-b pb-6">
          <h2 className="text-xl font-bold text-blue-800 mb-4">Meta (Facebook) Ads</h2>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">Pixel ID</label>
            <input 
              type="text" 
              value={settings.meta_pixel_id}
              onChange={(e) => setSettings({...settings, meta_pixel_id: e.target.value})}
              placeholder="Ex: 1234567890"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
            <p className="text-xs text-gray-500">Apenas o número do ID do pixel.</p>
          </div>
        </div>

        <div className="border-b pb-6">
          <h2 className="text-xl font-bold text-orange-600 mb-4">Google Analytics & Ads</h2>
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Google Analytics 4 (Measurement ID)</label>
              <input 
                type="text" 
                value={settings.google_analytics_id}
                onChange={(e) => setSettings({...settings, google_analytics_id: e.target.value})}
                placeholder="Ex: G-A1B2C3D4"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Google Ads Conversion ID</label>
              <input 
                type="text" 
                value={settings.google_ads_id}
                onChange={(e) => setSettings({...settings, google_ads_id: e.target.value})}
                placeholder="Ex: AW-123456789"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={saving} fullWidth>
            {saving ? (
              <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Salvando...</span>
            ) : (
              <span className="flex items-center justify-center gap-2"><Save size={18} /> Salvar Alterações</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}