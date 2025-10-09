import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface WaitTimeData {
  hour: string;
  avgWait: number;
}

export interface WaitTimeChartProps {
  data: WaitTimeData[];
}

const WaitTimeChart: React.FC<WaitTimeChartProps> = ({ data }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Average Wait Time by Hour</h2>
      <p className="text-sm text-gray-600 mb-6">Patient waiting time throughout the day</p>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis 
            dataKey="hour" 
            tick={{ fill: '#6b7280', fontSize: 14 }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 14 }}
            axisLine={{ stroke: '#e5e7eb' }}
            domain={[0, 30]}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number) => [`${value} min`, 'Avg Wait']}
          />
          <Line 
            type="monotone" 
            dataKey="avgWait" 
            stroke="#14b8a6" 
            strokeWidth={2}
            dot={{ fill: '#14b8a6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Avg Wait (min)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WaitTimeChart;