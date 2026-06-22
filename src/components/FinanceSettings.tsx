import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, FileSpreadsheet, Link2, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import {
  defaultIntegrationSettings,
  inspectSheetConnection,
  saveIntegrationSettings,
  subscribeIntegrationSettings,
  type AdAccountConfig,
  type IntegrationSettings,
  type SalesSheetConfig,
} from '../lib/integrations';

const input = 'h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-[12px] text-slate-200 outline-none focus:border-blue-500';
const label = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-500';

export function FinanceSettings() {
  const [settings, setSettings] = useState<IntegrationSettings>(defaultIntegrationSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [inspecting, setInspecting] = useState<string>('');

  useEffect(() => subscribeIntegrationSettings((next) => { setSettings(next); setLoading(false); }, (error) => { setMessage(`Não foi possível ler as configurações: ${error.code}`); setLoading(false); }), []);

  const updateSales = (id: string, patch: Partial<SalesSheetConfig>) => setSettings((current) => ({ ...current, salesSources: current.salesSources.map((source) => source.id === id ? { ...source, ...patch } : source) }));
  const updateAds = (id: string, patch: Partial<AdAccountConfig>) => setSettings((current) => ({ ...current, adAccounts: current.adAccounts.map((account) => account.id === id ? { ...account, ...patch } : account) }));
  const removeSales = (id: string) => setSettings((current) => ({ ...current, salesSources: current.salesSources.filter((source) => source.id !== id) }));
  const removeAds = (id: string) => setSettings((current) => ({ ...current, adAccounts: current.adAccounts.filter((account) => account.id !== id) }));

  const inspect = async (type: 'sales' | 'ads', id: string, url: string, gid: string) => {
    if (!url.trim()) return;
    setInspecting(id); setMessage('');
    try {
      const result = await inspectSheetConnection(type, url, gid || getGid(url));
      if (type === 'sales') updateSales(id, { ...result.detected, gid: gid || getGid(url), status: 'Ativa' });
      else updateAds(id, { ...result.detected, gid: gid || getGid(url), status: 'Ativa' });
      setMessage(`${result.rowCount} linha(s) lida(s). Colunas reconhecidas automaticamente.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível analisar a planilha.');
    } finally { setInspecting(''); }
  };

  const save = async () => {
    setSaving(true); setMessage('');
    try { await saveIntegrationSettings(settings); setMessage('Configurações financeiras salvas.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-10 text-[12px] text-slate-500">Carregando configurações financeiras...</div>;
  return <div className="mx-auto max-w-[1320px] space-y-6 p-10 text-slate-300">
    <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-widest text-blue-400">Integrações financeiras</p><h1 className="mt-2 text-xl font-display font-bold tracking-tight text-slate-100">Configurações</h1><p className="mt-1 max-w-2xl text-[12px] leading-5 text-slate-500">Estas conexões pertencem somente ao Simplicio Financeiro e não alteram as planilhas do Workspace.</p></div><button onClick={() => void save()} disabled={saving} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-[12px] font-bold text-white hover:bg-blue-500 disabled:opacity-60"><Save size={14} />{saving ? 'Salvando...' : 'Salvar configurações'}</button></header>
    {message && <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-4 py-3 text-[12px] text-blue-200">{message}</div>}
    <SettingsGroup title="Planilhas de vendas" description="Entradas reais do Financeiro. A aplicação analisa a URL e identifica data, produto, pedidos e comissão automaticamente." icon={<FileSpreadsheet size={16} />} onAdd={() => setSettings((current) => ({ ...current, salesSources: [...current.salesSources, newSalesSource()] }))}>
      {settings.salesSources.map((source) => <div key={source.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><div className="mb-4 flex items-center justify-between"><div><p className="text-[12px] font-semibold text-slate-200">{source.platform || 'Nova fonte de vendas'}</p><p className="mt-1 text-[10px] text-slate-600">Comissão é usada como entrada líquida.</p></div><button onClick={() => removeSales(source.id)} className="icon-button text-slate-500 hover:text-rose-300" title="Remover"><Trash2 size={14} /></button></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Field label="Nome da fonte"><input className={input} value={source.platform} onChange={(event) => updateSales(source.id, { platform: event.target.value })} placeholder="Ex.: Hubla" /></Field><Field label="Status"><select className={input} value={source.status} onChange={(event) => updateSales(source.id, { status: event.target.value as SalesSheetConfig['status'] })}><option>Ativa</option><option>Pendente</option><option>Erro</option></select></Field><Field label="GID / aba"><input className={input} value={source.gid} onChange={(event) => updateSales(source.id, { gid: event.target.value })} placeholder="0" /></Field><Field label="Taxa da plataforma (%)"><input type="number" className={input} value={source.platformFeeRate} onChange={(event) => updateSales(source.id, { platformFeeRate: Number(event.target.value) || 0 })} /></Field><Field label="URL da planilha" wide><input className={input} value={source.spreadsheetUrl} onChange={(event) => updateSales(source.id, { spreadsheetUrl: event.target.value, gid: source.gid || getGid(event.target.value) })} placeholder="Cole o link da planilha ou da aba" /></Field></div><div className="mt-4 flex justify-end"><button onClick={() => void inspect('sales', source.id, source.spreadsheetUrl, source.gid)} disabled={inspecting === source.id || !source.spreadsheetUrl.trim()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-800 px-3 text-[11px] font-semibold text-slate-300 hover:text-white disabled:opacity-50"><RefreshCw size={13} className={inspecting === source.id ? 'animate-spin' : ''} />Analisar colunas</button></div></div>)}
    </SettingsGroup>
    <SettingsGroup title="Contas de anúncio" description="Fontes de tráfego. O Financeiro importa o investimento e aplica automaticamente o imposto configurado na regra financeira." icon={<Link2 size={16} />} onAdd={() => setSettings((current) => ({ ...current, adAccounts: [...current.adAccounts, newAdAccount()] }))}>
      {settings.adAccounts.map((account) => <div key={account.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><div className="mb-4 flex items-center justify-between"><div><p className="text-[12px] font-semibold text-slate-200">{account.name || 'Nova conta de anúncio'}</p><p className="mt-1 text-[10px] text-slate-600">Gasto importado como saída de tráfego.</p></div><button onClick={() => removeAds(account.id)} className="icon-button text-slate-500 hover:text-rose-300" title="Remover"><Trash2 size={14} /></button></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Field label="Nome da conta"><input className={input} value={account.name} onChange={(event) => updateAds(account.id, { name: event.target.value })} placeholder="Ex.: Meta Ads 01" /></Field><Field label="Plataforma"><input className={input} value={account.platform} onChange={(event) => updateAds(account.id, { platform: event.target.value })} placeholder="Meta Ads" /></Field><Field label="GID / aba"><input className={input} value={account.gid} onChange={(event) => updateAds(account.id, { gid: event.target.value })} placeholder="0" /></Field><Field label="Status"><select className={input} value={account.status} onChange={(event) => updateAds(account.id, { status: event.target.value as AdAccountConfig['status'] })}><option>Ativa</option><option>Pendente</option><option>Erro</option></select></Field><Field label="URL da planilha" wide><input className={input} value={account.spreadsheetUrl} onChange={(event) => updateAds(account.id, { spreadsheetUrl: event.target.value, gid: account.gid || getGid(event.target.value) })} placeholder="Cole o link da planilha ou da aba" /></Field></div><div className="mt-4 flex justify-end"><button onClick={() => void inspect('ads', account.id, account.spreadsheetUrl, account.gid)} disabled={inspecting === account.id || !account.spreadsheetUrl.trim()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-800 px-3 text-[11px] font-semibold text-slate-300 hover:text-white disabled:opacity-50"><RefreshCw size={13} className={inspecting === account.id ? 'animate-spin' : ''} />Analisar colunas</button></div></div>)}
    </SettingsGroup>
  </div>;
}

function SettingsGroup({ title, description, icon, onAdd, children }: { title: string; description: string; icon: ReactNode; onAdd: () => void; children: ReactNode }) { return <section className="rounded-2xl border border-slate-900/60 bg-slate-950 p-5"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-3"><div className="mt-0.5 text-blue-400">{icon}</div><div><h2 className="text-sm font-semibold text-slate-100">{title}</h2><p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-500">{description}</p></div></div><button onClick={onAdd} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-800 px-3 text-[11px] font-semibold text-slate-300 hover:text-white"><Plus size={13} />Adicionar</button></div><div className="space-y-3">{children}</div></section>; }
function Field({ label: title, wide, children }: { label: string; wide?: boolean; children: ReactNode }) { return <label className={wide ? 'md:col-span-2 xl:col-span-4' : ''}><span className={label}>{title}</span>{children}</label>; }
function getGid(value: string) { return value.match(/[?#&]gid=(\d+)/)?.[1] || '0'; }
function newSalesSource(): SalesSheetConfig { return { ...defaultIntegrationSettings.salesSources[0], id: `sales-${Date.now()}`, platform: '', spreadsheetUrl: '', gid: '0', status: 'Pendente' }; }
function newAdAccount(): AdAccountConfig { return { ...defaultIntegrationSettings.adAccounts[0], id: `ads-${Date.now()}`, name: '', spreadsheetUrl: '', gid: '0', status: 'Pendente' }; }
