'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Loader2, UserX, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { api, auth } from '../../../services/api';

const avatarColors = [
  'bg-emerald-500', 'bg-rose-500', 'bg-cyan-500', 'bg-amber-500', 'bg-purple-500'
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', departement: '', motDePasse: '' });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const currentUser = auth.getUser();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    api.getUsers()
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      setActionSuccess('User deleted successfully.');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Error deleting user');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    try {
      await api.createUser(formData);
      setShowModal(false);
      setFormData({ nom: '', prenom: '', email: '', departement: '', motDePasse: '' });
      setActionSuccess('User created successfully.');
      setTimeout(() => setActionSuccess(''), 3000);
      fetchUsers();
    } catch (err: any) {
      setModalError(err.message || 'Error creating user');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = users.filter(u => {
    const term = search.toLowerCase();
    return (u.nom?.toLowerCase().includes(term) || u.prenom?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term));
  });

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full p-4 sm:p-6 lg:p-8 relative">
      {actionSuccess && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium shadow-lg animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {actionSuccess}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage system users and permissions</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#1e3a8a] hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-2">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Chargement des utilisateurs...</span>
          </div>
        )}

        {!loading && error && (
          <div className="p-6 text-center text-rose-600 text-sm font-medium bg-rose-50 border-b border-rose-100">
            Erreur : {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-20 text-center">
            <UserX className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun utilisateur trouvé.</p>
          </div>
        )}

        {/* Users Table */}
        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user, idx) => {
                  const initials = `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase();
                  const color = avatarColors[idx % avatarColors.length];
                  const isMe = currentUser?.id === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group bg-white">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${color}`}>
                            {initials || '??'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-[#1e3a8a] transition-colors flex items-center gap-2">
                              {user.prenom} {user.nom}
                              {isMe && <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold">YOU</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {user.role || 'Recruteur RH'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                        {user.departement || 'HR'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(user.id)}
                          disabled={isMe}
                          title={isMe ? "You cannot delete yourself" : "Delete user"}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Create New User</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-4">
              {modalError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">First Name</label>
                  <input
                    type="text" required
                    value={formData.prenom}
                    onChange={e => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">Last Name</label>
                  <input
                    type="text" required
                    value={formData.nom}
                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Email</label>
                <input
                  type="email" required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Department</label>
                <input
                  type="text"
                  value={formData.departement}
                  onChange={e => setFormData({ ...formData, departement: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Password</label>
                <input
                  type="password" required
                  value={formData.motDePasse}
                  onChange={e => setFormData({ ...formData, motDePasse: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a]"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#1e3a8a] hover:bg-blue-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
