'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, Plus, Filter, Eye, Pencil, Trash2, X, MapPin 
} from 'lucide-react';

const positions = [
  { id: 1, title: 'Senior Frontend Developer', dept: 'Engineering', exp: '5+ years', loc: 'New York / Remote', apps: '24 applicants', status: 'Active', posted: 'Jan 10, 2025' },
  { id: 2, title: 'Backend Engineer (Java/Spring)', dept: 'Engineering', exp: '4+ years', loc: 'San Francisco', apps: '18 applicants', status: 'Active', posted: 'Jan 8, 2025' },
  { id: 3, title: 'Product Manager', dept: 'Product', exp: '5+ years', loc: 'Chicago / Remote', apps: '31 applicants', status: 'Active', posted: 'Jan 5, 2025' },
  { id: 4, title: 'DevOps Engineer', dept: 'Infrastructure', exp: '3+ years', loc: 'Austin, TX', apps: '12 applicants', status: 'Active', posted: 'Dec 28, 2024' },
  { id: 5, title: 'Data Scientist', dept: 'Analytics', exp: '4+ years', loc: 'Seattle / Remote', apps: '27 applicants', status: 'Active', posted: 'Dec 20, 2024' },
  { id: 6, title: 'UX/UI Designer', dept: 'Design', exp: '3+ years', loc: 'Remote', apps: '19 applicants', status: 'Closed', posted: 'Dec 15, 2024' },
  { id: 7, title: 'Mobile Developer (React Native)', dept: 'Engineering', exp: '3+ years', loc: 'Remote', apps: '15 applicants', status: 'Active', posted: 'Dec 10, 2024' },
];

function JobsPage() {
  const [filter, setFilter] = useState('All');

  // Logic to filter the positions based on status
  const filteredPositions = positions.filter((job) => {
    if (filter === 'All') return true;
    return job.status === filter;
  });

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Positions</h1>
          <p className="text-slate-500 text-sm">Manage and track all open positions</p>
        </div>
        
        {/* Navigation Link for Create Position */}
        <Link 
          href="/jobs/create" 
          className="bg-[#1e3a8a] text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-[#1e3a8a]/90 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Position
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search positions..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
          />
        </div>
        <div className="flex items-center gap-2">
          {['All', 'Active', 'Closed', 'Draft'].map((f) => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === f ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f}
            </button>
          ))}
          <button className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs uppercase text-slate-500 border-b border-slate-100">
              <th className="px-6 py-4 font-medium">Position Title</th>
              <th className="px-6 py-4 font-medium">Department</th>
              <th className="px-6 py-4 font-medium">Experience</th>
              <th className="px-6 py-4 font-medium">Location</th>
              <th className="px-6 py-4 font-medium">Candidates</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Posted</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPositions.length > 0 ? (
              filteredPositions.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/50 text-sm">
                  <td className="px-6 py-4 font-medium text-slate-900">{job.title}</td>
                  <td className="px-6 py-4 text-slate-600">{job.dept}</td>
                  <td className="px-6 py-4 text-slate-600">{job.exp}</td>
                  <td className="px-6 py-4 text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> {job.loc}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{job.apps}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${job.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      ● {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{job.posted}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <button className="hover:text-slate-600"><Eye className="w-4 h-4" /></button>
                      <button className="hover:text-slate-600"><Pencil className="w-4 h-4" /></button>
                      <button className="hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      <button className="hover:text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                  No positions found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default JobsPage;