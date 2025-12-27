
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

type ChartData = {
  date: string;
  'Response Time': number;
}

export default function ResponseTimeChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;
    const feedbacksCol = collection(db, "hospitalFeedbacks");
    const q = query(feedbacksCol);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dailyAverage: { [key: string]: { total: number, count: number } } = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.timestamp) {
          const date = format(data.timestamp.toDate(), 'MMM d');
          if (!dailyAverage[date]) {
            dailyAverage[date] = { total: 0, count: 0 };
          }
          dailyAverage[date].total += data.waitingTime;
          dailyAverage[date].count += 1;
        }
      });

      const formattedData = Object.keys(dailyAverage).map(date => ({
        date,
        'Response Time': Math.round(dailyAverage[date].total / dailyAverage[date].count),
      })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setChartData(formattedData);
      setLoading(false);
    }, (error) => {
        const permissionError = new FirestorePermissionError({
            path: feedbacksCol.path,
            operation: 'list',
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  if (loading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        No hospital feedback data available.
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
            }}
          />
          <Legend wrapperStyle={{fontSize: "12px"}}/>
          <Bar dataKey="Response Time" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
