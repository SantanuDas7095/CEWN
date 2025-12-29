
"use client";

import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Soup, Star, AlertTriangle, Utensils, Camera, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { addDoc, collection, serverTimestamp, onSnapshot, query, where, QueryConstraint, orderBy, limit } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MessFoodRating } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { uploadPhoto } from "../actions";

const messes = ["Gargi hostel mess", "Southern mess", "Northern mess", "Veg mess", "Rnt mess", "Eastern mess"];
const allMeals = ["Breakfast", "Lunch", "Dinner", "Snacks"];

export default function MessPage() {
  const [rating, setRating] = useState(3);
  const { toast } = useToast();
  const [weeklyScore, setWeeklyScore] = useState(0);
  const [scoreLoading, setScoreLoading] = useState(true);
  const db = useFirestore();
  const { user, loading } = useUser();
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // For the rating form
  const [formMess, setFormMess] = useState<string>("");
  const [formMeal, setFormMeal] = useState<string>("");

  // For filtering scorecard and photos
  const [filterMess, setFilterMess] = useState<string>("all");
  const [filterMeal, setFilterMeal] = useState<string>("all");

  const [recentPhotos, setRecentPhotos] = useState<MessFoodRating[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  useEffect(() => {
    if (!db) return;
    setScoreLoading(true);

    const constraints: QueryConstraint[] = [];
    if (filterMess !== "all") {
        constraints.push(where("messName", "==", filterMess));
    }
    if (filterMeal !== "all") {
        constraints.push(where("mealType", "==", filterMeal));
    }

    const ratingsQuery = query(collection(db, "messFoodRatings"), ...constraints);

    const unsubscribe = onSnapshot(ratingsQuery, (querySnapshot) => {
      if(querySnapshot.empty) {
        setWeeklyScore(0);
        setScoreLoading(false);
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
      setScoreLoading(false);
    }, (error) => {
        const permissionError = new FirestorePermissionError({
            path: 'messFoodRatings',
            operation: 'list',
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        setScoreLoading(false);
        setWeeklyScore(0);
    });

    return () => unsubscribe();
  }, [db, filterMess, filterMeal]);

  useEffect(() => {
    if(!db) return;
    setPhotosLoading(true);

    const constraints: QueryConstraint[] = [orderBy("timestamp", "desc"), limit(20)];
    if(filterMess !== "all") {
        constraints.unshift(where("messName", "==", filterMess));
    }
    if(filterMeal !== "all") {
        constraints.unshift(where("mealType", "==", filterMeal));
    }

    const photosQuery = query(
        collection(db, "messFoodRatings"), 
        ...constraints
    );

    const unsubscribe = onSnapshot(photosQuery, (snapshot) => {
        const photos: MessFoodRating[] = [];
        snapshot.forEach(doc => {
            const data = doc.data() as MessFoodRating;
            if(data.imageUrl) {
                photos.push({ id: doc.id, ...data});
            }
        });
        setRecentPhotos(photos.slice(0, 6)); // Take first 6 with photos
        setPhotosLoading(false);
    }, (error) => {
        const permissionError = new FirestorePermissionError({
            path: 'messFoodRatings',
            operation: 'list',
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        setPhotosLoading(false);
    });

    return () => unsubscribe();

  }, [db, filterMess, filterMeal]);

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
    if (!user || !db || !formMess || !formMeal) {
        toast({ title: "Incomplete Form", description: "Please select a mess and a meal before submitting.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);

    try {
        let imageUrl: string | undefined = undefined;
        if (photo) {
            const formData = new FormData();
            formData.append('photo', photo);
            const result = await uploadPhoto(formData);
            if (result.success && result.url) {
                imageUrl = result.url;
            } else {
                throw new Error(result.error || 'Photo upload failed.');
            }
        }

        const ratingData: Omit<MessFoodRating, 'id'> = {
            studentId: user.uid,
            messName: formMess,
            mealType: formMeal,
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
        setRating(3);
        setFormMess("");
        setFormMeal("");
        setPhoto(null);
        setPhotoPreview(null);
    } catch (error: any) {
        if (error.code && error.code.includes('permission-denied')) {
            const permissionError = new FirestorePermissionError({
                path: 'messFoodRatings',
                operation: 'create',
                requestResourceData: { studentId: user.uid },
            }, error);
            errorEmitter.emit('permission-error', permissionError);
            toast({
                title: "Submission Error",
                description: "Could not save your rating due to a permission issue.",
                variant: "destructive",
            });
        } else {
            console.error("Error submitting rating:", error);
            toast({
                title: "Error",
                description: error.message || "An unexpected error occurred. Could not submit your report.",
                variant: "destructive",
            });
        }
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleFormMessChange = (mess: string) => {
    setFormMess(mess);
    setFormMeal("");
  }
  
  const currentMealOptions = formMess === "Gargi hostel mess" ? [...allMeals.filter(m => m !== "Snacks"), "Snacks"] : allMeals.filter(m => m !== "Snacks");

  const getScorecardTitle = () => {
    if (filterMess !== "all" && filterMeal !== "all") return `${filterMess} - ${filterMeal} Score`;
    if (filterMess !== "all") return `${filterMess} Score`;
    if (filterMeal !== "all") return `${filterMeal} Score`;
    return 'Overall Hygiene Scorecard';
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };
  
  const getScoreDescription = (score: number) => {
    if (score === 0 && !scoreLoading) return "No Data";
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

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
        <div className="container mx-auto max-w-7xl py-12 px-4 md:px-6 md:py-20">
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
                        <Select onValueChange={handleFormMessChange} value={formMess}>
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
                        <Select onValueChange={setFormMeal} value={formMeal} disabled={!formMess}>
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
                <Button onClick={() => handleSubmit('no')} className="w-full" disabled={isSubmitting || !formMess || !formMeal}>
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
                        <Button onClick={() => handleSubmit('yes')} variant="destructive" className="w-full text-lg py-6" disabled={isSubmitting || !formMess || !formMeal}>
                            <AlertTriangle className="mr-2 h-5 w-5" /> 
                            {isSubmitting ? 'Reporting...' : 'Report Sickness'}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">{getScorecardTitle()}</CardTitle>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <Select onValueChange={setFilterMess} defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by Mess"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Messes</SelectItem>
                                    {messes.map(mess => <SelectItem key={mess} value={mess}>{mess}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select onValueChange={setFilterMeal} defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by Meal"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Meals</SelectItem>
                                    {allMeals.map(meal => <SelectItem key={meal} value={meal}>{meal}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center space-y-4">
                        {scoreLoading ? (
                           <Skeleton className="h-48 w-48 rounded-full" />
                        ) : (
                            <div className="relative h-48 w-48">
                                <svg className="h-full w-full" viewBox="0 0 36 36">
                                    <path
                                    className="text-muted/20"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    />
                                    <path
                                    className={cn("transition-all duration-500", getScoreColor(weeklyScore))}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeDasharray={`${weeklyScore}, 100`}
                                    strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={cn("text-4xl font-bold", getScoreColor(weeklyScore))}>
                                        {weeklyScore}%
                                    </span>
                                    <span className="text-sm font-medium text-muted-foreground">{getScoreDescription(weeklyScore)}</span>
                                </div>
                            </div>
                        )}
                         <p className="text-xs text-muted-foreground text-center">This score reflects all available historical data for the selection.</p>
                    </CardContent>
                </Card>
            </div>
          </div>

          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Recent Meal Photos</CardTitle>
                <CardDescription>A visual log of recently rated meals, filtered by your selection above.</CardDescription>
              </CardHeader>
              <CardContent>
                {photosLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                  </div>
                ) : recentPhotos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentPhotos.map((photo) => (
                      <Card key={photo.id} className="overflow-hidden">
                        <div className="relative aspect-video w-full">
                          <Image src={photo.imageUrl!} alt={`Meal from ${photo.messName}`} fill className="object-cover" />
                           <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-bold text-white">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{photo.foodQualityRating}/5</span>
                          </div>
                        </div>
                        <div className="p-4">
                            <div>
                                <Badge variant="secondary">{photo.messName}</Badge>
                                <Badge variant="outline" className="ml-2">{photo.mealType}</Badge>
                            </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {photo.timestamp ? formatDistanceToNow(photo.timestamp.toDate(), { addSuffix: true }) : ''}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No photos have been uploaded for the selected filters.</p>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
