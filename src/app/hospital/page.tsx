
"use client";

import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Stethoscope, Users, Calendar as CalendarIcon, BookMarked } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm, useForm as useFeedbackForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp, onSnapshot, query, Timestamp } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useAdmin } from "@/hooks/use-admin";

const feedbackSchema = z.object({
  caseType: z.enum(["normal", "emergency"], { required_error: "Please select a case type." }),
  waitingTime: z.coerce.number().min(0, "Waiting time cannot be negative."),
  doctorAvailability: z.enum(["available", "unavailable"], { required_error: "Please select doctor availability." }),
  feedback: z.string().min(10, "Feedback must be at least 10 characters.").max(500),
});

const appointmentSchema = z.object({
  studentName: z.string().min(2, "Name is required."),
  enrollmentNumber: z.string().min(5, "Enrollment number is required."),
  appointmentDate: z.date({ required_error: "Please select a date." }),
  appointmentTime: z.string({ required_error: "Please select a time slot." }),
  reason: z.string().min(10, "Please provide a brief reason for your visit.").max(200),
});

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
];

export default function HospitalPage() {
  const { toast } = useToast();
  const [avgWaitTime, setAvgWaitTime] = useState<number | null>(null);
  const db = useFirestore();
  const { user, loading } = useUser();
  const { isAdmin } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!db || !isAdmin) { // Only fetch if user is an admin
      setAvgWaitTime(null);
      return;
    }
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
    }, (error) => {
        const permissionError = new FirestorePermissionError({
            path: feedbacksCol.path,
            operation: 'list',
        }, error);
        errorEmitter.emit('permission-error', permissionError);
    });

    return () => unsubscribe();
  }, [db, isAdmin]);

  const feedbackForm = useFeedbackForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      waitingTime: 0,
      feedback: "",
    },
  });

  const appointmentForm = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      studentName: user?.displayName || "",
      enrollmentNumber: "",
      appointmentDate: new Date(),
      appointmentTime: "",
      reason: "",
    }
  });
  
  useEffect(() => {
    if (user?.displayName) {
      appointmentForm.setValue("studentName", user.displayName);
    }
  }, [user, appointmentForm]);

  async function onFeedbackSubmit(values: z.infer<typeof feedbackSchema>) {
    if (!user || !db) {
      toast({ title: "Authentication Error", description: "You must be logged in to submit feedback.", variant: "destructive" });
      return;
    }
    
    const feedbackData = {
      studentId: user.uid,
      waitingTime: values.waitingTime,
      doctorAvailability: values.doctorAvailability,
      postVisitFeedback: values.feedback,
      emergencyVsNormal: values.caseType,
      timestamp: serverTimestamp(),
    };

    addDoc(collection(db, "hospitalFeedbacks"), feedbackData)
    .then(() => {
        toast({
            title: "Feedback Submitted",
            description: "Thank you for your feedback. It helps us improve our services.",
        });
        feedbackForm.reset();
    }).catch(error => {
        const permissionError = new FirestorePermissionError({
            path: 'hospitalFeedbacks',
            operation: 'create',
            requestResourceData: feedbackData,
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        toast({
            title: "Error",
            description: "Failed to submit feedback. Please try again.",
            variant: "destructive",
        });
    });
  }

  async function onAppointmentSubmit(values: z.infer<typeof appointmentSchema>) {
    if (!user || !db) {
        toast({ title: "Authentication Error", description: "You must be logged in to book an appointment.", variant: "destructive" });
        return;
    }

    const appointmentData = {
      studentId: user.uid,
      studentName: values.studentName,
      enrollmentNumber: values.enrollmentNumber,
      appointmentDate: Timestamp.fromDate(values.appointmentDate),
      appointmentTime: values.appointmentTime,
      reason: values.reason,
      status: 'scheduled',
    };

    addDoc(collection(db, "appointments"), appointmentData)
      .then(() => {
        toast({
          title: "Appointment Booked",
          description: `Your appointment is scheduled for ${format(values.appointmentDate, "PPP")} at ${values.appointmentTime}.`,
        });
        appointmentForm.reset();
      })
      .catch((error) => {
         const permissionError = new FirestorePermissionError({
            path: `appointments`,
            operation: 'create',
            requestResourceData: appointmentData,
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        toast({
          title: "Booking Failed",
          description: "Could not book your appointment. Please try again.",
          variant: "destructive",
        });
      });
  }

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
            <Stethoscope className="mx-auto h-16 w-16 text-primary" />
            <h1 className="text-4xl font-bold font-headline">Campus Hospital Transparency</h1>
            <p className="text-muted-foreground text-lg">
              Real-time hospital status and a platform for your valuable feedback.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {isAdmin && avgWaitTime !== null && (
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
            )}
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

          <div className="mt-12 grid lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                  <BookMarked />
                  Book an Appointment
                </CardTitle>
                <CardDescription>Schedule a non-emergency visit to the campus hospital.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...appointmentForm}>
                  <form onSubmit={appointmentForm.handleSubmit(onAppointmentSubmit)} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                          control={appointmentForm.control}
                          name="studentName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={appointmentForm.control}
                          name="enrollmentNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Enrollment Number</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. 20-UCD-034" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                     <FormField
                        control={appointmentForm.control}
                        name="appointmentDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Appointment Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date(new Date().setHours(0,0,0,0)) 
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={appointmentForm.control}
                        name="appointmentTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Slot</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a time slot" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeSlots.map(slot => (
                                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                     <FormField
                        control={appointmentForm.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reason for Visit</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Briefly describe the reason for your appointment..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <Button type="submit" className="w-full">Book Appointment</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Post-Visit Feedback</CardTitle>
                <p className="text-muted-foreground">Your feedback is mandatory and crucial for accountability.</p>
              </CardHeader>
              <CardContent>
                <Form {...feedbackForm}>
                  <form onSubmit={feedbackForm.handleSubmit(onFeedbackSubmit)} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <FormField
                        control={feedbackForm.control}
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
                        control={feedbackForm.control}
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
                        control={feedbackForm.control}
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
                      control={feedbackForm.control}
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
        </div>
      </main>
      <Footer />
    </div>
  );
}

    