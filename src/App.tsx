import { useEffect, useState, type ReactNode } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, type User } from 'firebase/auth';
import { LogIn, LogOut, Moon, Settings2, ShieldCheck, Sun, Wallet } from 'lucide-react';
import { Finance } from './components/Finance';
import { FinanceSettings } from './components/FinanceSettings';
import { auth } from './lib/firebase';

const ALLOWED_EMAIL = 'gu.correa98@gmail.com';
type AccessState = 'loading' | 'signed-out' | 'authorized' | 'denied';
type Theme = 'dark' | 'light';

export default function App() {
  const [state, setState] = useState<AccessState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>(() => window.localStorage.getItem('simplicio-financeiro-theme') === 'light' ? 'light' : 'dark');
  const [error, setError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeView, setActiveView] = useState<'finance' | 'settings'>('finance');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('simplicio-financeiro-theme', theme);
  }, [theme]);

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser);
    if (!nextUser) return setState('signed-out');
    setState(nextUser.email?.toLowerCase() === ALLOWED_EMAIL ? 'authorized' : 'denied');
  }), []);

  const login = async () => {
    setError('');
    setIsSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (nextError) {
      setError(getLoginMessage(nextError));
    } finally {
      setIsSigningIn(false);
    }
  };

  const loginWithRedirect = async () => {
    setError('');
    setIsSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithRedirect(auth, provider);
    } catch (nextError) {
      setError(getLoginMessage(nextError));
      setIsSigningIn(false);
    }
  };

  if (state !== 'authorized') return <LoginScreen state={state} error={error} isSigningIn={isSigningIn} onLogin={login} onLoginWithRedirect={loginWithRedirect} onLogout={() => void signOut(auth)} />;

  return <div className={`app-shell ${theme === 'light' ? 'theme-light' : 'theme-dark'} flex h-screen overflow-hidden font-sans`}>
    <aside className="hidden w-64 shrink-0 border-r border-slate-900/50 bg-slate-950 p-4 lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-2 py-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white"><Wallet size={16} /></div><div><p className="font-display text-sm font-bold text-slate-100">Simplicio.</p><p className="text-[10px] text-slate-500">Financeiro</p></div></div>
      <nav className="mt-8 space-y-1"><NavButton active={activeView === 'finance'} onClick={() => setActiveView('finance')} icon={<Wallet size={16} />} label="Financeiro" /><NavButton active={activeView === 'settings'} onClick={() => setActiveView('settings')} icon={<Settings2 size={16} />} label="Configurações" /></nav>
      <div className="mt-auto rounded-xl border border-blue-500/20 bg-blue-500/[0.06] p-3"><p className="text-[10px] font-semibold uppercase tracking-widest text-blue-300">Área privada</p><p className="mt-1 text-[11px] leading-5 text-slate-400">Planilhas e lançamentos exclusivos deste Financeiro.</p></div>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden"><header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-900/50 bg-slate-950/20 px-6 backdrop-blur-sm lg:px-10"><div className="flex items-center gap-2 lg:hidden"><Wallet size={16} className="text-blue-400" /><span className="font-display text-sm font-bold text-slate-100">Financeiro</span></div><span className="hidden text-[11px] text-slate-500 lg:block">{activeView === 'finance' ? 'Visão de caixa, saídas e tráfego' : 'Conexões exclusivas das planilhas financeiras'}</span><div className="flex items-center gap-3"><button onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-100" title="Alterar tema">{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button><div className="hidden text-right sm:block"><p className="text-[11px] font-semibold text-slate-200">{user?.displayName || 'Gustavo Correa'}</p><p className="text-[10px] text-slate-600">Administrador</p></div><button onClick={() => void signOut(auth)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-500 hover:text-slate-100" title="Sair"><LogOut size={15} /></button></div></header><main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">{activeView === 'finance' ? <Finance /> : <FinanceSettings />}</main></div>
  </div>;
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] font-semibold transition-colors ${active ? 'bg-blue-500/10 text-blue-300' : 'text-slate-500 hover:bg-slate-900/40 hover:text-slate-200'}`}>{icon}{label}</button>;
}

function LoginScreen({ state, error, isSigningIn, onLogin, onLoginWithRedirect, onLogout }: { state: AccessState; error: string; isSigningIn: boolean; onLogin: () => void; onLoginWithRedirect: () => void; onLogout: () => void }) {
  const denied = state === 'denied';
  return <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-200"><section className="w-full max-w-md rounded-2xl border border-slate-900 bg-slate-950 p-7 shadow-2xl"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-300"><ShieldCheck size={18} /></div><div><h1 className="font-display text-lg font-bold text-slate-100">Simplicio Financeiro</h1><p className="text-[12px] text-slate-500">Ambiente administrativo privado.</p></div></div>{denied ? <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-[12px] leading-5 text-amber-200">Este e-mail não tem acesso a esta aplicação.</div> : <p className="mt-6 text-[12px] leading-5 text-slate-500">Entre com a conta administrativa autorizada para consultar o financeiro.</p>}{error && <div className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-[11px] text-rose-200">{error}</div>}{denied ? <button onClick={onLogout} className="mt-6 h-10 w-full rounded-lg border border-slate-800 text-[12px] font-semibold text-slate-300">Trocar conta</button> : <><button onClick={onLogin} disabled={state === 'loading' || isSigningIn} className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-[12px] font-bold text-white hover:bg-blue-500 disabled:opacity-60"><LogIn size={14} />{isSigningIn ? 'Abrindo Google...' : state === 'loading' ? 'Verificando acesso...' : 'Entrar com Google'}</button><button onClick={onLoginWithRedirect} disabled={state === 'loading' || isSigningIn} className="mt-2 h-9 w-full rounded-lg border border-slate-800 text-[11px] font-semibold text-slate-400 hover:text-slate-100 disabled:opacity-60">Entrar redirecionando</button></>}</section></div>;
}

function getLoginMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('auth/unauthorized-domain')) return 'Este domínio ainda não foi autorizado no Firebase Authentication. Adicione simplicio-financeiro-ten.vercel.app em Authorized domains.';
  if (message.includes('auth/popup-closed-by-user') || message.includes('auth/popup-blocked')) return 'O popup do Google foi bloqueado ou fechado. Use “Entrar redirecionando”.';
  if (message.includes('auth/operation-not-allowed')) return 'O login com Google não está ativo no Firebase Authentication.';
  return `Não foi possível iniciar o login: ${message}`;
}
