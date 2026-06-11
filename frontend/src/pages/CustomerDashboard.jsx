import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function CustomerDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrModalData, setQrModalData] = useState(null);
  const [changePlanModal, setChangePlanModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const months = [
    { num: 1, name: 'January' }, { num: 2, name: 'February' }, { num: 3, name: 'March' },
    { num: 4, name: 'April' }, { num: 5, name: 'May' }, { num: 6, name: 'June' },
    { num: 7, name: 'July' }, { num: 8, name: 'August' }, { num: 9, name: 'September' },
    { num: 10, name: 'October' }, { num: 11, name: 'November' }, { num: 12, name: 'December' }
  ];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await api.get('/customers/profile/me');
      setProfile(profileRes.data);
      
      const paymentsRes = await api.get('/payments'); 
      setPayments(paymentsRes.data);

      const plansRes = await api.get('/plans');
      setPlans(plansRes.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load profile or subscription details.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async () => {
    if (!selectedPlanId) return;
    try {
      await api.put('/customers/profile/me', { plan_id: parseInt(selectedPlanId) });
      setChangePlanModal(false);
      fetchData();
      alert("Plan updated successfully!");
    } catch (err) {
      alert("Failed to update plan");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return;
    try {
      await api.delete('/customers/profile/me');
      alert("Account deleted successfully.");
      logout();
    } catch (err) {
      alert("Failed to delete account");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePayClick = (monthNum, method) => {
    if (method === 'ONLINE') {
      setQrModalData({ monthNum, method });
    } else {
      processPayment(monthNum, method);
    }
  };

  const processPayment = async (monthNum, method) => {
    if (!profile?.plan) {
      alert("You don't have an active plan to pay for.");
      return;
    }
    
    try {
      await api.post('/payments', {
        customer_id: profile.id,
        month: monthNum,
        year: new Date().getFullYear(),
        amount: profile.plan.price,
        payment_method: method,
        status: 'PENDING'
      });
      fetchData(); // Refresh payments
      alert('Payment submitted and is pending Admin approval!');
      setQrModalData(null);
    } catch (err) {
      alert('Payment failed');
    }
  };

  const exportToExcel = () => {
    const formattedData = payments.map(p => {
      const d = new Date(p.date + (p.date.endsWith('Z') ? '' : 'Z'));
      return {
        "Month": p.month,
        "Year": p.year,
        "Amount (₹)": p.amount,
        "Payment Method": p.payment_method,
        "Status": p.status,
        "Date": d.toLocaleDateString(),
        "Time": d.toLocaleTimeString()
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "My_Payments");
    XLSX.writeFile(workbook, "My_Payment_History.xlsx");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="glass p-8 rounded-3xl text-center max-w-md border border-white/20 shadow-xl">
        <p className="text-red-600 font-bold mb-6">{error}</p>
        <div className="flex gap-4 justify-center">
          <button onClick={fetchData} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all border border-blue-500/50">
            Retry
          </button>
          <button onClick={logout} className="bg-white border border-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent pb-12 font-sans text-slate-800">
      <nav className="glass sticky top-0 z-40 p-4 flex justify-between items-center mb-8 border-b border-white/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-white font-bold text-lg leading-none">C</span>
          </div>
          <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">Customer Portal</h1>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={logout} className="text-red-500 hover:text-red-600 font-bold transition flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full">
          Logout
        </motion.button>
      </nav>
      
      <main className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass p-8 rounded-3xl shadow-xl border-white/40">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Welcome back, <span className="text-blue-600">{profile?.full_name}</span>!</h2>
          <p className="text-slate-500 mb-8 font-medium">Email: {user?.email} • Mobile: {profile?.mobile_number}</p>
          
          {profile?.plan ? (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                  Current Plan: {profile.plan.name}
                </h3>
                <p className="text-slate-600 mt-2 font-medium">{profile.plan.features}</p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">₹{profile.plan.price}<span className="text-base font-bold text-slate-500">/mo</span></p>
                <span className="inline-block mt-3 px-4 py-1.5 bg-gradient-to-r from-emerald-100 to-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black tracking-widest uppercase rounded-full shadow-sm">Active</span>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 text-yellow-800 font-medium rounded-2xl shadow-sm">
              You do not have an active subscription plan assigned yet. Please contact support or select a plan below.
            </div>
          )}

          {profile?.requested_plan && (
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 p-5 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 text-orange-800 rounded-2xl flex items-center gap-3 font-medium shadow-sm">
               <svg className="w-6 h-6 animate-spin-slow text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               Plan change requested to <strong className="text-orange-900">{profile.requested_plan.name}</strong>. Waiting for Admin approval.
             </motion.div>
          )}
          
          <div className="mt-8 flex flex-wrap gap-4">
            {!profile?.requested_plan && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setChangePlanModal(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 font-bold transition-all border border-blue-500/50">
                Change Plan
              </motion.button>
            )}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleDeleteAccount} className="bg-white text-red-600 border border-red-200 px-6 py-2.5 rounded-xl shadow-sm hover:bg-red-50 font-bold transition-all">
              Delete Account
            </motion.button>
          </div>
        </motion.div>

        {/* 12-Month Payment Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="glass p-8 rounded-3xl shadow-xl border-white/40">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Your Payments</h3>
              <p className="text-slate-500 font-medium">Tracking for {new Date().getFullYear()}</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={exportToExcel}
              className="bg-white border border-emerald-200 text-emerald-700 px-5 py-2.5 rounded-xl shadow-sm hover:bg-emerald-50 transition-all font-bold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export Excel
            </motion.button>
          </div>
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {months.map(m => {
              const payment = payments.find(p => p.month === m.num && p.year === new Date().getFullYear());
              const isPaid = payment && payment.status === 'PAID';
              const isPending = payment && payment.status === 'PENDING';
              
              return (
                <motion.div variants={itemVariants} key={m.num} className={`p-5 rounded-2xl border ${isPaid ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-200 shadow-emerald-900/5' : isPending ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'bg-white/50 border-white/40 shadow-sm'} flex flex-col h-full hover:shadow-md transition-shadow`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-extrabold text-slate-700 text-lg">{m.name}</span>
                    {isPaid ? (
                      <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-black">PAID</span>
                    ) : isPending ? (
                      <span className="bg-yellow-100 border border-yellow-200 text-yellow-800 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-black">PENDING</span>
                    ) : (
                      <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-black">UNPAID</span>
                    )}
                  </div>
                  
                  {isPaid ? (
                    <div className="mt-auto text-sm text-emerald-800 font-medium space-y-1">
                      <p className="flex justify-between"><span>Amount:</span> <span className="font-bold">₹{payment.amount}</span></p>
                      <p className="flex justify-between"><span>Method:</span> <span className="font-bold">{payment.payment_method}</span></p>
                      <p className="text-xs mt-3 pt-2 border-t border-emerald-200/50 text-emerald-600 font-semibold">Paid on {new Date(payment.date + (payment.date.endsWith('Z') ? '' : 'Z')).toLocaleDateString()}</p>
                    </div>
                  ) : isPending ? (
                    <div className="mt-auto text-sm text-yellow-800 font-medium">
                      <p className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Pending Admin Approval
                      </p>
                    </div>
                  ) : (
                    <div className="mt-auto flex flex-col space-y-2 pt-4">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handlePayClick(m.num, 'ONLINE')} disabled={!profile?.plan} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold py-2.5 rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all">Pay Online</motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handlePayClick(m.num, 'CASH')} disabled={!profile?.plan} className="w-full bg-white border border-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-50 shadow-sm disabled:opacity-50 transition-all">Mark Cash</motion.button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </main>

      <AnimatePresence>
        {qrModalData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="glass rounded-3xl shadow-2xl border-white/20 w-full max-w-sm p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
              <h3 className="text-2xl font-black mb-6 text-slate-800">Scan to Pay</h3>
              <div className="bg-white p-4 rounded-2xl inline-block shadow-sm mb-6 border border-slate-100">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=saas@upi&pn=SaaS&am=${profile?.plan?.price}`} alt="QR" className="w-48 h-48 mx-auto" />
              </div>
              <p className="text-slate-600 font-medium mb-8">Scan with any UPI app for <span className="font-black text-slate-800">₹{profile?.plan?.price}</span></p>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => processPayment(qrModalData.monthNum, 'ONLINE')} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/30">Paid Successfully</motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setQrModalData(null)} className="flex-1 bg-white text-slate-700 border border-slate-200 font-bold py-3 rounded-xl shadow-sm hover:bg-slate-50">Cancel</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {changePlanModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="glass rounded-3xl shadow-2xl border-white/20 w-full max-w-sm p-8 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <h3 className="text-2xl font-black mb-6 text-center text-slate-800">Change Plan</h3>
              <div className="relative mb-8">
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-semibold text-slate-700 appearance-none shadow-sm cursor-pointer"
                >
                  <option value="">Select a new plan</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name} - ₹{plan.price}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handlePlanChange} disabled={!selectedPlanId} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 shadow-lg shadow-blue-500/30">Confirm</motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setChangePlanModal(false)} className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 shadow-sm">Cancel</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
