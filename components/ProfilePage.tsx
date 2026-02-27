
import React from 'react';
import { useUser } from '../src/contexts/UserContext';
import { Mail, Calendar, CreditCard, LogOut, Shield } from 'lucide-react';

export const ProfilePage: React.FC = () => {
    const { user, logout, loading } = useUser();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-brand-bg/40 backdrop-blur-xl border border-brand-border rounded-3xl text-center">
                <Shield className="mx-auto h-12 w-12 text-brand-primary mb-4" />
                <h2 className="text-2xl font-bold text-brand-text mb-2">Access Denied</h2>
                <p className="text-brand-text-secondary mb-6">Please log in to view your profile and manage your account.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-brand-bg/40 backdrop-blur-xl border border-brand-border rounded-3xl overflow-hidden shadow-2xl">
                <div className="h-32 bg-gradient-to-r from-brand-primary to-brand-secondary"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-8">
                        <img 
                            src={user.picture} 
                            alt={user.name} 
                            className="w-24 h-24 rounded-2xl border-4 border-brand-bg object-cover shadow-lg"
                        />
                        <button 
                            onClick={logout}
                            className="flex items-center px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors text-sm font-semibold"
                        >
                            <LogOut size={16} className="mr-2" />
                            Log Out
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-bold text-brand-text mb-1">{user.name}</h1>
                                <p className="text-brand-text-secondary flex items-center">
                                    <Mail size={14} className="mr-2" />
                                    {user.email}
                                </p>
                            </div>

                            <div className="p-4 bg-brand-bg/60 rounded-2xl border border-brand-border">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-brand-text-secondary uppercase tracking-widest">Current Plan</span>
                                    <span className="px-2 py-1 bg-brand-primary/20 text-brand-primary text-[10px] font-bold rounded uppercase">
                                        {user.plan}
                                    </span>
                                </div>
                                <div className="flex items-center text-brand-text">
                                    <CreditCard size={18} className="mr-3 text-brand-primary" />
                                    <span className="text-xl font-bold">{user.credits} Credits Remaining</span>
                                </div>
                            </div>

                            <div className="flex items-center text-sm text-brand-text-secondary">
                                <Calendar size={14} className="mr-2" />
                                Member since {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-brand-text">Account Security</h3>
                            <div className="space-y-4">
                                <div className="flex items-center p-4 bg-brand-bg/40 rounded-xl border border-brand-border">
                                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg mr-4">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-brand-text">Google Authenticated</p>
                                        <p className="text-xs text-brand-text-secondary">Your account is secured via Google OAuth.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
