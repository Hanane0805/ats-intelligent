'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, MapPin, DollarSign, Bot, Target, FileText 
} from 'lucide-react';

export default function CreateJobPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    experience: 'Entry (0-2 years)',
    location: '',
    salaryMin: '',
    salaryMax: '',
    description: '',
    minScore: 70,
    autoReject: 40
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Replace this with your API call logic later
    console.log("Saving job:", formData);
    
    // Redirect to the jobs list after saving
    router.push('/jobs');
  };

  const handleCancel = () => {
    // Go back to the previous page
    router.back();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Job Position</h1>
          <p className="text-slate-500 text-sm">Define a new position and required qualifications</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleCancel}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="bg-[#1e3a8a] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#1e3a8a]/90 flex items-center gap-2"
          >
            Save Position
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Position Title</label>
                <input name="title" onChange={handleChange} placeholder="e.g. Senior Frontend Developer" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select name="department" onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white">
                    <option>Engineering</option>
                    <option>Product</option>
                    <option>Design</option>
                    <option>Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Experience Level</label>
                  <select name="experience" onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white">
                    <option>Entry (0-2 years)</option>
                    <option>Mid (2-5 years)</option>
                    <option>Senior (5+ years)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input name="location" onChange={handleChange} placeholder="e.g. New York / Remote" className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Salary Range (optional)</label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input name="salaryMin" onChange={handleChange} placeholder="$80,000" className="w-full p-2.5 border border-slate-300 rounded-lg" />
                  <input name="salaryMax" onChange={handleChange} placeholder="$120,000" className="w-full p-2.5 border border-slate-300 rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Description & Requirements</h3>
            <textarea 
              name="description" 
              onChange={handleChange}
              rows={6} 
              placeholder="Describe the role, responsibilities, and company culture..." 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Right Column: AI Config & Preview */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">AI Configuration</h3>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 mb-4">
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <Bot className="w-5 h-5" /> Gemini AI Enabled
              </div>
              <p className="text-xs text-emerald-600 mt-1">CVs will be auto-analyzed on upload</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}