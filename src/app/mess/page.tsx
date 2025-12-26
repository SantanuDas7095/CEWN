"use client";

import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Soup, Star, AlertTriangle, Utensils } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";

export default function MessPage() {
  const [rating, setRating] = useState(3);
  const { toast } = useToast();

  const handleRatingSubmit = () => {
    toast({
      title: "Rating Submitted",
      description: `You rated today's food ${rating} out of 5. Thank you!`,
    });
  };

  const handleSicknessReport = () => {
    toast({
      title: "Sickness Reported",
      description: "Your report has been sent to the mess committee and campus hospital. Please visit the hospital if you feel unwell.",
      variant: "destructive",
    });
  };

  const weeklyScore = 78;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl py-12 px-4 md:px-6 md:py-20">
          <div className="text-center space-y-4">
            <Utensils className="mx-auto h-16 w-16 text-primary" />
            <h1 className="text-4xl font-bold font-headline">Mess Food Safety &amp; Health Monitor</h1>
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
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-10 w-10 cursor-pointer transition-colors ${
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
                <span className="text-2xl font-bold">{rating}/5</span>
              </CardContent>
              <div className="p-6 pt-0">
                <Button onClick={handleRatingSubmit} className="w-full">Submit Rating</Button>
              </div>
            </Card>

            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline">
                        <AlertTriangle className="text-accent" />
                        Feeling Unwell?
                        </CardTitle>
                        <CardDescription>If you feel sick after a meal, report it immediately.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleSicknessReport} variant="destructive" className="w-full text-lg py-6">
                            <AlertTriangle className="mr-2 h-5 w-5" /> Report Sickness
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
