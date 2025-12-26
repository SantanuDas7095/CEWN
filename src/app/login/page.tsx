"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { University } from "lucide-react";

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
           <University className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl font-headline mt-4">Welcome to NIT Agartala CEWN</CardTitle>
          <CardDescription>Please sign in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleGoogleSignIn}>
            Sign In with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
