'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import CategoryManagement from '@/components/admin/CategoryManagement';
import PollManagement from '@/components/admin/PollManagement';

function DashboardContent() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'polls' | 'categories'>('dashboard');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'categories' || tab === 'polls' || tab === 'dashboard') {
      setActiveTab(tab);
    } else {
      setActiveTab('dashboard');
    }
  }, [searchParams]);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/me');
      const data = await res.json();
      if (data.success) {
        setAuthenticated(true);
      } else {
        router.push('/admin/login');
      }
    } catch (err) {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authenticated && activeTab === 'dashboard') {
      fetchDashboardStats();
    }
  }, [authenticated, activeTab]);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setDashboardStats(data.stats);
      }
    } catch (err: any) {
      // Error handled by UI state
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (err) {
      router.push('/admin/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <Sidebar onLogout={handleLogout} />
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div>
              <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Dashboard</h1>
                <p className="text-gray-600 mt-2 text-lg">Overview of your OpinionHub platform</p>
              </div>

              {statsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600">Loading dashboard stats...</p>
                </div>
              ) : dashboardStats ? (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-l-4 border-indigo-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Total Polls</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardStats.totalPolls}</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-l-4 border-green-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Total Votes</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardStats.totalVotes.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-l-4 border-orange-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Trending Polls</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardStats.trendingPolls}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-l-4 border-purple-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Categories</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardStats.totalCategories}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Polls */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Top Performing Polls</h2>
                      {dashboardStats.topPolls && dashboardStats.topPolls.length > 0 ? (
                        <div className="space-y-4">
                          {dashboardStats.topPolls.map((poll: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </span>
                                  <h3 className="font-semibold text-gray-900">{poll.name}</h3>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>{poll.votes} votes</span>
                                  <span className="text-green-600">{poll.yes}% Yes</span>
                                  <span className="text-red-600">{poll.no}% No</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">No polls yet</p>
                      )}
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                      {dashboardStats.recentActivity && dashboardStats.recentActivity.length > 0 ? (
                        <div className="space-y-3">
                          {dashboardStats.recentActivity.map((activity: any, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                activity.type === 'vote' ? 'bg-green-100' : 'bg-indigo-100'
                              }`}>
                                {activity.type === 'vote' ? (
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {activity.type === 'vote' ? 'New vote on' : 'New poll created:'} {activity.poll}
                                </p>
                                <p className="text-xs text-gray-500">{activity.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">No recent activity</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <p className="text-gray-600">Failed to load dashboard stats</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'polls' && <PollManagement />}
          {activeTab === 'categories' && <CategoryManagement />}
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
