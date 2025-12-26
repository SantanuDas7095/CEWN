"use client";

import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";
import { Card, CardContent } from "@/components/ui/card";
import { HeartPulse, Shield, Flame, Home, Megaphone } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const emergencyTypes = [
  {
    name: "Medical",
    icon: <HeartPulse className="h-16 w-16 text-red-500" />,
    color: "hover:bg-red-500/10",
  },
  {
    name: "Safety",
    icon: <Shield className="h-16 w-16 text-blue-500" />,
    color: "hover:bg-blue-500/10",
  },
  {
    name: "Fire",
    icon: <Flame className="h-16 w-16 text-orange-500" />,
    color: "hover:bg-orange-500/10",
  },
  {
    name: "Hostel Issue",
    icon: <Home className="h-16 w-16 text-green-500" />,
    color: "hover:bg-green-500/10",
  },
];

export default function SosPage() {
  const [selectedEmergency, setSelectedEmergency] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAlertConfirm = () => {
    if (selectedEmergency) {
      console.log(`SOS sent for ${selectedEmergency} emergency.`);
      toast({
        title: "SOS Alert Sent",
        description: `Your ${selectedEmergency.toLowerCase()} emergency alert has been sent. Authorities are on their way.`,
        variant: "destructive",
      });
      setSelectedEmergency(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl py-12 px-4 md:px-6 md:py-20">
          <div className="text-center space-y-4">
            <Megaphone className="mx-auto h-16 w-16 text-accent" />
            <h1 className="text-4xl font-bold font-headline">Emergency SOS</h1>
            <p className="text-muted-foreground text-lg">
              In an emergency, tap the relevant button below. Your location and details will be automatically sent to campus authorities.
            </p>
          </div>

          <AlertDialog>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {emergencyTypes.map((emergency) => (
                <AlertDialogTrigger asChild key={emergency.name}>
                  <Card
                    className={`cursor-pointer transition-all ${emergency.color} hover:shadow-xl`}
                    onClick={() => setSelectedEmergency(emergency.name)}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                      {emergency.icon}
                      <span className="text-2xl font-bold">{emergency.name}</span>
                    </CardContent>
                  </Card>
                </AlertDialogTrigger>
              ))}
            </div>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm {selectedEmergency} Emergency?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will immediately alert campus security, the hostel warden, and the campus hospital. Only proceed if this is a genuine emergency.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedEmergency(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleAlertConfirm}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Confirm Emergency
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
      <Footer />
    </div>
  );
}
