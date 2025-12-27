'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/header';
import { Footer } from '@/components/common/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookCopy, Loader, Salad, ServerCrash } from 'lucide-react';
import type { DailyNutritionLog } from '@/lib/types';
import { format } from 'date-fns';

export default function NutritionDiaryPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

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
            <p className="text-lg text-muted-foreground">Your daily log of meals and nutritional intake for {format(new Date(), 'PPP')}.</p>
          </div>

            <Card className="flex flex-col items-center justify-center p-12 text-center">
                <ServerCrash className="h-16 w-16 text-destructive mb-4"/>
                <h3 className="text-xl font-semibold">Feature Currently Unavailable</h3>
                <p className="text-muted-foreground max-w-md">
                    We are sorry, but the nutrition diary is temporarily unavailable due to a persistent technical issue. Our team has been notified. Please try again later.
                </p>
            </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
