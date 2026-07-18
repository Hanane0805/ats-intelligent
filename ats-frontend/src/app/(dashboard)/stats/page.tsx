'use client';

import React from 'react';
import { Download, TrendingUp, Target, Clock, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Aug', rate: 18.2 },
  { name: 'Sep', rate: 19.5 },
  { name: 'Oct', rate: 17.3 },
  { name: 'Nov', rate: 20.1 },
  { name: 'Dec', rate: 18.8 },
  { name: 'Jan', rate: 18.0 },
];

export default function StatisticsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full pb-10">
      <div className="flex justify-between items-center mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistics & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Recruitment performance insights and trends</p>
        </div>
        <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Hiring Rate</p>
            <h2 className="text-3xl font-black text-gray-900 mb-1">18.0%</h2>
            <p className="text-sm font-medium text-gray-400">applications to hire</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#00d084] flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Avg Match Score</p>
            <h2 className="text-3xl font-black text-gray-900 mb-1">81.2%</h2>
            <p className="text-sm font-medium text-gray-400">across all candidates</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Target className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Time To Hire</p>
            <h2 className="text-3xl font-black text-gray-900 mb-1">14.2d</h2>
            <p className="text-sm font-medium text-gray-400">average days per hire</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Offer Accept Rate</p>
            <h2 className="text-3xl font-black text-gray-900 mb-1">87.5%</h2>
            <p className="text-sm font-medium text-gray-400">of offers accepted</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-2">
        <h3 className="text-lg font-bold text-gray-900">Hiring Rate Trend</h3>
        <p className="text-sm font-medium text-gray-500 mb-8 mt-1">Monthly applications-to-hire conversion</p>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }} 
                tickFormatter={(value) => `${value}%`}
                domain={[15, 22]}
                ticks={[15, 17, 19, 22]}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#00d084', fontWeight: 'bold' }}
                formatter={(value: number) => [`${value}%`, 'Hiring Rate']}
              />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="#00d084" 
                strokeWidth={3} 
                dot={{ r: 6, fill: '#00d084', stroke: '#fff', strokeWidth: 2 }} 
                activeDot={{ r: 8, strokeWidth: 0 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
