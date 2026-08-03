'use client';

import React, { useState, useEffect } from 'react';
import { Check, Bot, Mail, Lock, Server, Database, Eye, Activity, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../../services/api';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('Gemini 1.5 Pro');
  const [minScore, setMinScore] = useState('70');
  const [showKey, setShowKey] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const configs = await api.getConfigurations();
      
      const keyObj = configs.find(c => c.cle === 'GEMINI_API_KEY');
      if (keyObj) setApiKey(keyObj.valeurParametre);
      
      const modelObj = configs.find(c => c.cle === 'GEMINI_MODEL');
      if (modelObj) setModel(modelObj.valeurParametre);
      
      const scoreObj = configs.find(c => c.cle === 'MIN_MATCH_SCORE');
      if (scoreObj) setMinScore(scoreObj.valeurParametre);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load configurations from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.updateConfiguration('GEMINI_API_KEY', apiKey);
      await api.updateConfiguration('GEMINI_MODEL', model);
      await api.updateConfiguration('MIN_MATCH_SCORE', minScore);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full pb-10">
      <div className="flex justify-between items-center mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure ATS Intelligent platform settings</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-[#1e3a8a] hover:bg-blue-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save All Changes
        </button>
      </div>

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

      <div className="flex flex-col md:flex-row gap-6 mt-2">
        {/* Settings Navigation Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col gap-1">
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1e3a8a] text-white transition-colors text-sm font-medium w-full text-left">
              <Bot className="w-4 h-4" /> Gemini AI
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium w-full text-left">
              <Mail className="w-4 h-4 text-gray-400" /> Email
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium w-full text-left">
              <Lock className="w-4 h-4 text-gray-400" /> Security
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium w-full text-left">
              <Server className="w-4 h-4 text-gray-400" /> System
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium w-full text-left">
              <Database className="w-4 h-4 text-gray-400" /> Backup
            </button>
          </div>
        </div>

        {/* Configuration Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1e3a8a] flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Google Gemini AI Configuration</h2>
              <p className="text-sm font-medium text-gray-500 mt-1">Configure AI analysis settings and API credentials</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm font-medium">Loading configurations...</span>
            </div>
          ) : (
            <div className="space-y-6 max-w-2xl">
              {/* API Key */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Gemini API Key</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input 
                      type={showKey ? "text" : "password"} 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                  <button 
                    onClick={() => setShowKey(!showKey)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> {showKey ? 'Hide' : 'Reveal'}
                  </button>
                </div>
              </div>

              {/* AI Model */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">AI Model</label>
                <select 
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-sm"
                >
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                </select>
                <p className="text-[11px] font-medium text-gray-400 mt-2">Select Gemini model version</p>
              </div>

              {/* Minimum Match Score */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Minimum Match Score (%)</label>
                <input 
                  type="number" 
                  value={minScore}
                  onChange={e => setMinScore(e.target.value)}
                  className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <p className="text-[11px] font-medium text-gray-400 mt-2">Candidates below this threshold are flagged</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
