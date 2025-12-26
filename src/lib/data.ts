import type { PredictHealthRisksInput } from "@/ai/flows/predict-health-risks";

export const mockEmergencyReports: PredictHealthRisksInput["emergencyReports"] = [
    {
      reportId: "EMR001",
      studentDetails: "Rohan Sharma, 20-UCD-034",
      location: "Hostel 5, Block B",
      emergencyType: "Medical",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      reportId: "EMR002",
      studentDetails: "Priya Singh, 21-UCS-112",
      location: "Library",
      emergencyType: "Safety",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      reportId: "EMR003",
      studentDetails: "Amit Kumar, 19-UEE-056",
      location: "Hostel 2, Block A",
      emergencyType: "Medical",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        reportId: 'EMR004',
        studentDetails: 'Anjali Verma, 22-UME-089',
        location: 'Sports Complex',
        emergencyType: 'Medical',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

export const mockHospitalFeedbacks: PredictHealthRisksInput["hospitalFeedbacks"] = [
    {
      feedbackId: "HOSF01",
      waitingTime: 45,
      doctorAvailability: "Available",
      postVisitFeedback: "Service was slow, but the doctor was helpful.",
      emergencyVsNormal: "Normal",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      feedbackId: "HOSF02",
      waitingTime: 10,
      doctorAvailability: "Available",
      postVisitFeedback: "Quick and efficient for my emergency.",
      emergencyVsNormal: "Emergency",
      timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    },
    {
      feedbackId: "HOSF03",
      waitingTime: 120,
      doctorAvailability: "Not Available",
      postVisitFeedback: "Had to wait for 2 hours, no doctor was present initially.",
      emergencyVsNormal: "Normal",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        feedbackId: 'HOSF04',
        waitingTime: 60,
        doctorAvailability: 'Available',
        postVisitFeedback: 'The prescribed medicine caused some side effects.',
        emergencyVsNormal: 'Normal',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

export const mockMessFoodRatings: PredictHealthRisksInput["messFoodRatings"] = [
    {
      ratingId: "MESS01",
      foodQualityRating: 2,
      sickAfterMealReport: "Yes, felt nauseous after dinner.",
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      ratingId: "MESS02",
      foodQualityRating: 4,
      sickAfterMealReport: "No",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      ratingId: "MESS03",
      foodQualityRating: 1,
      sickAfterMealReport: "Yes, had a stomach ache.",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      ratingId: "MESS04",
      foodQualityRating: 2,
      sickAfterMealReport: "Yes",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
    },
    {
        ratingId: 'MESS05',
        foodQualityRating: 3,
        sickAfterMealReport: 'No',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

export const hospitalResponseData = [
    { date: 'Mon', 'Response Time': 12 },
    { date: 'Tue', 'Response Time': 18 },
    { date: 'Wed', 'Response Time': 9 },
    { date: 'Thu', 'Response Time': 25 },
    { date: 'Fri', 'Response Time': 15 },
    { date: 'Sat', 'Response Time': 11 },
    { date: 'Sun', 'Response Time': 30 },
];

export const messHygieneData = [
  { day: '2024-07-01', 'Hostel 1': 4.2, 'Hostel 2': 3.8, 'Hostel 3': 4.5, 'Hostel 4': 3.5 },
  { day: '2024-07-02', 'Hostel 1': 4.0, 'Hostel 2': 3.9, 'Hostel 3': 4.3, 'Hostel 4': 3.6 },
  { day: '2024-07-03', 'Hostel 1': 3.5, 'Hostel 2': 3.2, 'Hostel 3': 3.8, 'Hostel 4': 2.9 },
  { day: '2024-07-04', 'Hostel 1': 2.1, 'Hostel 2': 2.5, 'Hostel 3': 3.1, 'Hostel 4': 2.4 },
  { day: '2024-07-05', 'Hostel 1': 3.8, 'Hostel 2': 3.0, 'Hostel 3': 3.5, 'Hostel 4': 3.1 },
  { day: '2024-07-06', 'Hostel 1': 4.5, 'Hostel 2': 4.1, 'Hostel 3': 4.6, 'Hostel 4': 4.0 },
  { day: '2024-07-07', 'Hostel 1': 4.7, 'Hostel 2': 4.3, 'Hostel 3': 4.8, 'Hostel 4': 4.2 },
];
