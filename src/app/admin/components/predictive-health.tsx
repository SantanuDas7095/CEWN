"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getHealthPredictions } from "@/app/actions";
import { BrainCircuit, Loader, AlertTriangle, ShieldCheck } from "lucide-react";
import type { PredictHealthRisksOutput } from "@/ai/flows/predict-health-risks";
import { Badge } from "@/components/ui/badge";

export default function PredictiveHealth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictHealthRisksOutput | null>(null);

  const handleAnalysis = async () => {
    setLoading(true);
    setError(null);
    setPredictions(null);
    const result = await getHealthPredictions();
    if (result.success && result.data) {
      setPredictions(result.data);
    } else {
      setError(result.error || "An unknown error occurred.");
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
          Use AI to analyze recent emergency, hospital, and mess data to identify potential health risks on campus. This uses mock data for demonstration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <Button onClick={handleAnalysis} disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Data...
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
