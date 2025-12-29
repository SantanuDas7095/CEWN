
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
import { collection, onSnapshot, query, orderBy, Timestamp, doc, updateDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import type { Appointment } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { MoreHorizontal, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function AppointmentsList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();
  const { toast } = useToast();

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
    }, (error) => {
        const permissionError = new FirestorePermissionError({
            path: appointmentsCol.path,
            operation: 'list',
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleStatusChange = async (appointmentId: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    if (!db) return;
    const appointmentRef = doc(db, 'appointments', appointmentId);
    
    const updateData = { status };
    
    updateDoc(appointmentRef, updateData)
        .then(() => {
            toast({
                title: "Status Updated",
                description: `Appointment status changed to ${status}.`
            });
        })
        .catch(error => {
            const permissionError = new FirestorePermissionError({
                path: appointmentRef.path,
                operation: 'update',
                requestResourceData: updateData,
            }, error);
            errorEmitter.emit('permission-error', permissionError);
            toast({
                title: "Update Failed",
                description: "You do not have permission to update appointments.",
                variant: 'destructive'
            });
        });
  };

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
            <TableHead>Reason</TableHead>
            <TableHead>Booked By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
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
              <TableCell>{appt.reason}</TableCell>
              <TableCell>
                 <div className="flex items-center gap-2">
                    {appt.bookedBy === 'admin' ? <Shield className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-muted-foreground" />}
                    <span className="capitalize">{appt.bookedBy || 'student'}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadge(appt.status)}>
                  {appt.status}
                </Badge>
              </TableCell>
               <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStatusChange(appt.id!, 'scheduled')}>
                      Mark as Scheduled
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(appt.id!, 'completed')}>
                      Mark as Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(appt.id!, 'cancelled')}>
                      Mark as Cancelled
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
