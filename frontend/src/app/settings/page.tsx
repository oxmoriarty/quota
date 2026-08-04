'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useTheme } from 'next-themes';
import { Sidebar } from '@/components/Sidebar';
import { Bell, User, Moon, Sun, Wallet, Mail, Palette, Monitor } from 'lucide-react';
import { FaGithub, FaXTwitter, FaTelegram } from 'react-icons/fa6';
import { SiGmail, SiEthereum, SiSolana } from 'react-icons/si';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const { address } = useAccount();
  const { theme, setTheme, systemTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile'); 
  const [userProfile, setUserProfile] = useState<{username?: string, avatar_url?: string, role?: string, bio?: string} | null>(null);

  useEffect(() => {
    if (address) {
      supabase.from('users').select('username, avatar_url, role, bio').eq('wallet_address', address.toLowerCase()).single()
        .then(({ data }) => setUserProfile(data));
    }
  }, [address]);

  // Color Theme Switcher
  const setThemeColor = (color: string) => {
    document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, '');
    document.documentElement.classList.add(`theme-${color}`);
  };

  // Font Size Switcher
  const setFontSize = (size: string) => {
    document.documentElement.className = document.documentElement.className.replace(/font-size-\w+/g, '');
    document.documentElement.classList.add(`font-size-${size}`);
  };

  // Font Family Switcher
  const setFontFamily = (font: string) => {
    document.documentElement.className = document.documentElement.className.replace(/font-family-\w+/g, '');
    document.documentElement.classList.add(`font-family-${font}`);
  };

  return (
    <div className="flex min-h-screen bg-background text-on-surface selection:bg-surface-active">
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        
        {/* TopAppBar */}
        <header className="flex justify-between items-center h-16 px-8 sticky top-0 z-10 bg-background border-b border-outline-variant">
          <div className="flex items-center space-x-4">
            <h1 className="font-headline text-2xl font-semibold text-on-surface tracking-tight">Settings</h1>
          </div>
          <div className="flex items-center space-x-6">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded transition-all focus:ring-2 focus:ring-primary/20">
              <Bell size={20} />
            </button>
          </div>
        </header>

        {/* Content */}
        <section className="p-8 flex-1 overflow-y-auto flex">
          
          {/* Settings Sidebar */}
          <div className="w-64 border-r border-outline-variant pr-8 mr-8">
            <nav className="space-y-2">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
              >
                <User size={18} />
                <span>My Profile</span>
              </button>
              <button 
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'appearance' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
              >
                <Palette size={18} />
                <span>Appearance</span>
              </button>
              <button 
                onClick={() => setActiveTab('wallets')}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'wallets' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
              >
                <Wallet size={18} />
                <span>Connected Wallets</span>
              </button>
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'notifications' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
              >
                <Bell size={18} />
                <span>Notifications</span>
              </button>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1 max-w-2xl">
            
            {activeTab === 'profile' && (
              <div className="space-y-8 animate-slide-up">
                <div>
                  <h2 className="text-xl font-bold font-headline mb-1">My Profile</h2>
                  <p className="text-sm text-on-surface-variant mb-6">Manage your public persona across the Quota network.</p>
                  
                  <div className="bg-surface-container-low border border-outline-variant p-6 rounded-lg space-y-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs uppercase font-bold text-on-surface-variant tracking-widest">Username</label>
                      <input type="text" className="bg-surface-container-highest border border-outline-variant rounded px-4 py-2 text-sm w-full focus:border-primary focus:outline-none" value={userProfile?.username || 'Loading...'} disabled />
                      <p className="text-[10px] text-on-surface-variant">Usernames cannot be changed once registered.</p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-xs uppercase font-bold text-on-surface-variant tracking-widest">Bio / Tagline</label>
                      <input type="text" className="bg-surface-container-highest border border-outline-variant rounded px-4 py-2 text-sm w-full focus:border-primary focus:outline-none" placeholder="e.g. Fullstack Web3 Developer" defaultValue={userProfile?.bio} />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs uppercase font-bold text-on-surface-variant tracking-widest">Primary Role</label>
                      <select className="bg-surface-container-highest border border-outline-variant rounded px-3 py-2 text-sm w-full focus:border-primary focus:outline-none" defaultValue={userProfile?.role || 'Developer'}>
                        <option>Developer</option>
                        <option>Designer</option>
                        <option>Product Manager</option>
                        <option>Community Manager</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Linked Accounts</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-4 rounded-lg bg-surface-container-low border border-outline-variant hover:bg-surface-bright transition-colors group">
                      <div className="flex items-center space-x-3">
                        <FaGithub size={20} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium">Connect GitHub</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Coming Soon</span>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 rounded-lg bg-surface-container-low border border-outline-variant hover:bg-surface-bright transition-colors group">
                      <div className="flex items-center space-x-3">
                        <FaXTwitter size={20} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium">Connect Twitter / X</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Coming Soon</span>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 rounded-lg bg-surface-container-low border border-outline-variant hover:bg-surface-bright transition-colors group">
                      <div className="flex items-center space-x-3">
                        <SiGmail size={20} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium">Connect Gmail</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Coming Soon</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                   <button className="bg-primary text-on-primary px-6 py-2 rounded text-sm font-bold shadow hover:bg-opacity-90 transition-all">Save Changes</button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-8 animate-slide-up">
                <div>
                  <h2 className="text-xl font-bold font-headline mb-1">Appearance</h2>
                  <p className="text-sm text-on-surface-variant mb-6">Customize how Quota looks on your device.</p>
                  
                  <h3 className="text-xs uppercase font-bold text-on-surface-variant tracking-widest mb-3">Color Mode</h3>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <button onClick={() => setTheme('dark')} className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${theme === 'dark' ? 'bg-surface-container-high border-primary text-primary' : 'bg-surface-container-low border-transparent hover:bg-surface-bright text-on-surface-variant'}`}>
                      <Moon size={24} className="mb-3" />
                      <span className="text-sm font-bold">Dark</span>
                    </button>
                    <button onClick={() => setTheme('light')} className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${theme === 'light' ? 'bg-surface-container-high border-primary text-primary' : 'bg-surface-container-low border-transparent hover:bg-surface-bright text-on-surface-variant'}`}>
                      <Sun size={24} className="mb-3" />
                      <span className="text-sm font-bold">Light</span>
                    </button>
                    <button onClick={() => setTheme('system')} className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${theme === 'system' ? 'bg-surface-container-high border-primary text-primary' : 'bg-surface-container-low border-transparent hover:bg-surface-bright text-on-surface-variant'}`}>
                      <Monitor size={24} className="mb-3" />
                      <span className="text-sm font-bold">System</span>
                    </button>
                  </div>

                  <h3 className="text-xs uppercase font-bold text-on-surface-variant tracking-widest mb-3">Accent Color</h3>
                  <div className="flex space-x-4 mb-8">
                    <button onClick={() => setThemeColor('indigo')} className="w-12 h-12 rounded-full bg-[#6366f1] ring-2 ring-transparent focus:ring-on-surface transition-all active:scale-95"></button>
                    <button onClick={() => setThemeColor('emerald')} className="w-12 h-12 rounded-full bg-[#10b981] ring-2 ring-transparent focus:ring-on-surface transition-all active:scale-95"></button>
                    <button onClick={() => setThemeColor('rose')} className="w-12 h-12 rounded-full bg-[#f43f5e] ring-2 ring-transparent focus:ring-on-surface transition-all active:scale-95"></button>
                    <button onClick={() => setThemeColor('amber')} className="w-12 h-12 rounded-full bg-[#f59e0b] ring-2 ring-transparent focus:ring-on-surface transition-all active:scale-95"></button>
                    <button onClick={() => setThemeColor('amethyst')} className="w-12 h-12 rounded-full bg-[#a855f7] ring-2 ring-transparent focus:ring-on-surface transition-all active:scale-95"></button>
                  </div>

                  <h3 className="text-xs uppercase font-bold text-on-surface-variant tracking-widest mb-3 mt-8">Typography Scaling</h3>
                  <div className="flex bg-surface-container-highest rounded-lg p-1 w-full max-w-sm">
                    <button onClick={() => setFontSize('sm')} className="flex-1 py-2 text-sm font-medium rounded hover:bg-surface focus:bg-primary focus:text-on-primary">Small</button>
                    <button onClick={() => setFontSize('md')} className="flex-1 py-2 text-sm font-medium rounded hover:bg-surface focus:bg-primary focus:text-on-primary">Default</button>
                    <button onClick={() => setFontSize('lg')} className="flex-1 py-2 text-sm font-medium rounded hover:bg-surface focus:bg-primary focus:text-on-primary">Large</button>
                  </div>

                  <h3 className="text-xs uppercase font-bold text-on-surface-variant tracking-widest mb-3 mt-8">Font Style Picker</h3>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <button onClick={() => setFontFamily('geist')} className="flex flex-col items-center justify-center p-4 bg-surface-container-low border border-outline-variant rounded-xl hover:bg-surface-bright hover:border-primary transition-all">
                      <span className="text-2xl font-bold mb-2 font-sans">Ag</span>
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Geist (Modern)</span>
                    </button>
                    <button onClick={() => setFontFamily('inter')} className="flex flex-col items-center justify-center p-4 bg-surface-container-low border border-outline-variant rounded-xl hover:bg-surface-bright hover:border-primary transition-all">
                      <span className="text-2xl font-bold mb-2" style={{ fontFamily: 'system-ui, sans-serif' }}>Ag</span>
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Inter (Clean)</span>
                    </button>
                    <button onClick={() => setFontFamily('mono')} className="flex flex-col items-center justify-center p-4 bg-surface-container-low border border-outline-variant rounded-xl hover:bg-surface-bright hover:border-primary transition-all">
                      <span className="text-2xl font-bold mb-2 font-mono">Ag</span>
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Mono (Code)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'wallets' && (
              <div className="space-y-8 animate-slide-up">
                <div>
                  <h2 className="text-xl font-bold font-headline mb-1">Connected Wallets</h2>
                  <p className="text-sm text-on-surface-variant mb-6">Manage your cross-chain wallet connections for receiving prizes.</p>
                  
                  <div className="space-y-4">
                    <div className="bg-surface-container-low border border-primary/30 p-5 rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-[#627EEA]/10 flex items-center justify-center border border-[#627EEA]/20">
                          <SiEthereum className="text-[#627EEA]" size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold">EVM Wallet</p>
                          <p className="text-xs font-mono text-on-surface-variant mt-1">{address || 'Not Connected'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-green-500 tracking-widest bg-green-500/10 px-2 py-1 rounded">Active</span>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant p-5 rounded-lg flex items-center justify-between opacity-70">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-[#14F195]/10 flex items-center justify-center border border-[#14F195]/20">
                          <SiSolana className="text-[#14F195]" size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Solana Wallet</p>
                          <p className="text-xs text-on-surface-variant mt-1">For receiving SPL tokens.</p>
                        </div>
                      </div>
                      <button className="text-[10px] uppercase font-bold text-on-surface-variant bg-surface-container-highest border border-outline-variant px-3 py-1.5 rounded cursor-not-allowed">Coming Soon</button>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant p-5 rounded-lg flex items-center justify-between opacity-70">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-[#4CA2FF]/10 flex items-center justify-center border border-[#4CA2FF]/20">
                          <div className="w-5 h-5 rounded-full bg-[#4CA2FF] flex items-center justify-center text-[10px] text-white font-bold">S</div>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Sui Wallet</p>
                          <p className="text-xs text-on-surface-variant mt-1">For receiving SUI tokens.</p>
                        </div>
                      </div>
                      <button className="text-[10px] uppercase font-bold text-on-surface-variant bg-surface-container-highest border border-outline-variant px-3 py-1.5 rounded cursor-not-allowed">Coming Soon</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8 animate-slide-up">
                <div>
                  <h2 className="text-xl font-bold font-headline mb-1">Notifications</h2>
                  <p className="text-sm text-on-surface-variant mb-6">Control how Quota notifies you about project updates.</p>
                  
                  <div className="bg-surface-container-low border border-outline-variant p-6 rounded-lg space-y-6">
                    <div className="flex items-center justify-between opacity-50">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                           <Mail size={16} />
                           <span className="text-sm font-bold">Email Alerts</span>
                        </div>
                        <span className="text-xs text-on-surface-variant mt-1">Receive project deadlines and payout confirmations.</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Coming Soon</span>
                    </div>

                    <div className="flex items-center justify-between opacity-50 border-t border-outline-variant pt-6">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                           <FaTelegram size={16} className="text-[#26A5E4]" />
                           <span className="text-sm font-bold">Telegram Bot</span>
                        </div>
                        <span className="text-xs text-on-surface-variant mt-1">Instant chat notifications for evaluations.</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Coming Soon</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>
      </main>
    </div>
  );
}
