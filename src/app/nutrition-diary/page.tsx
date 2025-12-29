
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { Header } from '@/components/common/header';
import { Footer } from '@/components/common/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookCopy, Loader, Salad, ServerCrash, Calendar as CalendarIcon } from 'lucide-react';
import type { DailyNutritionLog } from '@/lib/types';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Image from 'next/image';

interface NutritionTotals {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
}

export default function NutritionDiaryPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [allLogs, setAllLogs] = useState<DailyNutritionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!user || !db) return;

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      
      const logsCollectionRef = collection(db, 'userProfile', user.uid, 'nutritionLogs');
      const q = query(logsCollectionRef, orderBy('timestamp', 'desc'));

      try {
        const querySnapshot = await getDocs(q);
        const userLogs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyNutritionLog));
        setAllLogs(userLogs);
      } catch (error) {
        const permissionError = new FirestorePermissionError({
          path: `userProfile/${user.uid}/nutritionLogs`,
          operation: 'list',
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        setError("Could not fetch your nutrition logs due to a permission error.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user, db]);
  
  if (userLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary/50">
        <div className="container mx-auto max-w-4xl py-12 px-4 md:px-6">
          <div className="space-y-4 text-center mb-8">
            <BookCopy className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold font-headline">Nutrition Diary</h1>
            <p className="text-lg text-muted-foreground">Your daily log of meals and nutritional intake.</p>
          </div>

          {loading ? (
             <div className="flex items-center justify-center p-12">
                <Loader className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : error ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <ServerCrash className="h-16 w-16 text-destructive mb-4"/>
              <h3 className="text-xl font-semibold">Failed to Load Diary</h3>
              <p className="text-muted-foreground max-w-md">{error}</p>
            </Card>
          ) : (
            <>
              {allLogs.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center">
                    <Salad className="h-16 w-16 text-muted-foreground mb-4"/>
                    <h3 className="text-xl font-semibold">No Meals Logged Yet</h3>
                    <p className="text-muted-foreground max-w-md">Use the AI Assistant to analyze a meal and save it to your diary.</p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {allLogs.map(log => (
                    <Card key={log.id}>
                        <CardHeader>
                            <CardTitle>{log.timestamp ? format(log.timestamp.toDate(), 'PPP, p') : 'Just now'}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                            {log.photoUrl && (
                                <div className="md:col-span-2">
                                    <Image src={log.photoUrl} alt="Meal photo" width={300} height={200} className="rounded-md object-cover" />
                                </div>
                            )}
                            <div className={`grid grid-cols-2 gap-4 ${log.photoUrl ? 'md:col-span-3' : 'md:col-span-5'}`}>
                                <div className="bg-muted p-3 rounded-md text-center">
                                    <p className="text-sm text-muted-foreground">Calories</p>
                                    <p className="text-xl font-bold">{log.calories.toFixed(0)}</p>
                                </div>
                                <div className="bg-muted p-3 rounded-md text-center">
                                    <p className="text-sm text-muted-foreground">Protein</p>
                                    <p className="text-xl font-bold">{log.proteinGrams.toFixed(1)}g</p>
                                </div>
                                <div className="bg-muted p-3 rounded-md text-center">
                                    <p className="text-sm text-muted-foreground">Carbs</p>
                                    <p className="text-xl font-bold">{log.carbsGrams.toFixed(1)}g</p>
                                </div>
                                 <div className="bg-muted p-3 rounded-md text-center">
                                    <p className="text-sm text-muted-foreground">Fat</p>
                                    <p className="text-xl font-bold">{log.fatGrams.toFixed(1)}g</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
