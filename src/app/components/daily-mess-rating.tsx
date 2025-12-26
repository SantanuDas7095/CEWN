
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

export default function DailyMessRating() {
  const [dailyRating, setDailyRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const q = query(
      collection(db, "messFoodRatings"),
      where("timestamp", ">=", startOfDay),
      where("timestamp", "<", endOfDay)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        setDailyRating(0);
        setLoading(false);
        return;
      }

      let totalRating = 0;
      querySnapshot.forEach((doc) => {
        totalRating += doc.data().foodQualityRating;
      });

      const avgRating = totalRating / querySnapshot.size;
      setDailyRating(avgRating);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  if (loading) {
    return (
        <div className="space-y-2">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
        </div>
    )
  }

  if (dailyRating === null || dailyRating === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No ratings submitted for today yet. Be the first!
      </div>
    );
  }

  return (
    <div className="text-center space-y-2">
       <div className="flex items-center justify-center gap-1">
        {[...Array(5)].map((_, i) => (
            <Star
            key={i}
            className={`h-8 w-8 ${
                i < Math.round(dailyRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
            />
        ))}
       </div>
       <p className="text-2xl font-bold">{dailyRating.toFixed(1)}<span className="text-base text-muted-foreground">/5</span></p>
       <p className="text-sm text-muted-foreground">Based on today's student feedback.</p>
    </div>
  );
}
