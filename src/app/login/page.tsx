
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { University, LogIn, UserPlus, Phone, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const emailSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

const phoneSchema = z.object({
    phoneNumber: z.string().length(10, 'Please enter a valid 10-digit phone number.'),
    otp: z.string().optional(),
});

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
        phoneNumber: '',
        otp: '',
    }
  });

  const setupRecaptcha = () => {
    if (!auth) return;
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
        }
      });
    }
  }
  
  const handleSendOtp = async (values: z.infer<typeof phoneSchema>) => {
    if (!auth) return;
    
    const fullPhoneNumber = `+91${values.phoneNumber}`;
    
    setIsSendingOtp(true);
    setupRecaptcha();
    const appVerifier = (window as any).recaptchaVerifier;

    try {
        const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
        setConfirmationResult(result);
        toast({ title: "OTP Sent", description: `An OTP has been sent to ${fullPhoneNumber}.` });
    } catch (error: any) {
        console.error("OTP Error:", error);
        toast({ title: "Failed to send OTP", description: error.message, variant: "destructive" });
    } finally {
        setIsSendingOtp(false);
    }
  };
  
  const handleVerifyOtp = async (values: z.infer<typeof phoneSchema>) => {
    if (!values.otp || !confirmationResult) {
      toast({ title: "OTP is required", variant: "destructive" });
      return;
    }

    setIsVerifyingOtp(true);
    try {
      await confirmationResult.confirm(values.otp);
      toast({ title: "Sign In Successful!", description: "You have been successfully signed in." });
      router.push('/');
    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      toast({ title: "OTP Verification Failed", description: error.message || 'An unknown error occurred.', variant: "destructive" });
    } finally {
      setIsVerifyingOtp(false);
    }
  }


  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      'prompt': 'select_account'
    });
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) => {
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, do nothing.
        return;
      }
      toast({
        title: 'Authentication Error',
        description:
          error.message || 'An error occurred during Google Sign-In.',
        variant: 'destructive',
      });
    }
  };

  const handleEmailSignUp = async (values: z.infer<typeof emailSchema>) => {
    if (!auth) return;
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Sign-Up Failed',
        description:
          error.code === 'auth/email-already-in-use'
            ? 'This email is already in use.'
            : error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEmailSignIn = async (values: z.infer<typeof emailSchema>) => {
    if (!auth) return;
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Sign-In Failed',
        description: 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <div id="recaptcha-container"></div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <University className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl font-headline mt-4">
            Welcome to NIT Agartala CEWN
          </CardTitle>
          <CardDescription>
            Sign in or create an account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">
                <LogIn className="mr-2 h-4 w-4" /> Sign In
              </TabsTrigger>
              <TabsTrigger value="signup">
                <UserPlus className="mr-2 h-4 w-4" /> Sign Up
              </TabsTrigger>
              <TabsTrigger value="phone">
                <Phone className="mr-2 h-4 w-4" /> Phone
              </TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit(handleEmailSignIn)}
                  className="space-y-6 pt-6"
                >
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="name@nita.ac.in"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={emailForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Sign In
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="signup">
              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit(handleEmailSignUp)}
                  className="space-y-6 pt-6"
                >
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="name@nita.ac.in"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={emailForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Sign Up
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="phone">
               <Form {...phoneForm}>
                <form 
                    onSubmit={confirmationResult ? phoneForm.handleSubmit(handleVerifyOtp) : phoneForm.handleSubmit(handleSendOtp)}
                    className="space-y-6 pt-6"
                >
                  {!confirmationResult ? (
                    <FormField
                      control={phoneForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                                <div className="flex h-10 items-center rounded-md border border-input bg-background px-3">
                                    <span className="text-sm text-muted-foreground">+91</span>
                                </div>
                                <Input
                                    type="tel"
                                    placeholder="98765 43210"
                                    {...field}
                                />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={phoneForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Code</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter 6-digit OTP"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <Button type="submit" className="w-full" disabled={isSendingOtp || isVerifyingOtp}>
                    {isSendingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isVerifyingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {confirmationResult ? 'Verify OTP' : 'Send OTP'}
                  </Button>
                   {confirmationResult && (
                        <Button variant="link" className="w-full" onClick={() => {
                            setConfirmationResult(null);
                            phoneForm.reset();
                        }}>
                           Change phone number
                        </Button>
                    )}
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
            <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
              <path
                fill="currentColor"
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.67-4.05 1.67-4.7 0-8.53-3.84-8.53-8.53s3.84-8.53 8.53-8.53c2.42 0 4.5 1.05 5.94 2.36l2.64-2.64C19.43 1.99 16.25 1 12.48 1 5.88 1 1 5.88 1 12.48s4.88 11.48 11.48 11.48c3.47 0 6.3-1.2 8.3-3.33 2.1-2.1 2.85-5.05 2.85-7.73 0-.74-.07-1.44-.2-2.14H12.48z"
              />
            </svg>
            Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

    