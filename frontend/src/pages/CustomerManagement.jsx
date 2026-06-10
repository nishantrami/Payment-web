import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', mobile_number: '', address: '', plan_id: ''
  });

  const [editFormData, setEditFormData] = useState({
    full_name: '', mobile_number: '', address: '', plan_id: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [custRes, plansRes] = await Promise.all([
        api.get('/customers'),
        api.get('/plans')
      ]);
      setCustomers(custRes.data);
      setPlans(plansRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await api.delete(`/customers/${id}`);
        fetchData();
      } catch (err) {
        alert('Failed to delete');
      }
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, plan_id: formData.plan_id ? parseInt(formData.plan_id) : null };
      await api.post('/auth/register/customer', payload);
      setIsAddModalOpen(false);
      fetchData();
      setFormData({ full_name: '', email: '', password: '', mobile_number: '', address: '', plan_id: '' });
    } catch (err) {
      alert('Failed to add customer. Email might be in use.');
    }
  };

  const handleEditClick = (c) => {
    setEditingCustomer(c);
    setEditFormData({
      full_name: c.full_name,
      mobile_number: c.mobile_number || '',
      address: c.address || '',
      plan_id: c.plan_id || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editFormData, plan_id: editFormData.plan_id ? parseInt(editFormData.plan_id) : null };
      await api.put(`/customers/${editingCustomer.id}`, payload);
      setEditingCustomer(null);
      fetchData();
    } catch (err) {
      alert('Failed to update customer.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          + Add Customer
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-sm">
              <th className="p-4">Name</th>
              <th className="p-4">Mobile</th>
              <th className="p-4">Address</th>
              <th className="p-4">Plan Status</th>
              <th className="p-4">Plan Change Requests</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan="5" className="p-4 text-center text-gray-500">No customers found.</td></tr>
            ) : (
              customers.map(c => (
                <tr key={c.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-4 font-medium text-gray-800">{c.full_name}</td>
                  <td className="p-4 text-gray-600">{c.mobile_number || 'N/A'}</td>
                  <td className="p-4 text-gray-600">{c.address || 'N/A'}</td>
                  <td className="p-4 text-gray-600">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">{c.plan?.name || 'No Plan'}</span>
                  </td>
                  <td className="p-4">
                    {c.requested_plan_id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-orange-600">Requested: {c.requested_plan?.name}</span>
                        <button onClick={async () => {
                          try { await api.post(`/customers/${c.id}/approve-plan`); fetchData(); } catch(e) { alert("Failed to approve"); }
                        }} className="text-green-600 hover:text-green-700 bg-green-50 p-1 rounded font-bold text-xs">Approve ✅</button>
                        <button onClick={async () => {
                          try { await api.post(`/customers/${c.id}/reject-plan`); fetchData(); } catch(e) { alert("Failed to reject"); }
                        }} className="text-red-600 hover:text-red-700 bg-red-50 p-1 rounded font-bold text-xs">Reject ❌</button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No pending requests</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => handleEditClick(c)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded transition shadow-sm mr-2">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-3 py-1.5 rounded transition shadow-sm">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Add New Customer</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile</label>
                <input type="text" value={formData.mobile_number} onChange={e => setFormData({...formData, mobile_number: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" rows="2"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assign Plan</label>
                <select value={formData.plan_id} onChange={e => setFormData({...formData, plan_id: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">No Plan</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - ₹{p.price}/mo</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Edit Customer</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input required type="text" value={editFormData.full_name} onChange={e => setEditFormData({...editFormData, full_name: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile</label>
                <input type="text" value={editFormData.mobile_number} onChange={e => setEditFormData({...editFormData, mobile_number: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea value={editFormData.address} onChange={e => setEditFormData({...editFormData, address: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" rows="2"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assign Plan</label>
                <select value={editFormData.plan_id} onChange={e => setEditFormData({...editFormData, plan_id: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">No Plan</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - ₹{p.price}/mo</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setEditingCustomer(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Update Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
