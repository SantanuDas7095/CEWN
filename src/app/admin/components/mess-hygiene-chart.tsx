
"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

type ChartData = {
  day: string;
  [key: string]: number | string; // Allows for dynamic mess names
}

export default function MessHygieneChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [messes, setMesses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();

  const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))"];

  useEffect(() => {
    if (!db) return;
    const ratingsCol = collection(db, "messFoodRatings");
    const q = query(ratingsCol);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dailyAverages: { [day: string]: { [mess: string]: { total: number, count: number } } } = {};
      const messSet = new Set<string>();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.messName && data.timestamp) {
          const messName = data.messName;
          messSet.add(messName);
          const day = format(data.timestamp.toDate(), 'yyyy-MM-dd');

          if (!dailyAverages[day]) {
            dailyAverages[day] = {};
          }
          if (!dailyAverages[day][messName]) {
            dailyAverages[day][messName] = { total: 0, count: 0 };
          }
          dailyAverages[day][messName].total += data.foodQualityRating;
          dailyAverages[day][messName].count += 1;
        }
      });
      
      const uniqueMesses = Array.from(messSet).sort();
      setMesses(uniqueMesses);

      const formattedData = Object.keys(dailyAverages).map(day => {
        const dayEntry: ChartData = { day };
        uniqueMesses.forEach(mess => {
          if (dailyAverages[day][mess]) {
            dayEntry[mess] = parseFloat((dailyAverages[day][mess].total / dailyAverages[day][mess].count).toFixed(1));
          }
        });
        return dayEntry;
      }).sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

      setChartData(formattedData);
      setLoading(false);
    }, (error) => {
        const permissionError = new FirestorePermissionError({
            path: ratingsCol.path,
            operation: 'list',
        }, error);
        errorEmitter.emit('permission-error', permissionError);
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
            tickFormatter={(str) => format(new Date(str), 'MMM d')}
          />
          <YAxis stroke="hsl(var(--foreground))" fontSize={12} domain={[1, 5]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
            }}
            labelFormatter={(label) => format(new Date(label), 'PPP')}
          />
          <Legend wrapperStyle={{fontSize: "12px"}}/>
          {messes.map((mess, i) => (
             <Line key={mess} type="monotone" dataKey={mess} stroke={colors[i % colors.length]} strokeWidth={2} name={mess} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
