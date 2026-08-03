'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Building2, Lock, Save, Loader2, AlertCircle, CheckCircle2, Shield, Activity, Calendar } from 'lucide-react';
import { api, auth } from '../../../services/api';

export default function ProfilPage() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', departement: '', motDePasse: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({ actions: 0, candidaturesManaged: 0 });

  useEffect(() => {
    const currentUser = auth.getUser();
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        nom: currentUser.nom || '',
        prenom: currentUser.prenom || '',
        email: currentUser.email || '',
        departement: (currentUser as any).departement || 'Ressources Humaines',
        motDePasse: '',
      });
      // Fetch personal stats if needed (simulated for UI enrichment based on history)
      api.getHistory().then(history => {
        const userActions = history.length;
        setStats({ actions: userActions, candidaturesManaged: Math.floor(userActions * 0.7) });
      }).catch(() => {});
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const dataToUpdate: any = { nom: formData.nom, prenom: formData.prenom, email: formData.email, departement: formData.departement };
      if (formData.motDePasse) dataToUpdate.motDePasse = formData.motDePasse;
      
      const updated = await api.updateProfile(user.id, dataToUpdate);
      
      const newSession = {
        token: auth.getToken()!,
        userId: updated.id,
        email: updated.email,
        nom: updated.nom,
        prenom: updated.prenom,
        role: updated.role || 'RECRUTEUR_RH'
      };
      await auth.setSession(newSession);
      setUser(auth.getUser());
      
      setSuccess('Profil mis à jour avec succès !');
      setFormData(f => ({ ...f, motDePasse: '' }));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-10">
      <div className="flex justify-between items-center mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez vos informations personnelles et vos paramètres de sécurité</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Profile Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#1e3a8a] to-blue-500 text-white flex items-center justify-center font-black text-3xl mx-auto shadow-lg border-4 border-white mb-4">
              {`${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase()}
            </div>
            <h2 className="text-lg font-bold text-gray-900">{user.prenom} {user.nom}</h2>
            <p className="text-sm font-medium text-blue-600 mb-4">{user.role}</p>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Compte actif
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between px-2 text-left">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Actions</p>
                <p className="text-xl font-black text-gray-900">{stats.actions}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Candidatures</p>
                <p className="text-xl font-black text-gray-900">{stats.candidaturesManaged}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}
              
              {success && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  {success}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Prénom</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input type="text" required value={formData.prenom} onChange={e => setFormData({ ...formData, prenom: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Nom</label>
                  <div className="relative">
                    <input type="text" required value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Adresse Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Département</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-gray-400" />
                  </div>
                  <input type="text" value={formData.departement} onChange={e => setFormData({ ...formData, departement: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] transition-all"
                  />
                </div>
              </div>

              <hr className="border-gray-100" />

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  Nouveau mot de passe <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-bold uppercase">Requis pour sauvegarder</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Shield className="h-4 w-4 text-gray-400" />
                  </div>
                  <input type="password" required placeholder="Entrez le mot de passe pour confirmer" value={formData.motDePasse} onChange={e => setFormData({ ...formData, motDePasse: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] transition-all"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Par mesure de sécurité, vous devez fournir un mot de passe pour modifier votre profil.</p>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={loading || !formData.motDePasse}
                  className="bg-[#1e3a8a] hover:bg-blue-800 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Sauvegarder les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
