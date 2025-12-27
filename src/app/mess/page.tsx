"use client";

import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Soup, Star, AlertTriangle, Utensils, Camera, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { addDoc, collection, serverTimestamp, onSnapshot, query } from "firebase/firestore";
import { useFirestore, useUser, useStorage } from "@/firebase";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { MessFoodRating } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const messes = ["Gargi hostel mess", "Southern mess", "Northern mess", "Veg mess", "Rnt mess", "Eastern mess"];
const meals = ["Breakfast", "Lunch", "Dinner"];

export default function MessPage() {
  const [rating, setRating] = useState(3);
  const { toast } = useToast();
  const [weeklyScore, setWeeklyScore] = useState(0);
  const db = useFirestore();
  const storage = useStorage();
  const { user, loading } = useUser();
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMess, setSelectedMess] = useState<string>("");
  const [selectedMeal, setSelectedMeal] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  useEffect(() => {
    if (!db) return;
    const ratingsCol = collection(db, "messFoodRatings");
    const q = query(ratingsCol);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if(querySnapshot.empty) {
        setWeeklyScore(0);
        return;
      }
      let totalRating = 0;
      let ratingCount = 0;
      querySnapshot.forEach((doc) => {
        totalRating += doc.data().foodQualityRating;
        ratingCount++;
      });
      const avgRating = totalRating / ratingCount;
      setWeeklyScore(Math.round((avgRating / 5) * 100));
    });

    return () => unsubscribe();
  }, [db])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (isSick: 'yes' | 'no') => {
    if (!user || !db || !storage || !selectedMess || !selectedMeal) {
        toast({ title: "Incomplete Form", description: "Please select a mess and a meal before submitting.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);

    let imageUrl: string | undefined = undefined;

    try {
        if (photo) {
            const photoRef = ref(storage, `mess-photos/${user.uid}/${Date.now()}_${photo.name}`);
            const snapshot = await uploadBytes(photoRef, photo);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        const ratingData: Omit<MessFoodRating, 'id'> = {
            studentId: user.uid,
            messName: selectedMess,
            mealType: selectedMeal,
            foodQualityRating: rating,
            sickAfterMealReport: isSick,
            timestamp: serverTimestamp(),
            ...(imageUrl && { imageUrl }),
        };

        await addDoc(collection(db, "messFoodRatings"), ratingData);

        if (isSick === 'yes') {
            toast({
                title: "Sickness Reported",
                description: "Your report has been sent. Please visit the hospital if you feel unwell.",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Rating Submitted",
                description: `You rated today's food ${rating} out of 5. Thank you!`,
            });
        }
        // Reset form state
        setRating(3);
        setSelectedMess("");
        setSelectedMeal("");
        setPhoto(null);
        setPhotoPreview(null);

    } catch (error) {
        console.error("Error submitting rating:", error);
        const permissionError = new FirestorePermissionError({
            path: 'messFoodRatings',
            operation: 'create',
            requestResourceData: { foodQualityRating: rating, sickAfterMealReport: isSick, hasPhoto: !!photo, messName: selectedMess, mealType: selectedMeal },
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        toast({
            title: "Error",
            description: "Could not submit your report. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const currentMealOptions = selectedMess === "Gargi hostel mess" ? [...meals, "Snacks"] : meals;

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl py-12 px-4 md:px-6 md:py-20">
          <div className="text-center space-y-4">
            <Utensils className="mx-auto h-16 w-16 text-primary" />
            <h1 className="text-4xl font-bold font-headline">Mess Food Safety & Health Monitor</h1>
            <p className="text-muted-foreground text-lg">
              Your daily feedback makes our campus food better and safer.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <Star className="text-yellow-500" />
                  Daily Food Quality Rating
                </CardTitle>
                <CardDescription>Rate the overall quality of today's meals.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center items-center space-y-6">
                
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Select Mess</Label>
                        <Select onValueChange={setSelectedMess} value={selectedMess}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a mess" />
                            </SelectTrigger>
                            <SelectContent>
                                {messes.map(mess => (
                                    <SelectItem key={mess} value={mess}>{mess}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Select Meal</Label>
                        <Select onValueChange={setSelectedMeal} value={selectedMeal} disabled={!selectedMess}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a meal" />
                            </SelectTrigger>
                            <SelectContent>
                                {currentMealOptions.map(meal => (
                                    <SelectItem key={meal} value={meal}>{meal}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="w-full space-y-2 pt-4">
                    <Label className="text-center block">Your Rating: <span className="text-2xl font-bold">{rating}/5</span></Label>
                    <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                        key={star}
                        className={`h-10 w-10 mx-auto cursor-pointer transition-colors ${
                            star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                        }`}
                        onClick={() => setRating(star)}
                        />
                    ))}
                    </div>
                    <Slider
                    defaultValue={[3]}
                    value={[rating]}
                    max={5}
                    min={1}
                    step={1}
                    onValueChange={(value) => setRating(value[0])}
                    className="w-full"
                    />
                </div>
                

                <div className="w-full space-y-2">
                    <Label htmlFor="photo-upload" className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                        <Camera className="h-4 w-4" />
                        <span>Upload a photo (optional)</span>
                    </Label>
                    <Input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="text-sm"/>
                    {photoPreview && (
                        <div className="relative mt-2">
                            <Image src={photoPreview} alt="Meal preview" width={100} height={100} className="rounded-md object-cover w-full h-auto max-h-48" />
                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/75 text-white rounded-full" onClick={() => { setPhoto(null); setPhotoPreview(null); }}>
                                <X className="h-4 w-4"/>
                            </Button>
                        </div>
                    )}
                </div>

              </CardContent>
              <div className="p-6 pt-0">
                <Button onClick={() => handleSubmit('no')} className="w-full" disabled={isSubmitting || !selectedMess || !selectedMeal}>
                    {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </div>
            </Card>

            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline">
                        <AlertTriangle className="text-accent" />
                        Feeling Unwell?
                        </CardTitle>
                        <CardDescription>If you feel sick after a meal, report it immediately. Select mess and meal first.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => handleSubmit('yes')} variant="destructive" className="w-full text-lg py-6" disabled={isSubmitting || !selectedMess || !selectedMeal}>
                            <AlertTriangle className="mr-2 h-5 w-5" /> 
                            {isSubmitting ? 'Reporting...' : 'Report Sickness'}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Weekly Hygiene Scorecard</CardTitle>
                        <CardDescription>An aggregated score based on student ratings and reports.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-baseline">
                           <span className="font-medium">Overall Score</span>
                           <span className="text-3xl font-bold text-primary">{weeklyScore}%</span>
                        </div>
                        <Progress value={weeklyScore} className="h-4" />
                        <p className="text-xs text-muted-foreground">This score reflects data from the last 7 days.</p>
                    </CardContent>
                </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
