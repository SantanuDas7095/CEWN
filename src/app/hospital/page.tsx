"use client";

import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Stethoscope, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp, getDocs, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const feedbackSchema = z.object({
  caseType: z.enum(["normal", "emergency"], { required_error: "Please select a case type." }),
  waitingTime: z.coerce.number().min(0, "Waiting time cannot be negative."),
  doctorAvailability: z.enum(["available", "unavailable"], { required_error: "Please select doctor availability." }),
  feedback: z.string().min(10, "Feedback must be at least 10 characters.").max(500),
});

export default function HospitalPage() {
  const { toast } = useToast();
  const [avgWaitTime, setAvgWaitTime] = useState(0);

  useEffect(() => {
    const feedbacksCol = collection(db, "hospitalFeedbacks");
    const q = query(feedbacksCol);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (querySnapshot.empty) {
            setAvgWaitTime(0);
            return;
        }
        let totalWaitTime = 0;
        querySnapshot.forEach((doc) => {
            totalWaitTime += doc.data().waitingTime;
        });
        setAvgWaitTime(Math.floor(totalWaitTime / querySnapshot.size));
    });

    return () => unsubscribe();
  }, []);

  const form = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      waitingTime: 0,
      feedback: "",
    },
  });

  async function onSubmit(values: z.infer<typeof feedbackSchema>) {
    try {
      await addDoc(collection(db, "hospitalFeedbacks"), {
        studentId: "user-placeholder-id", // Replace with actual user ID
        waitingTime: values.waitingTime,
        doctorAvailability: values.doctorAvailability,
        postVisitFeedback: values.feedback,
        emergencyVsNormal: values.caseType,
        timestamp: serverTimestamp(),
      });
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback. It helps us improve our services.",
      });
      form.reset();
    } catch (error) {
      console.error("Error submitting feedback: ", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl py-12 px-4 md:px-6 md:py-20">
          <div className="text-center space-y-4">
            <Stethoscope className="mx-auto h-16 w-16 text-primary" />
            <h1 className="text-4xl font-bold font-headline">Campus Hospital Transparency</h1>
            <p className="text-muted-foreground text-lg">
              Real-time hospital status and a platform for your valuable feedback.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Waiting Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgWaitTime} min</div>
                <p className="text-xs text-muted-foreground">Based on recent patient feedback</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Doctor Availability</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Available</div>
                <p className="text-xs text-muted-foreground">Dr. A. K. Singh (General Physician)</p>
              </CardContent>
            </Card>
            <Card className="bg-primary text-primary-foreground">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary-foreground/80">Emergency Status</CardTitle>
                <Stethoscope className="h-4 w-4 text-primary-foreground/80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Priority Open</div>
                <p className="text-xs text-primary-foreground/80">Emergency cases are being prioritized.</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-12">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Post-Visit Feedback</CardTitle>
              <p className="text-muted-foreground">Your feedback is mandatory and crucial for accountability.</p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="caseType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Case Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="normal" />
                                </FormControl>
                                <FormLabel className="font-normal">Normal</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="emergency" />
                                </FormControl>
                                <FormLabel className="font-normal">Emergency</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="doctorAvailability"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Doctor Availability on Arrival</FormLabel>
                           <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="available" />
                                </FormControl>
                                <FormLabel className="font-normal">Available</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="unavailable" />
                                </FormControl>
                                <FormLabel className="font-normal">Unavailable</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                   <FormField
                      control={form.control}
                      name="waitingTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Waiting Time (in minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  <FormField
                    control={form.control}
                    name="feedback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Post-Visit Feedback</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe your experience..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Submit Feedback</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
