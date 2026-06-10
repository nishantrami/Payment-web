import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockingUserId, setBlockingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to delete user');
    }
  };

  const handleBlockUser = async (id, duration) => {
    try {
      await api.post(`/users/${id}/block`, { duration });
      setBlockingUserId(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to update block status');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="text-slate-800">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">User Management</h2>
      </div>
      
      {/* Users Table */}
      <motion.div variants={itemVariants} className="glass rounded-3xl shadow-xl border-white/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/60">
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">ID</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Email</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              <AnimatePresence>
                {users.map(u => {
                  const isBlocked = u.blocked_until && new Date(u.blocked_until) > new Date();
                  const blockDate = isBlocked ? new Date(u.blocked_until) : null;
                  
                  return (
                    <motion.tr 
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-white/40 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-slate-600">#{u.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-md ${u.role === 'ADMIN' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-blue-400 to-cyan-500'}`}>
                            {u.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-700">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${u.role === 'ADMIN' ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1.5 bg-red-100 border border-red-200 text-red-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            {blockDate.getFullYear() > 2100 ? 'Permanently Blocked' : `Blocked to ${blockDate.toLocaleDateString()}`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <div className="flex items-center justify-end gap-3">
                          {u.role !== 'ADMIN' && (
                            <>
                              <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setBlockingUserId(u.id)} 
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm ${isBlocked ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                              >
                                {isBlocked ? 'Manage Block' : 'Block User'}
                              </motion.button>
                              
                              <motion.button 
                                whileHover={{ scale: 1.1, color: '#ef4444' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDelete(u.id)} 
                                className="text-slate-400 transition-colors p-1"
                                title="Delete User"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </motion.button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Blocking Management Modal */}
      <AnimatePresence>
        {blockingUserId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100/80 text-left"
            >
              <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Manage Block Status
              </h3>
              
              {(() => {
                const u = users.find(user => user.id === blockingUserId);
                if (!u) return null;
                const isBlocked = u.blocked_until && new Date(u.blocked_until) > new Date();
                
                return (
                  <>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                      Select block duration for <span className="font-extrabold text-slate-700">{u.email}</span>.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => handleBlockUser(u.id, '1_month')} 
                        className="w-full py-3 px-4 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-200/50 hover:border-slate-300"
                      >
                        Block 1 Month
                      </button>
                      <button 
                        onClick={() => handleBlockUser(u.id, '3_months')} 
                        className="w-full py-3 px-4 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-200/50 hover:border-slate-300"
                      >
                        Block 3 Months
                      </button>
                      <button 
                        onClick={() => handleBlockUser(u.id, 'lifetime')} 
                        className="w-full py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 rounded-xl transition-all shadow-md shadow-red-500/20"
                      >
                        Permanent Block
                      </button>
                      
                      {isBlocked && (
                        <button 
                          onClick={() => handleBlockUser(u.id, 'unblock')} 
                          className="w-full py-3 px-4 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-200"
                        >
                          Unblock User
                        </button>
                      )}
                      
                      <button 
                        onClick={() => setBlockingUserId(null)} 
                        className="w-full py-3 px-4 text-sm font-bold text-slate-400 hover:text-slate-600 bg-transparent rounded-xl transition-all mt-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
