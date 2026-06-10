import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function PlansManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '', price: '', duration_months: 1, features: ''
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plans');
      setPlans(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this plan?')) {
      try {
        await api.delete(`/plans/${id}`);
        fetchPlans();
      } catch (err) {
        alert('Failed to delete');
      }
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/plans', {
        name: formData.name,
        price: parseFloat(formData.price),
        duration_months: parseInt(formData.duration_months),
        features: formData.features
      });
      setIsAddModalOpen(false);
      fetchPlans();
      setFormData({ name: '', price: '', duration_months: 1, features: '' });
    } catch (err) {
      alert('Failed to add plan');
    }
  };

  const getThemeClasses = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('silver')) return 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 text-gray-800 shadow-md';
    if (lowerName.includes('gold')) return 'bg-gradient-to-br from-yellow-50 to-yellow-200 border-yellow-400 text-yellow-900 shadow-md';
    if (lowerName.includes('platinum')) return 'bg-gradient-to-br from-slate-100 to-slate-300 border-slate-400 text-slate-900 shadow-md';
    if (lowerName.includes('diamond')) return 'bg-gradient-to-br from-cyan-50 to-cyan-200 border-cyan-400 text-cyan-900 shadow-md';
    if (lowerName.includes('titanium')) return 'bg-gradient-to-br from-zinc-200 to-zinc-400 border-zinc-500 text-zinc-900 shadow-md';
    if (lowerName.includes('crown')) return 'bg-gradient-to-br from-purple-100 via-fuchsia-100 to-yellow-100 border-purple-400 text-purple-900 shadow-md';
    return 'bg-white border-gray-200 text-gray-800 shadow-md';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Subscription Plans</h2>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
          + Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading plans...</p>
        ) : plans.length === 0 ? (
          <p className="text-gray-500">No plans created yet. Click "+ Add Plan" to create the Silver, Gold, Platinum, Diamond, Titanium, and Crown plans.</p>
        ) : (
          plans.map(p => (
            <div key={p.id} className={`rounded-xl border p-6 flex flex-col ${getThemeClasses(p.name)}`}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{p.name}</h3>
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">Active</span>
              </div>
              <p className="text-3xl font-extrabold mb-2">₹{p.price} <span className="text-sm font-medium opacity-80">/ {p.duration_months} mo</span></p>
              <p className="text-sm mb-6 flex-1 opacity-90">{p.features}</p>
              <button onClick={() => handleDelete(p.id)} className="mt-auto w-full py-2 bg-white/50 border border-red-200 text-red-600 rounded hover:bg-red-50 hover:border-red-300 font-medium transition shadow-sm">
                Delete Plan
              </button>
            </div>
          ))
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-screen">
            <h3 className="text-xl font-bold mb-4">Add New Plan</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (Months)</label>
                <input required type="number" value={formData.duration_months} onChange={e => setFormData({...formData, duration_months: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Features (comma separated)</label>
                <input type="text" value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
