
'use server';
import { predictHealthRisks, type PredictHealthRisksInput, type PredictHealthRisksOutput } from '@/ai/flows/predict-health-risks';
import { collection, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { EmergencyReport, HospitalFeedback, MessFoodRating } from '@/lib/types';


// This function is no longer used by the PredictiveHealth component but is kept for potential future use or reference.
export async function getHealthPredictions(): Promise<{ success: boolean; data?: PredictHealthRisksOutput, error?: string }> {
  try {
    const { firestore: db } = initializeFirebase();
    
    const emergencyReportsSnap = await getDocs(collection(db, "emergencyReports"));
    const hospitalFeedbacksSnap = await getDocs(collection(db, "hospitalFeedbacks"));
    const messFoodRatingsSnap = await getDocs(collection(db, "messFoodRatings"));

    const emergencyReports = emergencyReportsSnap.docs.map(doc => ({ ...doc.data(), reportId: doc.id } as any));
    const hospitalFeedbacks = hospitalFeedbacksSnap.docs.map(doc => ({ ...doc.data(), feedbackId: doc.id } as any));
    const messFoodRatings = messFoodRatingsSnap.docs.map(doc => ({ ...doc.data(), ratingId: doc.id } as any));

    const input: PredictHealthRisksInput = {
      emergencyReports,
      hospitalFeedbacks,
      messFoodRatings,
    };
    
    const result = await predictHealthRisks(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message || 'Failed to get predictions. Please check the server logs.' };
  }
}
