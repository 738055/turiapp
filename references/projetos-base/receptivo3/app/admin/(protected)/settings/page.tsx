'use client';

import React, { useState, useEffect } from 'react';
import {
  Save, CreditCard, BarChart2, Mail, MessageCircle, Store,
  CheckCircle, XCircle, Loader2, Send,
} from 'lucide-react';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // ── Dados da Empresa ─────────────────────────────────────────────────────
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // ── Marketing & Tracking ─────────────────────────────────────────────────
  const [googleTagManagerId, setGoogleTagManagerId] = useState('');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [metaPixelId, setMetaPixelId] = useState('');
  const [metaConversionsApiToken, setMetaConversionsApiToken] = useState('');

  // ── SMTP ─────────────────────────────────────────────────────────────────
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [testEmailTarget, setTestEmailTarget] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [testEmailMsg, setTestEmailMsg] = useState('');

  // ── Stripe ───────────────────────────────────────────────────────────────
  const [stripePublicKey, setStripePublicKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');

  // ── Modal Promo ──────────────────────────────────────────────────────────
  const [promoActive, setPromoActive] = useState(false);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoText, setPromoText] = useState('');
  const [promoCoupon, setPromoCoupon] = useState('');

  // ── Fetch inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchSettings() {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) return;
      const data = await res.json();

      setCompanyName(data.company_name || '');
      setCnpj(data.cnpj || '');
      setContactEmail(data.contact_email || '');
      setPhone(data.phone || '');
      setAddress(data.address || '');

      setGoogleTagManagerId(data.google_tag_manager_id || '');
      setGoogleAnalyticsId(data.google_analytics_id || '');
      setMetaPixelId(data.meta_pixel_id || '');
      setMetaConversionsApiToken(data.meta_conversions_api_token || '');

      setSmtpHost(data.smtp_host || '');
      setSmtpPort(data.smtp_port ? String(data.smtp_port) : '');
      setSmtpUser(data.smtp_user || '');
      setSmtpPass(data.smtp_pass || '');
      setTestEmailTarget(data.smtp_user || '');

      setStripePublicKey(data.stripe_public_key || '');
      setStripeSecretKey(data.stripe_secret_key || '');
      setStripeWebhookSecret(data.stripe_webhook_secret || '');

      setPromoActive(data.promo_modal_active || false);
      setPromoTitle(data.promo_modal_title || '');
      setPromoText(data.promo_modal_text || '');
      setPromoCoupon(data.promo_modal_coupon_code || '');
    }
    fetchSettings();
  }, []);

  // ── Salvar ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveStatus('saving');
    const payload = {
      company_name: companyName,
      cnpj,
      contact_email: contactEmail,
      phone,
      address,

      google_tag_manager_id: googleTagManagerId,
      google_analytics_id: googleAnalyticsId,
      meta_pixel_id: metaPixelId,
      meta_conversions_api_token: metaConversionsApiToken,

      smtp_host: smtpHost,
      smtp_port: parseInt(smtpPort, 10) || 587,
      smtp_user: smtpUser,
      smtp_pass: smtpPass,

      stripe_public_key: stripePublicKey,
      stripe_secret_key: stripeSecretKey,
      stripe_webhook_secret: stripeWebhookSecret,

      promo_modal_active: promoActive,
      promo_modal_title: promoTitle,
      promo_modal_text: promoText,
      promo_modal_coupon_code: promoCoupon,
    };

    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSaveStatus(res.ok ? 'success' : 'error');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  // ── Testar SMTP ───────────────────────────────────────────────────────────
  const handleTestEmail = async () => {
    if (!testEmailTarget) return alert('Informe um e-mail de destino para o teste.');
    setTestEmailStatus('sending');
    setTestEmailMsg('');
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmailTarget }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestEmailStatus('ok');
        setTestEmailMsg('E-mail de teste enviado com sucesso!');
      } else {
        setTestEmailStatus('error');
        setTestEmailMsg(data.error || 'Falha ao enviar. Verifique as configurações SMTP.');
      }
    } catch {
      setTestEmailStatus('error');
      setTestEmailMsg('Erro de conexão ao testar o servidor.');
    }
    setTimeout(() => setTestEmailStatus('idle'), 6000);
  };

  // ── Abas ──────────────────────────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-5 animate-fadeIn">
            <p className="text-xs text-gray-400 bg-primary-50 border border-primary-100 rounded-lg px-4 py-2">
              Estes dados aparecem no rodapé, na página de contato e nos e-mails enviados.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Pratik Turismo"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">E-mail de Contato</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="contato@pratikturismo.com.br"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="+55 45 99999-9999"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Endereço Completo</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Av. Brasil, 1234 - Centro, Foz do Iguaçu - PR"
              />
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <CreditCard size={20} /> Gateway de Pagamento
                </h3>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                  Stripe
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Chave Pública (pk_live...)
                  </label>
                  <input
                    type="text"
                    value={stripePublicKey}
                    onChange={(e) => setStripePublicKey(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Chave Secreta (sk_live...)
                  </label>
                  <input
                    type="password"
                    value={stripeSecretKey}
                    onChange={(e) => setStripeSecretKey(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Digite a nova chave para alterar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Webhook Secret (whsec...)
                  </label>
                  <input
                    type="password"
                    value={stripeWebhookSecret}
                    onChange={(e) => setStripeWebhookSecret(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Digite a nova chave para alterar"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'marketing':
        return (
          <div className="space-y-5 animate-fadeIn">
            <h3 className="font-bold text-gray-800 border-b pb-2">Tracking e Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Google Tag Manager ID
                </label>
                <input
                  type="text"
                  value={googleTagManagerId}
                  onChange={(e) => setGoogleTagManagerId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="GTM-XXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Google Analytics 4 ID
                </label>
                <input
                  type="text"
                  value={googleAnalyticsId}
                  onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Meta Pixel ID</label>
                <input
                  type="text"
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="1234567890123456"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Meta CAPI Token
                </label>
                <input
                  type="password"
                  value={metaConversionsApiToken}
                  onChange={(e) => setMetaConversionsApiToken(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Digite para alterar"
                />
              </div>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-5 animate-fadeIn">
            <h3 className="font-bold text-gray-800 border-b pb-2">Servidor de E-mail (SMTP)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Host SMTP
                </label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Porta (587 TLS / 465 SSL)
                </label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="587"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Usuário (e-mail remetente)
                </label>
                <input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="noreply@pratikturismo.com.br"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Senha / App Password
                </label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Digite para alterar"
                />
              </div>
            </div>

            {/* Teste de e-mail */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-2">
              <p className="text-sm font-bold text-gray-700 mb-3">
                Testar conexão SMTP
              </p>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={testEmailTarget}
                  onChange={(e) => setTestEmailTarget(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="seu@email.com"
                />
                <button
                  onClick={handleTestEmail}
                  disabled={testEmailStatus === 'sending'}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-60 shrink-0"
                >
                  {testEmailStatus === 'sending' ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Enviar Teste
                </button>
              </div>
              {testEmailMsg && (
                <div
                  className={`mt-3 flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg ${
                    testEmailStatus === 'ok'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {testEmailStatus === 'ok' ? (
                    <CheckCircle size={16} />
                  ) : (
                    <XCircle size={16} />
                  )}
                  {testEmailMsg}
                </div>
              )}
            </div>
          </div>
        );

      case 'promo':
        return (
          <div className="space-y-5 animate-fadeIn">
            <h3 className="font-bold text-gray-800 border-b pb-2">Modal Promocional na Home</h3>
            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="promoActive"
                checked={promoActive}
                onChange={(e) => setPromoActive(e.target.checked)}
                className="w-5 h-5 text-primary rounded"
              />
              <label htmlFor="promoActive" className="text-gray-700 font-bold cursor-pointer">
                Ativar Modal Promocional na Home
              </label>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Título do Modal
                </label>
                <input
                  type="text"
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Oferta Especial de Verão!"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Texto Promocional
                </label>
                <textarea
                  value={promoText}
                  onChange={(e) => setPromoText(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Descreva a oferta..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Código do Cupom (Opcional)
                </label>
                <input
                  type="text"
                  value={promoCoupon}
                  onChange={(e) => setPromoCoupon(e.target.value.toUpperCase())}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="VERAO20"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h1>
        <p className="text-gray-500">Personalize sua plataforma e integrações.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Menu lateral */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {[
              { id: 'general',   label: 'Dados da Empresa',    icon: Store },
              { id: 'payment',   label: 'Pagamentos',          icon: CreditCard },
              { id: 'marketing', label: 'Marketing',           icon: BarChart2 },
              { id: 'email',     label: 'Servidor de E-mail',  icon: Mail },
              { id: 'promo',     label: 'Modal Promocional',   icon: MessageCircle },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-6 py-4 flex items-center gap-3 font-medium transition-colors border-l-4 ${
                  activeTab === item.id
                    ? 'bg-primary-50 border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon size={18} /> {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 pb-24">{renderTabContent()}</div>

          {/* Footer fixo com status de save */}
          <div className="sticky bottom-0 left-0 right-0 px-6 py-4 border-t border-gray-100 bg-white/95 backdrop-blur-sm flex justify-between items-center">
            {saveStatus === 'success' && (
              <span className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                <CheckCircle size={16} /> Configurações salvas com sucesso!
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-2 text-red-600 text-sm font-semibold">
                <XCircle size={16} /> Erro ao salvar. Tente novamente.
              </span>
            )}
            {(saveStatus === 'idle' || saveStatus === 'saving') && <span />}

            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm flex items-center gap-2 transition-colors disabled:opacity-60 ml-auto"
            >
              {saveStatus === 'saving' ? (
                <><Loader2 size={18} className="animate-spin" /> Salvando...</>
              ) : (
                <><Save size={18} /> Salvar Alterações</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
