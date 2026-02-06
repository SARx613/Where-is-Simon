'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase';
import { QrCode, Save, Shield, MessageSquare, Download } from 'lucide-react';

export default function EventSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    watermark_text: 'Where is Simon?',
    watermark_opacity: 0.5,
    enable_guestbook: true,
    enable_privacy_mode: true,
    enable_downloads: false,
    price_per_photo: 0,
    is_public: false,
    slug: ''
  });

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('events').select('*').eq('id', id).single();
      if (data) {
        setSettings({
          watermark_text: data.watermark_text || 'Where is Simon?',
          watermark_opacity: data.watermark_opacity || 0.5,
          enable_guestbook: data.enable_guestbook ?? true,
          enable_privacy_mode: data.enable_privacy_mode ?? true,
          enable_downloads: data.enable_downloads ?? false,
          price_per_photo: data.price_per_photo || 0,
          is_public: data.is_public ?? false,
          slug: data.slug
        });
      }
      setLoading(false);
    }
    load();
  }, [id, supabase]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('events').update(settings).eq('id', id);
    if (error) alert('Erreur: ' + error.message);
    else alert('Paramètres sauvegardés !');
    setSaving(false);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Configuration de l&apos;événement</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save size={18} className="mr-2" />
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </button>
      </div>

      {/* QR Code & Access */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <QrCode size={20} className="mr-2 text-indigo-600" /> Accès & Partage
        </h3>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-gray-50 p-4 rounded-lg text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/e/${settings.slug}`)}`}
              alt="QR Code"
              className="mx-auto mb-2"
            />
            <p className="text-xs text-gray-500 font-mono">Code: {settings.slug}</p>
            <a
              href={`/e/${settings.slug}`}
              target="_blank"
              className="text-sm text-indigo-600 hover:underline block mt-2"
            >
              Voir la galerie invité
            </a>
          </div>
          <div className="flex-[2] space-y-4">
            <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <span className="text-gray-700">Galerie Publique (visible sans selfie)</span>
              <input
                type="checkbox"
                checked={settings.is_public}
                onChange={e => setSettings({...settings, is_public: e.target.checked})}
                className="h-5 w-5 text-indigo-600 rounded"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Shield size={20} className="mr-2 text-indigo-600" /> Filigrane & Protection
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texte du filigrane</label>
            <input
              type="text"
              value={settings.watermark_text}
              onChange={e => setSettings({...settings, watermark_text: e.target.value})}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opacité ({Math.round(settings.watermark_opacity * 100)}%)</label>
            <input
              type="range"
              min="0" max="1" step="0.1"
              value={settings.watermark_opacity}
              onChange={e => setSettings({...settings, watermark_opacity: parseFloat(e.target.value)})}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Features Toggle */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <MessageSquare size={20} className="mr-2 text-indigo-600" /> Fonctionnalités Invité
        </h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <div>
              <span className="block text-gray-900 font-medium">Livre d&apos;or (Texte & Vocal)</span>
              <span className="text-sm text-gray-500">Permettre aux invités de laisser des messages.</span>
            </div>
            <input
              type="checkbox"
              checked={settings.enable_guestbook}
              onChange={e => setSettings({...settings, enable_guestbook: e.target.checked})}
              className="h-5 w-5 text-indigo-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <div>
              <span className="block text-gray-900 font-medium">Mode Vie Privée</span>
              <span className="text-sm text-gray-500">Permettre aux invités de masquer leurs photos.</span>
            </div>
            <input
              type="checkbox"
              checked={settings.enable_privacy_mode}
              onChange={e => setSettings({...settings, enable_privacy_mode: e.target.checked})}
              className="h-5 w-5 text-indigo-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* Sales */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Download size={20} className="mr-2 text-indigo-600" /> Téléchargement & Vente
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <span className="text-gray-900 font-medium">Autoriser le téléchargement gratuit</span>
            <input
              type="checkbox"
              checked={settings.enable_downloads}
              onChange={e => setSettings({...settings, enable_downloads: e.target.checked})}
              className="h-5 w-5 text-indigo-600 rounded"
            />
          </label>

          {!settings.enable_downloads && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix par photo (Centimes d&apos;€)</label>
              <input
                type="number"
                value={settings.price_per_photo}
                onChange={e => setSettings({...settings, price_per_photo: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Ex: 500 pour 5.00€"
              />
              <p className="text-xs text-gray-500 mt-1">Laissez à 0 pour désactiver la vente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
