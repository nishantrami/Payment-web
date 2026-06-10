import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', mobile_number: '', address: '', plan_id: ''
  });
  const [plans, setPlans] = useState([]);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/plans');
        setPlans(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({...prev, plan_id: res.data[0].id}));
        }
      } catch (err) {
        console.error("Failed to fetch plans", err);
      }
    };
    fetchPlans();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register/customer', formData);
      await login(formData.email, formData.password);
      navigate('/customer/dashboard');
    } catch (err) {
      alert(err.response?.data?.detail || 'Registration failed. Email might already be in use.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 py-12">
      <div className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-xl border">
        
        <div className="mb-8 border-b pb-6">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Create an Account</h2>
          <p className="text-gray-500">Sign up and choose your subscription plan to get started.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
              <input 
                type="text" 
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" 
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" 
                placeholder="john@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Mobile Number</label>
              <input 
                type="text" 
                value={formData.mobile_number}
                onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" 
                placeholder="+91 9876543210"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                placeholder="••••••••"
                required
              />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">Full Address</label>
              <textarea 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 h-24 resize-none"
                placeholder="123 Main Street, City, State, ZIP"
                required
              ></textarea>
            </div>
          </div>

          <div className="pt-4 border-t mt-8">
            <label className="block text-gray-900 text-lg font-bold mb-4">Select Your Plan</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(plan => (
                <div 
                  key={plan.id}
                  onClick={() => setFormData({...formData, plan_id: plan.id})}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all duration-200 flex flex-col items-center text-center 
                    ${formData.plan_id === plan.id 
                      ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-200 transform scale-[1.02]' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                >
                  <h3 className={`font-bold text-lg mb-1 ${formData.plan_id === plan.id ? 'text-blue-800' : 'text-gray-700'}`}>{plan.name}</h3>
                  <p className="text-3xl font-extrabold mt-1 text-gray-900">₹{plan.price}<span className="text-sm text-gray-500 font-medium">/mo</span></p>
                  {plan.features && <p className="text-xs text-gray-600 mt-3 border-t border-gray-200 pt-3 w-full">{plan.features}</p>}
                  {formData.plan_id === plan.id && (
                    <div className="mt-4 bg-blue-600 text-white text-xs px-4 py-1.5 rounded-full font-bold w-full">
                      Selected
                    </div>
                  )}
                </div>
              ))}
              {plans.length === 0 && (
                <div className="col-span-full text-center text-sm text-gray-500 py-8 border-2 border-dashed rounded-xl bg-gray-50">
                  No plans available at the moment.
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="w-full bg-gray-900 text-white font-bold py-4 px-4 rounded-xl hover:bg-gray-800 transition shadow-xl mt-8 text-lg flex justify-center items-center gap-2">
            Complete Registration
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-600 font-medium">
          Already have an account? <Link to="/login" className="text-blue-600 hover:text-blue-800 hover:underline">Login here</Link>
        </div>
      </div>
    </div>
  );
}
