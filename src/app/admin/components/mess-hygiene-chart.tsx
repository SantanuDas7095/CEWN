"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { messHygieneData } from "@/lib/data"

export default function MessHygieneChart() {
  const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={messHygieneData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="day" 
            stroke="hsl(var(--foreground))"
            fontSize={12} 
            tickFormatter={(str) => str.split('-')[2]}
          />
          <YAxis stroke="hsl(var(--foreground))" fontSize={12} domain={[1, 5]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
            }}
            labelFormatter={(label) => `July ${label.split('-')[2]}`}
          />
          <Legend wrapperStyle={{fontSize: "12px"}}/>
          {Object.keys(messHygieneData[0]).filter(key => key !== 'day').map((hostel, i) => (
             <Line key={hostel} type="monotone" dataKey={hostel} stroke={colors[i % colors.length]} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
