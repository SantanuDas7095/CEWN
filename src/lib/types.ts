
export type EmergencyReport = {
    id?: string;
    studentId: string;
    studentDetails: string;
    location: string;
    emergencyType: string;
    timestamp: Date;
};

export type HospitalFeedback = {
    id?: string;
    studentId: string;
    waitingTime: number;
    doctorAvailability: 'available' | 'unavailable';
    postVisitFeedback: string;
    emergencyVsNormal: 'emergency' | 'normal';
    timestamp: Date;
};

export type MessFoodRating = {
    id?: string;
    studentId: string;
    foodQualityRating: number;
    sickAfterMealReport: 'yes' | 'no';
    timestamp: Date;
};
