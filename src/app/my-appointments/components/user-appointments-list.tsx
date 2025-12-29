
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
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import type { Appointment } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function UserAppointmentsList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();
  const { user } = useUser();

  useEffect(() => {
    if (!db || !user) return;

    const appointmentsCol = collection(db, "appointments");
    // Removed orderBy to fix permission issue related to missing composite index.
    // The query is now a simple query that the security rules can handle.
    const q = query(
      appointmentsCol, 
      where("studentId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const appointmentsData: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        appointmentsData.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      // Sort on the client-side after fetching
      appointmentsData.sort((a, b) => a.appointmentDate.toMillis() - b.appointmentDate.toMillis());
      setAppointments(appointmentsData);
      setLoading(false);
    }, (error) => {
        const permissionError = new FirestorePermissionError({
            path: appointmentsCol.path,
            operation: 'list',
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db, user]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
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
        {[...Array(3)].map((_, i) => (
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
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center">
                You have no scheduled appointments.
              </TableCell>
            </TableRow>
          )}
          {appointments.map((appt) => (
            <TableRow key={appt.id}>
              <TableCell>
                <div className="font-medium">{formatDate(appt.appointmentDate)}</div>
                <div className="text-xs text-muted-foreground">{appt.appointmentTime}</div>
              </TableCell>
              <TableCell>{appt.reason}</TableCell>
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
