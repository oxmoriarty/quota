'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Activity, Bell, FileText, Search, Zap, Clock, Shield, CheckCircle2, AlertTriangle, Filter, Plus, ArrowRight, User, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { useUI } from '@/components/UIProvider';

export default function DashboardPage() {
  const { address } = useAccount();
  const router = useRouter();
  const { toast } = useUI();
  
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter and Sort State
  const [filter, setFilter] = useState('All'); // All, Active, Pending, Reviewed, Closed
  const [sort, setSort] = useState('Newest'); // Newest, Oldest

  useEffect(() => {
    async function fetchData() {
      if (!address) return;
      try {
        const { data: userData } = await supabase.from('users').select('*').eq('wallet_address', address.toLowerCase()).single();
        if (userData) setUser(userData);

        if (userData) {
          const { data: memberProjects } = await supabase.from('team_members').select('project_id').eq('user_id', userData.id);
          const projectIds = memberProjects?.map(mp => mp.project_id) || [];
          const { data: projData } = await supabase.from('projects').select('*').or(`creator_id.eq.${userData.id},id.in.(${projectIds.length > 0 ? projectIds.join(',') : '00000000-0000-0000-0000-000000000000'})`).order('created_at', { ascending: false });
          if (projData) setProjects(projData);
        }
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [address]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background text-on-surface">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center min-h-screen">
          <Activity className="animate-pulse text-on-surface-variant" size={24} />
        </main>
      </div>
    );
  }

  // Apply Filters
  let filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  if (filter === 'Active') {
    filteredProjects = filteredProjects.filter(p => p.status === 'Submissions Open');
  } else if (filter === 'Pending') {
    filteredProjects = filteredProjects.filter(p => p.status === 'Evaluation Pending' || p.status === 'Under Evaluation');
  } else if (filter === 'Reviewed') {
    filteredProjects = filteredProjects.filter(p => p.status === 'Allocation Finalized');
  } else if (filter === 'Closed') {
    filteredProjects = filteredProjects.filter(p => p.status === 'Distribution Complete' || p.status === 'No Prize Awarded');
  }

  // Apply Sorting
  filteredProjects.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sort === 'Newest' ? dateB - dateA : dateA - dateB;
  });

  // Pagination Logic
  const totalProjects = filteredProjects.length;
  const totalPages = Math.ceil(totalProjects / itemsPerPage);
  
  // Ensure we don't end up on a blank page if we filter heavily
  if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);

  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex min-h-screen bg-background text-on-surface selection:bg-surface-active">
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col min-h-screen overflow-x-hidden">
        {/* TopAppBar */}
        <header className="flex justify-between items-center h-16 px-8 sticky top-0 z-10 bg-background border-b border-outline-variant">
          <div className="flex items-center space-x-4">
            <h1 className="font-headline text-2xl font-semibold text-on-surface tracking-tight">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={16} />
              <input 
                className="bg-surface-container-low border border-outline-variant rounded px-10 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/50 text-on-surface" 
                placeholder="Search projects..." 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <kbd className="text-[10px] bg-surface-container-highest px-1.5 py-0.5 rounded border border-outline-variant font-sans opacity-60">⌘</kbd>
                <kbd className="text-[10px] bg-surface-container-highest px-1.5 py-0.5 rounded border border-outline-variant font-sans opacity-60">K</kbd>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => toast("No new notifications", "info")} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded transition-all focus:ring-2 focus:ring-primary/20">
                <Bell size={20} />
              </button>
              <Link href="/create" className="bg-primary text-on-primary px-4 py-1.5 rounded text-sm font-semibold hover:bg-opacity-90 transition-all shadow-sm flex items-center gap-2">
                <Plus size={16} /> Create Workspace
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <section className="p-8 flex-1 overflow-y-auto">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-surface-container-low border border-outline-variant p-4 rounded-lg">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Total Active</p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-2xl font-headline font-bold text-primary">{projects.filter(p => p.status === 'Submissions Open').length < 10 ? `0${projects.filter(p => p.status === 'Submissions Open').length}` : projects.filter(p => p.status === 'Submissions Open').length}</h3>
                <span className="text-xs text-green-500 font-medium">+1 this week</span>
              </div>
            </div>
            <div className="bg-surface-container-low border border-outline-variant p-4 rounded-lg">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Total Prize Pool</p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-2xl font-headline font-bold text-primary">TBD</h3>
                <span className="text-xs text-on-surface-variant opacity-50">USD</span>
              </div>
            </div>
            <div className="bg-surface-container-low border border-outline-variant p-4 rounded-lg">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Submissions</p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-2xl font-headline font-bold text-primary">0</h3>
                <span className="text-xs text-on-surface-variant opacity-50">Lifetime</span>
              </div>
            </div>
            <div className="bg-surface-container-low border border-outline-variant p-4 rounded-lg relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Engine Status</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <h3 className="text-lg font-headline font-bold text-primary">Operational</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div className="flex items-center justify-between mb-4 mt-8">
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-widest">Active Hackathon Projects</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter size={14} className="text-on-surface-variant" />
                <select 
                  className="text-xs bg-surface-container-high border border-outline-variant rounded px-2 py-1 focus:outline-none focus:border-primary text-on-surface"
                  value={filter}
                  onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="All">All Projects</option>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <ArrowUpDown size={14} className="text-on-surface-variant" />
                <select 
                  className="text-xs bg-surface-container-high border border-outline-variant rounded px-2 py-1 focus:outline-none focus:border-primary text-on-surface"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="Newest">Newest First</option>
                  <option value="Oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Project Table */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Project Name</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Hackathon Event</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Prize Pool</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {paginatedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant text-sm">
                      No projects found. <Link href="/create" className="text-primary hover:underline">Create one now.</Link>
                    </td>
                  </tr>
                ) : paginatedProjects.map(p => (
                  <tr key={p.id} className="hover:bg-surface-bright transition-all group relative cursor-pointer" onClick={() => window.location.href=`/project/${p.id}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-8 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity -ml-6 mr-1 absolute left-6"></div>
                        <div className="flex flex-col ml-2">
                          <span className="text-sm font-semibold text-primary">{p.name}</span>
                          <span className="text-[10px] text-on-surface-variant/60">{new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-on-surface-variant">{p.hackathon}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-on-surface">TBD {p.prize_token}</span>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const s = p.status;
                        let colorClass = "bg-surface-container-high text-on-surface-variant border-outline-variant";
                        let dotClass = "bg-on-surface-variant";
                        let label = s;

                        if (s === 'Submissions Open') {
                          colorClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
                          dotClass = "bg-emerald-500";
                          label = "Active";
                        } else if (s === 'Submissions Closed') {
                          colorClass = "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
                          dotClass = "bg-slate-500";
                        } else if (s === 'Evaluation Pending') {
                          colorClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
                          dotClass = "bg-amber-500";
                        } else if (s === 'Under Evaluation') {
                          colorClass = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
                          dotClass = "bg-indigo-500";
                        } else if (s === 'Allocation Finalized') {
                          colorClass = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
                          dotClass = "bg-purple-500";
                        } else if (s === 'Distribution Complete') {
                          colorClass = "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20";
                          dotClass = "bg-teal-500";
                        } else if (s === 'No Prize Awarded') {
                          colorClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
                          dotClass = "bg-rose-500";
                        }

                        return (
                          <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm shadow-sm ${colorClass}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${dotClass} shadow-[0_0_8px_rgba(0,0,0,0.5)] shadow-${dotClass.split('-')[1]}-500/50`} />
                            <span>{label}</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-on-surface-variant hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); }}>
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between mt-4 mb-8">
              <p className="text-xs text-on-surface-variant font-medium">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalProjects)} - {Math.min(currentPage * itemsPerPage, totalProjects)} of {totalProjects} Projects
              </p>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-surface-container-high border border-outline-variant rounded text-xs font-bold hover:bg-surface-bright disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-surface-container-high border border-outline-variant rounded text-xs font-bold hover:bg-surface-bright disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Bento-Style Bottom Section */}
          <div className="mt-8 grid grid-cols-12 gap-6 pb-12">
            <div className="col-span-8 bg-surface-container-low border border-outline-variant p-6 rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">System Activity</h3>
                <span className="text-xs text-on-surface-variant hover:underline cursor-pointer">View full log</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="mt-1 w-2 h-2 rounded-full bg-primary ring-4 ring-primary/10"></div>
                  <div className="flex-1 border-b border-outline-variant pb-4">
                    <p className="text-sm text-on-surface font-medium">Quota System Initialization</p>
                    <p className="text-xs text-on-surface-variant mt-1">Recently</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-4 bg-surface-container-highest border border-outline-variant p-6 rounded-lg relative flex flex-col justify-between group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-2 text-primary mb-4">
                  <Activity size={16} />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Recent Project</h3>
                </div>
                {projects.length > 0 ? (
                  <>
                    <p className="text-xl font-headline font-bold text-on-surface mb-1 truncate">{projects[0].name}</p>
                    <p className="text-sm text-on-surface-variant font-medium">{projects[0].status}</p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-headline font-bold text-on-surface-variant mb-1">None</p>
                    <p className="text-sm text-on-surface-variant font-medium">Create a workspace to start</p>
                  </>
                )}
              </div>
              <Link href={projects.length > 0 ? `/project/${projects[0].id}` : '/create'} className="relative z-10 mt-6 w-full py-2 flex items-center justify-center bg-surface-container-low border border-outline-variant text-primary text-xs font-bold rounded hover:bg-primary/10 transition-all">
                {projects.length > 0 ? 'OPEN WORKSPACE' : 'NEW WORKSPACE'}
              </Link>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700"></div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
