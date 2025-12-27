
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import type { Appointment } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppointmentsList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;
    const appointmentsCol = collection(db, "appointments");
    const q = query(appointmentsCol, orderBy("appointmentDate", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const appointmentsData: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        appointmentsData.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      setAppointments(appointmentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive"
      default:
        return "outline";
    }
  };
  
  const formatDate = (timestamp: Timestamp | Date): string => {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    return format(date, "PPP");
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
           <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Student</TableHead>
            <TableHead className="hidden md:table-cell">Reason</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No upcoming appointments.
              </TableCell>
            </TableRow>
          )}
          {appointments.map((appt) => (
            <TableRow key={appt.id}>
              <TableCell>
                <div className="font-medium">{formatDate(appt.appointmentDate)}</div>
                <div className="text-xs text-muted-foreground">{appt.appointmentTime}</div>
              </TableCell>
              <TableCell className="font-medium">
                <div>{appt.studentName}</div>
                <div className="text-xs text-muted-foreground">{appt.enrollmentNumber}</div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{appt.reason}</TableCell>
              <TableCell className="text-right">
                <Badge variant={getStatusBadge(appt.status)}>
                  {appt.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
