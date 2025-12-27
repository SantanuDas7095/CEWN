
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/header';
import { Footer } from '@/components/common/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookCopy, Loader, Salad } from 'lucide-react';
import type { DailyNutritionLog } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfDay, endOfDay, format } from 'date-fns';
import Image from 'next/image';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function NutritionDiaryPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [logs, setLogs] = useState<DailyNutritionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!user || !db) return;

    setLoading(true);
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const logsCollection = collection(db, `userProfile/${user.uid}/nutritionLogs`);
    const q = query(
      logsCollection,
      where('timestamp', '>=', todayStart),
      where('timestamp', '<=', todayEnd),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyNutritionLog));
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      const permissionError = new FirestorePermissionError({
        path: logsCollection.path,
        operation: 'list',
      }, error);
      errorEmitter.emit('permission-error', permissionError);
      console.error("Error fetching nutrition logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, db]);

  const totals = logs.reduce((acc, log) => {
    acc.calories += log.calories;
    acc.proteinGrams += log.proteinGrams;
    acc.carbsGrams += log.carbsGrams;
    acc.fatGrams += log.fatGrams;
    return acc;
  }, { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 });

  if (userLoading) {
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
            <p className="text-lg text-muted-foreground">Your daily log of meals and nutritional intake for {format(new Date(), 'PPP')}.</p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Today's Totals</CardTitle>
              <CardDescription>A summary of your nutritional intake for today.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <CardTitle className="text-sm text-muted-foreground">Calories</CardTitle>
                  <p className="text-2xl font-bold">{totals.calories.toFixed(0)}</p>
                </Card>
                <Card className="p-4 text-center">
                  <CardTitle className="text-sm text-muted-foreground">Protein</CardTitle>
                  <p className="text-2xl font-bold">{totals.proteinGrams.toFixed(1)}g</p>
                </Card>
                <Card className="p-4 text-center">
                  <CardTitle className="text-sm text-muted-foreground">Carbs</CardTitle>
                  <p className="text-2xl font-bold">{totals.carbsGrams.toFixed(1)}g</p>
                </Card>
                <Card className="p-4 text-center">
                  <CardTitle className="text-sm text-muted-foreground">Fat</CardTitle>
                  <p className="text-2xl font-bold">{totals.fatGrams.toFixed(1)}g</p>
                </Card>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
             <h2 className="text-2xl font-bold font-headline">Today's Meals</h2>
             {loading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
                </div>
             ) : logs.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center">
                    <Salad className="h-16 w-16 text-muted-foreground mb-4"/>
                    <h3 className="text-xl font-semibold">No meals logged today.</h3>
                    <p className="text-muted-foreground">Go to the AI Assistant to track a new meal.</p>
                </Card>
             ) : (
                logs.map(log => (
                    <Card key={log.id} className="flex flex-col md:flex-row items-start gap-4 p-4">
                        {log.photoUrl && (
                            <Image src={log.photoUrl} alt="Meal photo" width={150} height={150} className="rounded-md object-cover aspect-square" />
                        )}
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground font-semibold mb-2">Logged at {format(log.timestamp.toDate(), 'p')}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                <div><strong>Calories:</strong> {log.calories.toFixed(0)}</div>
                                <div><strong>Protein:</strong> {log.proteinGrams.toFixed(1)}g</div>
                                <div><strong>Carbs:</strong> {log.carbsGrams.toFixed(1)}g</div>
                                <div><strong>Fat:</strong> {log.fatGrams.toFixed(1)}g</div>
                            </div>
                        </div>
                    </Card>
                ))
             )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
