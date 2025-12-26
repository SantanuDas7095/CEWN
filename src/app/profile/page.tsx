
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUser, useAuth, useStorage, useFirestore } from '@/firebase';
import { Header } from '@/components/common/header';
import { Footer } from '@/components/common/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Loader2, User as UserIcon } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { UserProfile } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.'),
  enrollmentNumber: z.string().optional(),
  hostel: z.string().optional(),
  department: z.string().optional(),
  year: z.coerce.number().optional(),
  photo: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const storage = useStorage();
  const db = useFirestore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      enrollmentNumber: '',
      hostel: '',
      department: '',
      year: undefined,
      photo: null,
    },
  });

  useEffect(() => {
    if (userLoading) return;
    if (!user || !db) {
        router.push('/login');
        return;
    }

    const fetchUserProfile = async () => {
        const userDocRef = doc(db, 'userProfile', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            form.reset({
                displayName: user.displayName || profile.displayName || '',
                enrollmentNumber: profile.enrollmentNumber || '',
                hostel: profile.hostel || '',
                department: profile.department || '',
                year: profile.year || undefined,
            });
        } else {
             form.reset({
                displayName: user.displayName || '',
            });
        }
    };

    fetchUserProfile();

  }, [user, userLoading, db, router, form]);


  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    // This will be handled by the useEffect, but as a fallback
    return null;
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('photo', file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!auth?.currentUser || !storage || !db) return;

    setIsSubmitting(true);
    let photoURL = user.photoURL;

    try {
      if (data.photo && data.photo instanceof File) {
        const photoRef = ref(storage, `profile-pictures/${user.uid}`);
        const snapshot = await uploadBytes(photoRef, data.photo);
        photoURL = await getDownloadURL(snapshot.ref);
      }
      
      await updateProfile(auth.currentUser, {
        displayName: data.displayName,
        photoURL: photoURL,
      });

      const userProfileData: Omit<UserProfile, 'id' | 'email'> = {
        uid: user.uid,
        displayName: data.displayName,
        photoURL: photoURL,
        enrollmentNumber: data.enrollmentNumber || '',
        hostel: data.hostel || '',
        department: data.department || '',
        year: data.year || 0,
        updatedAt: Timestamp.now(),
      };

      const userDocRef = doc(db, 'userProfile', user.uid);
      setDoc(userDocRef, userProfileData, { merge: true })
        .catch(error => {
             const permissionError = new FirestorePermissionError({
                path: `userProfile/${user.uid}`,
                operation: 'update',
                requestResourceData: userProfileData,
            }, error);
            errorEmitter.emit('permission-error', permissionError);
        });


      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      // Force a reload of the user to get the new data
      await auth.currentUser.reload();
      router.refresh();

    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'An error occurred while updating your profile.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setPhotoPreview(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary/50">
        <div className="container mx-auto max-w-2xl py-12 px-4 md:px-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline flex items-center gap-3">
                <UserIcon className="h-6 w-6 text-primary" />
                Edit Your Profile
              </CardTitle>
              <CardDescription>
                Manage your public profile information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={photoPreview || user.photoURL || undefined} alt={user.displayName || 'User'} />
                      <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="picture">Profile Picture</Label>
                      <Input id="picture" type="file" accept="image/*" onChange={handlePhotoChange} />
                      <p className="text-sm text-muted-foreground">Upload a new photo (max 2MB).</p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enrollmentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enrollment Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 20-UCD-034" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hostel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hostel</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                           <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your hostel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Gargi hostel">Gargi hostel</SelectItem>
                            <SelectItem value="RNT hostel">RNT hostel</SelectItem>
                            <SelectItem value="Aryabhatta hostel">Aryabhatta hostel</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                   <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Computer Science" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year of Study</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
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
