
'use server';
import { predictHealthRisks, type PredictHealthRisksInput, type PredictHealthRisksOutput } from '@/ai/flows/predict-health-risks';
import { mockEmergencyReports, mockHospitalFeedbacks, mockMessFoodRatings } from '@/lib/data';

export async function getHealthPredictions(): Promise<{ success: boolean; data?: PredictHealthRisksOutput, error?: string }> {
  try {
    const input: PredictHealthRisksInput = {
      emergencyReports: mockEmergencyReports,
      hospitalFeedbacks: mockHospitalFeedbacks,
      messFoodRatings: mockMessFoodRatings,
    };
    
    // In a real application, you would fetch this data from a database
    // For this demo, we are using mock data.
    
    const result = await predictHealthRisks(input);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to get predictions. Please check the server logs.' };
  }
}
