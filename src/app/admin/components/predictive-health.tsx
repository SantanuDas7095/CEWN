
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { predictHealthRisks, type PredictHealthRisksInput, type PredictHealthRisksOutput } from "@/ai/flows/predict-health-risks";
import { BrainCircuit, Loader, AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFirestore } from "@/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import type { EmergencyReport, HospitalFeedback, MessFoodRating } from "@/lib/types";

export default function PredictiveHealth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictHealthRisksOutput | null>(null);
  const db = useFirestore();

  const [emergencyReports, setEmergencyReports] = useState<EmergencyReport[]>([]);
  const [hospitalFeedbacks, setHospitalFeedbacks] = useState<HospitalFeedback[]>([]);
  const [messFoodRatings, setMessFoodRatings] = useState<MessFoodRating[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    setDataLoading(true);
    
    const unsubEmergency = onSnapshot(collection(db, "emergencyReports"), (snap) => {
        setEmergencyReports(snap.docs.map(doc => ({ ...doc.data(), reportId: doc.id } as any)));
    });

    const unsubFeedback = onSnapshot(collection(db, "hospitalFeedbacks"), (snap) => {
        setHospitalFeedbacks(snap.docs.map(doc => ({ ...doc.data(), feedbackId: doc.id } as any)));
    });

    const unsubRatings = onSnapshot(collection(db, "messFoodRatings"), (snap) => {
        setMessFoodRatings(snap.docs.map(doc => ({ ...doc.data(), ratingId: doc.id } as any)));
    });

    Promise.all([new Promise(res => onSnapshot(collection(db, "emergencyReports"), res)), new Promise(res => onSnapshot(collection(db, "hospitalFeedbacks"), res)), new Promise(res => onSnapshot(collection(db, "messFoodRatings"), res))]).then(() => {
        setDataLoading(false);
    })

    return () => {
        unsubEmergency();
        unsubFeedback();
        unsubRatings();
    }
  }, [db]);


  const handleAnalysis = async () => {
    setLoading(true);
    setError(null);
    setPredictions(null);
    try {
        const input: PredictHealthRisksInput = {
            emergencyReports,
            hospitalFeedbacks,
            messFoodRatings,
        };
        const result = await predictHealthRisks(input);
        setPredictions(result);
    } catch (error: any) {
        console.error(error);
        setError(error.message || 'Failed to get predictions. Please check the server logs.');
    }
    setLoading(false);
  };

  const getRiskBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "default";
      default:
        return "outline";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="text-primary" />
          Predictive Health Risk Analysis
        </CardTitle>
        <CardDescription>
          Use AI to analyze real-time emergency, hospital, and mess data to identify potential health risks on campus.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <Button onClick={handleAnalysis} disabled={loading || dataLoading} size="lg">
            {loading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Data...
              </>
            ) : dataLoading ? (
                 <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Loading Real-time Data...
                </>
            ) : (
              "Run AI Health Analysis"
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Analysis Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {predictions && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Analysis Complete: {predictions.healthRisks.length} potential risks identified.</h3>
            <Accordion type="single" collapsible className="w-full">
              {predictions.healthRisks.map((risk, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-4">
                       <Badge variant={getRiskBadge(risk.riskLevel)}>{risk.riskLevel} Risk</Badge>
                       <span>{risk.riskType} in {risk.affectedArea}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 p-2">
                    <p><strong>Description:</strong> {risk.description}</p>
                    <div className="bg-secondary/50 p-4 rounded-md">
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                           <ShieldCheck className="h-4 w-4 text-green-600"/>
                           Recommendations
                        </h4>
                        <p className="text-muted-foreground">{risk.recommendations}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
