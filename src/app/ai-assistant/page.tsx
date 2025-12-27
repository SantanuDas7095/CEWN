
'use client';

import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/common/header';
import { Footer } from '@/components/common/footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, HeartPulse, Loader, Send, Sparkles, User, X, Salad, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { firstAidChat, type FirstAidChatInput, type FirstAidMessage } from '@/ai/flows/first-aid-flow';
import { nutritionTracker, type NutritionTrackerInput, type NutritionTrackerOutput } from '@/ai/flows/nutrition-tracker-flow';
import { Skeleton } from '@/components/ui/skeleton';

export default function AiAssistantPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  // State for First-Aid Chat
  const [chatMessages, setChatMessages] = useState<FirstAidMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // State for Nutrition Tracker
  const [mealPhoto, setMealPhoto] = useState<File | null>(null);
  const [mealPhotoPreview, setMealPhotoPreview] = useState<string | null>(null);
  const [nutritionData, setNutritionData] = useState<NutritionTrackerOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nutritionError, setNutritionError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const newUserMessage: FirstAidMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, newUserMessage]);
    setChatInput('');
    setIsChatting(true);

    const input: FirstAidChatInput = {
      history: [...chatMessages, newUserMessage],
    };
    
    let fullResponse = '';
    const aiMessage: FirstAidMessage = { role: 'model', content: '' };
    setChatMessages(prev => [...prev, aiMessage]);

    try {
        const result = await firstAidChat(input);
        fullResponse = result.response;

    } catch (error) {
      console.error('Chat error:', error);
      fullResponse = 'Sorry, I encountered an error. Please try again.';
    } finally {
       setChatMessages(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, content: fullResponse } : msg));
       setIsChatting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setMealPhoto(file);
    setNutritionData(null);
    setNutritionError(null);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMealPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setMealPhotoPreview(null);
    }
  };

  const handleNutritionAnalysis = async () => {
    if (!mealPhoto || isAnalyzing) return;
    setIsAnalyzing(true);
    setNutritionData(null);
    setNutritionError(null);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(mealPhoto);
      reader.onload = async () => {
        const photoDataUri = reader.result as string;
        const input: NutritionTrackerInput = { photoDataUri };
        const result = await nutritionTracker(input);
        setNutritionData(result);
      };
      reader.onerror = (error) => {
         throw new Error("Failed to read the image file.");
      }
    } catch (error: any) {
      console.error("Nutrition analysis error:", error);
      setNutritionError(error.message || "Failed to analyze the image. Please try another one.");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  if (loading || !user) {
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
            <Sparkles className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold font-headline">AI Health Assistant</h1>
            <p className="text-lg text-muted-foreground">Your personal assistant for first-aid and nutrition tracking.</p>
          </div>

          <Tabs defaultValue="first-aid" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="first-aid"><HeartPulse className="mr-2"/>First-Aid Assistant</TabsTrigger>
              <TabsTrigger value="nutrition"><Salad className="mr-2"/>Meal Nutrition Tracker</TabsTrigger>
            </TabsList>
            
            <TabsContent value="first-aid" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>First-Aid Chatbot</CardTitle>
                  <CardDescription>Ask for advice on minor health emergencies. This is not a substitute for professional medical advice.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[50vh] flex flex-col">
                        <ScrollArea className="flex-1 p-4 border rounded-md bg-background">
                            {chatMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                    <HeartPulse className="h-12 w-12 mb-4"/>
                                    <p className="font-semibold">How can I help you today?</p>
                                    <p className="text-sm">e.g., "What are the symptoms of a sprained ankle?"</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                {chatMessages.map((msg, index) => (
                                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'model' && <Avatar className="h-8 w-8 bg-primary text-primary-foreground"><Sparkles className="h-5 w-5"/></Avatar>}
                                    <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                    {msg.role === 'user' && <Avatar className="h-8 w-8"><User/></Avatar>}
                                    </div>
                                ))}
                                 <div ref={chatScrollRef} />
                                </div>
                            )}
                        </ScrollArea>
                        <form onSubmit={handleChatSubmit} className="mt-4 flex gap-2">
                            <Input
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Type your health query..."
                                disabled={isChatting}
                            />
                            <Button type="submit" disabled={isChatting || !chatInput.trim()}>
                                {isChatting ? <Loader className="animate-spin" /> : <Send />}
                            </Button>
                        </form>
                    </div>
                    <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Disclaimer</AlertTitle>
                        <AlertDescription>
                            This AI assistant provides information for educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
                        </AlertDescription>
                    </Alert>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="nutrition" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Nutrition Tracker</CardTitle>
                  <CardDescription>Upload a photo of your meal to get an estimated nutritional breakdown.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="meal-photo">Upload Meal Photo</Label>
                    <Input id="meal-photo" type="file" accept="image/*" onChange={handlePhotoChange} disabled={isAnalyzing}/>
                  </div>

                  {mealPhotoPreview && (
                    <div className="relative w-full max-w-sm mx-auto">
                        <Image src={mealPhotoPreview} alt="Meal preview" width={400} height={300} className="rounded-md object-cover"/>
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 bg-black/50 hover:bg-black/75 text-white rounded-full" onClick={() => { setMealPhoto(null); setMealPhotoPreview(null); setNutritionData(null); }}>
                            <X className="h-4 w-4"/>
                        </Button>
                    </div>
                  )}

                  <Button onClick={handleNutritionAnalysis} disabled={!mealPhoto || isAnalyzing} className="w-full">
                    {isAnalyzing ? <><Loader className="mr-2 animate-spin"/>Analyzing...</> : 'Analyze Nutrition'}
                  </Button>

                  {isAnalyzing && (
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4 mx-auto" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                        </div>
                    </div>
                  )}
                  
                  {nutritionError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Analysis Failed</AlertTitle>
                        <AlertDescription>{nutritionError}</AlertDescription>
                    </Alert>
                  )}

                  {nutritionData && (
                     <div className="space-y-4 text-center">
                        <h3 className="text-lg font-semibold">Estimated Nutritional Information</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="p-4">
                                <CardTitle className="text-sm text-muted-foreground">Calories</CardTitle>
                                <p className="text-2xl font-bold">{nutritionData.calories.toFixed(0)}</p>
                            </Card>
                             <Card className="p-4">
                                <CardTitle className="text-sm text-muted-foreground">Protein</CardTitle>
                                <p className="text-2xl font-bold">{nutritionData.proteinGrams.toFixed(1)}g</p>
                            </Card>
                             <Card className="p-4">
                                <CardTitle className="text-sm text-muted-foreground">Carbs</CardTitle>
                                <p className="text-2xl font-bold">{nutritionData.carbsGrams.toFixed(1)}g</p>
                            </Card>
                             <Card className="p-4">
                                <CardTitle className="text-sm text-muted-foreground">Fat</CardTitle>
                                <p className="text-2xl font-bold">{nutritionData.fatGrams.toFixed(1)}g</p>
                            </Card>
                        </div>
                     </div>
                  )}

                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
