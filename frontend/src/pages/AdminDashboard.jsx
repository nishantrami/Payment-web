import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        setMetrics(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetrics();
  }, []);

  if (!metrics) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div>
      <h2 className="text-3xl font-extrabold mb-8 text-slate-800 tracking-tight">Dashboard Overview</h2>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <MetricCard title="Total Customers" value={metrics.totalCustomers} icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" color="blue" />
        <MetricCard title="Active Customers" value={metrics.activeCustomers} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="emerald" />
        <MetricCard title="Total Revenue" value={`₹${metrics.totalRevenue}`} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="indigo" />
        <MetricCard title="Monthly Revenue" value={`₹${metrics.monthlyRevenue}`} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" color="purple" />
        <MetricCard title="Cash Payments" value={`₹${metrics.cashPayments}`} icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" color="orange" />
        <MetricCard title="Online Payments" value={`₹${metrics.onlinePayments}`} icon="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" color="cyan" />
      </motion.div>
    </div>
  );
}

function MetricCard({ title, value, icon, color }) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-100',
    emerald: 'text-emerald-600 bg-emerald-100',
    indigo: 'text-indigo-600 bg-indigo-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100',
    cyan: 'text-cyan-600 bg-cyan-100'
  };

  return (
    <motion.div variants={itemVariants} className="glass p-6 rounded-2xl flex items-center justify-between hover:scale-[1.02] transition-transform duration-300">
      <div>
        <h3 className="text-slate-500 text-sm font-bold mb-2 uppercase tracking-wider">{title}</h3>
        <p className="text-3xl font-extrabold text-slate-800">{value}</p>
      </div>
      <div className={`p-4 rounded-2xl ${colorMap[color]} shadow-inner`}>
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
    </motion.div>
  );
}
