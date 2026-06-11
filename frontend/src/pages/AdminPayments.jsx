import React, { useState, useEffect } from 'react';
import api from '../services/api';
import * as XLSX from 'xlsx';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [payRes, custRes] = await Promise.all([
        api.get('/payments'),
        api.get('/customers')
      ]);
      
      const custMap = {};
      custRes.data.forEach(c => {
        custMap[c.id] = c;
      });
      
      setCustomers(custMap);
      setPayments(payRes.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load payments data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.put(`/payments/${id}/approve`);
      fetchData();
    } catch (err) {
      alert('Failed to approve payment');
    }
  };

  const handleReject = async (id) => {
    if (window.confirm("Are you sure you want to reject and delete this pending payment?")) {
      try {
        await api.delete(`/payments/${id}`);
        fetchData();
      } catch (err) {
        alert('Failed to reject payment');
      }
    }
  };

  const exportToExcel = () => {
    const formattedData = payments.map(p => {
      const cust = customers[p.customer_id];
      const d = new Date(p.date + (p.date.endsWith('Z') ? '' : 'Z'));
      return {
        "Payment ID": p.id,
        "Customer Name": cust ? cust.full_name : "Unknown",
        "Mobile": cust ? cust.mobile_number : "Unknown",
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
    XLSX.writeFile(workbook, "All_Payments_Export.xlsx");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payment Tracking</h2>
        <button 
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export to Excel
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-sm">
              <th className="p-4">ID</th>
              <th className="p-4">Customer Name</th>
              <th className="p-4">Date</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Method</th>
              <th className="p-4">Date & Time</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="p-4 text-center">Loading payments...</td></tr>
            ) : error ? (
              <tr>
                <td colSpan="7" className="p-4 text-center text-red-600 font-semibold">
                  {error}
                  <button onClick={fetchData} className="ml-3 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs font-bold transition">Retry</button>
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan="7" className="p-4 text-center text-gray-500">No payments found.</td></tr>
            ) : (
              payments.map(p => {
                const cust = customers[p.customer_id];
                return (
                  <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4 text-gray-500 font-mono text-sm">#{p.id}</td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{cust ? cust.full_name : `Customer ID ${p.customer_id}`}</div>
                      {cust && cust.mobile_number && <div className="text-xs text-gray-500">📞 {cust.mobile_number}</div>}
                    </td>
                    <td className="p-4 text-gray-600 font-medium">{p.month}/{p.year}</td>
                  <td className="p-4 text-green-600 font-bold">₹{p.amount}</td>
                  <td className="p-4">
                    {p.status === 'PENDING' ? (
                      <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-100 text-yellow-800">PENDING</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-bold rounded bg-green-100 text-green-800">PAID</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <div>{new Date(p.date + (p.date.endsWith('Z') ? '' : 'Z')).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400">{new Date(p.date + (p.date.endsWith('Z') ? '' : 'Z')).toLocaleTimeString()}</div>
                  </td>
                  <td className="p-4 text-right">
                    {p.status === 'PENDING' ? (
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleApprove(p.id)}
                          className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded transition"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleReject(p.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded transition"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Approved</span>
                    )}
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
