'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Sidebar } from '@/components/Sidebar';
import { Bell, User, Moon, Sun, Wallet, GitBranch, AtSign, Mail, Palette, Globe, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('profile'); // profile, appearance, wallets, notifications

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
                      <input type="text" className="bg-surface-container-highest border border-outline-variant rounded px-4 py-2 text-sm w-full focus:border-primary focus:outline-none" defaultValue="Satoshi" disabled />
                      <p className="text-[10px] text-on-surface-variant">Usernames cannot be changed once registered.</p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-xs uppercase font-bold text-on-surface-variant tracking-widest">Bio / Tagline</label>
                      <input type="text" className="bg-surface-container-highest border border-outline-variant rounded px-4 py-2 text-sm w-full focus:border-primary focus:outline-none" placeholder="e.g. Fullstack Web3 Developer" />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs uppercase font-bold text-on-surface-variant tracking-widest">Primary Role</label>
                      <select className="bg-surface-container-highest border border-outline-variant rounded px-3 py-2 text-sm w-full focus:border-primary focus:outline-none">
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
                        <GitBranch size={20} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium">Connect GitHub</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Connect</span>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 rounded-lg bg-surface-container-low border border-outline-variant hover:bg-surface-bright transition-colors group">
                      <div className="flex items-center space-x-3">
                        <AtSign size={20} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium">Connect Twitter / X</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Connect</span>
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex flex-col items-center justify-center p-8 bg-surface-container-low border-2 border-primary rounded-xl hover:bg-surface-bright transition-all">
                      <Moon size={32} className="mb-4 text-primary" />
                      <span className="text-sm font-bold">Dark Mode</span>
                      <span className="text-xs text-on-surface-variant mt-1">Currently Active</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-8 bg-surface-container-low border border-outline-variant rounded-xl hover:bg-surface-bright transition-all opacity-50 cursor-not-allowed">
                      <Sun size={32} className="mb-4 text-on-surface-variant" />
                      <span className="text-sm font-bold">Light Mode</span>
                      <span className="text-xs text-on-surface-variant mt-1">Coming Soon</span>
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
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                          <Globe className="text-blue-500" size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold">EVM Wallet (Base / Eth)</p>
                          <p className="text-xs font-mono text-on-surface-variant mt-1">{address || 'Not Connected'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-green-500 tracking-widest bg-green-500/10 px-2 py-1 rounded">Active</span>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant p-5 rounded-lg flex items-center justify-between opacity-70">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                          <Shield className="text-purple-500" size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Solana Wallet</p>
                          <p className="text-xs text-on-surface-variant mt-1">For receiving SPL tokens.</p>
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
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Email Alerts</span>
                        <span className="text-xs text-on-surface-variant mt-1">Receive project deadlines and payout confirmations.</span>
                      </div>
                      <button className="w-10 h-6 bg-surface-container-highest rounded-full border border-outline-variant relative cursor-not-allowed opacity-50">
                        <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-on-surface-variant"></div>
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 pt-4 border-t border-outline-variant opacity-50">
                      <label className="text-xs uppercase font-bold text-on-surface-variant tracking-widest">Email Address</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                        <input type="email" disabled className="bg-surface-container-highest border border-outline-variant rounded pl-10 pr-4 py-2 text-sm w-full cursor-not-allowed" placeholder="Coming Soon" />
                      </div>
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
