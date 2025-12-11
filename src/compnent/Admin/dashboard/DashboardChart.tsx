'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList
} from 'recharts';

interface DashboardChartProps {
    data: {
        appointmentsToday: number;
        patientsWaiting: number;
        doctorsActive: number;
    };
}

export default function DashboardChart({ data }: DashboardChartProps) {
    const chartData = [
        {
            name: 'Appointments',
            value: data.appointmentsToday,
            color: 'url(#colorAppointments)',
            stroke: '#0ea5e9',
            label: 'Today',
            icon: '📅'
        },
        {
            name: 'Waiting',
            value: data.patientsWaiting,
            color: 'url(#colorWaiting)',
            stroke: '#eab308',
            label: 'Patients',
            icon: '⏳'
        },
        {
            name: 'Doctors', // Changed from "Active" for better context in horizontal view
            value: data.doctorsActive,
            color: 'url(#colorActive)',
            stroke: '#22c55e',
            label: 'Active',
            icon: '👨‍⚕️'
        }
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-100 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{payload[0].payload.icon}</span>
                        <div>
                            <p className="font-bold text-gray-900 leading-none">{payload[0].payload.name}</p>
                            <p className="text-xs text-gray-500 font-medium">{payload[0].payload.label}</p>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold tracking-tight text-gray-900">
                            {payload[0].value}
                        </span>
                        <span className="text-sm text-gray-400 font-medium">count</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Custom YAxis Tick
    const CustomYAxisTick = (props: any) => {
        const { x, y, payload } = props;
        const icon = chartData.find(d => d.name === payload.value)?.icon;

        return (
            <g transform={`translate(${x},${y})`}>
                <text x={-10} y={0} dy={0} textAnchor="end" fill="#64748b" fontSize={16} fontWeight="bold">
                    {icon}
                </text>
                <text x={-35} y={0} dy={4} textAnchor="end" fill="#334155" fontSize={12} fontWeight={600}>
                    {payload.value}
                </text>
            </g>
        );
    };

    return (
        <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        📊 Clinic Activity
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Overview of today's key metrics
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Legend-ish indicators */}
                    <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-md">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-xs font-medium text-blue-700">Apts</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded-md">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span className="text-xs font-medium text-yellow-700">Wait</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-md">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs font-medium text-green-700">Docs</span>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                            barSize={32}
                        >
                            <defs>
                                <linearGradient id="colorAppointments" x1="0" y1="0" x2="1" y2="0"> {/* Horizontal Gradient */}
                                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                                </linearGradient>
                                <linearGradient id="colorWaiting" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#eab308" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                                </linearGradient>
                                <linearGradient id="colorActive" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal={false} // Vertical grid lines for horizontal bars
                                stroke="#f1f5f9"
                            />

                            <XAxis
                                type="number"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                            />

                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                width={100}
                                tick={<CustomYAxisTick />}
                            />

                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                            />

                            <Bar
                                dataKey="value"
                                radius={[0, 12, 12, 0]} // Round right side only
                                animationDuration={1500}
                                animationEasing="ease-out"
                                background={{ fill: '#f8fafc', radius: [0, 12, 12, 0] } as any} // Subtle background track
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        stroke={entry.stroke}
                                        strokeWidth={0}
                                    />
                                ))}
                                <LabelList
                                    dataKey="value"
                                    position="right"
                                    fill="#475569"
                                    fontSize={12}
                                    fontWeight="bold"
                                    formatter={(val: any) => val > 0 ? val : ''}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
