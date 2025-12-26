"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

type ChartData = {
  day: string;
  [key: string]: number | string; // Allows for dynamic hostel keys
}

export default function MessHygieneChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [hostels, setHostels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();

  const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  useEffect(() => {
    if (!db) return;
    const ratingsCol = collection(db, "messFoodRatings");
    const q = query(ratingsCol);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dailyAverages: { [day: string]: { [hostel: string]: { total: number, count: number } } } = {};
      const hostelSet = new Set<string>();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Assuming hostel is part of studentDetails for now, e.g., "Hostel 1"
        const hostel = "Hostel " + (Math.floor(Math.random() * 4) + 1);
        hostelSet.add(hostel);
        if (data.timestamp) {
          const day = format(data.timestamp.toDate(), 'yyyy-MM-dd');
          if (!dailyAverages[day]) {
            dailyAverages[day] = {};
          }
          if (!dailyAverages[day][hostel]) {
            dailyAverages[day][hostel] = { total: 0, count: 0 };
          }
          dailyAverages[day][hostel].total += data.foodQualityRating;
          dailyAverages[day][hostel].count += 1;
        }
      });
      
      const uniqueHostels = Array.from(hostelSet).sort();
      setHostels(uniqueHostels);

      const formattedData = Object.keys(dailyAverages).map(day => {
        const dayEntry: ChartData = { day };
        uniqueHostels.forEach(hostel => {
          if (dailyAverages[day][hostel]) {
            dayEntry[hostel] = parseFloat((dailyAverages[day][hostel].total / dailyAverages[day][hostel].count).toFixed(1));
          }
        });
        return dayEntry;
      }).sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

      setChartData(formattedData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  if (loading) {
    return <Skeleton className="h-[350px] w-full" />
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">
        No mess rating data available.
      </div>
    )
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
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
          {hostels.map((hostel, i) => (
             <Line key={hostel} type="monotone" dataKey={hostel} stroke={colors[i % colors.length]} strokeWidth={2} name={hostel} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
