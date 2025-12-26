import { Timestamp } from "firebase/firestore";

export type EmergencyReport = {
    id?: string;
    studentId: string;
    studentName: string;
    enrollmentNumber: string;
    year: number;
    location: string;
    emergencyType: string;
    timestamp: Timestamp;
};

export type HospitalFeedback = {
    id?: string;
    studentId: string;
    waitingTime: number;
    doctorAvailability: 'available' | 'unavailable';
    postVisitFeedback: string;
    emergencyVsNormal: 'emergency' | 'normal';
    timestamp: Timestamp;
};

export type MessFoodRating = {
    id?: string;
    studentId: string;
    foodQualityRating: number;
    sickAfterMealReport: 'yes' | 'no';
    timestamp: Timestamp;
};

export type Appointment = {
    id?: string;
    studentId: string;
    studentName: string;
    enrollmentNumber: string;
    appointmentDate: Timestamp;
    appointmentTime: string;
    reason: string;
    status: 'scheduled' | 'completed' | 'cancelled';
};
