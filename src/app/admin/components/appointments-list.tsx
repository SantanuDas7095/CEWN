
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
import { format, startOfDay, endOfDay } from "date-fns";
import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy, Timestamp, doc, updateDoc, where } from "firebase/firestore";
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
import { Calendar } from "@/components/ui/calendar";


export default function AppointmentsList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const db = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!db || !selectedDate) return;
    
    setLoading(true);

    const appointmentsCol = collection(db, "appointments");
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    const q = query(
        appointmentsCol, 
        where("appointmentDate", ">=", Timestamp.fromDate(start)),
        where("appointmentDate", "<=", Timestamp.fromDate(end)),
        orderBy("appointmentDate", "asc")
    );

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
  }, [db, selectedDate]);

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

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-auto">
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
            />
        </div>
        <div className="flex-1 w-full">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Booked By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6}>
                                <Skeleton className="h-12 w-full" />
                            </TableCell>
                        </TableRow>
                    ) : appointments.length === 0 ? (
                        <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            No appointments scheduled for this day.
                        </TableCell>
                        </TableRow>
                    ) : (
                    appointments.map((appt) => (
                        <TableRow key={appt.id}>
                        <TableCell>
                            <div className="font-medium">{appt.appointmentTime}</div>
                        </TableCell>
                        <TableCell className="font-medium">
                            <div>{appt.studentName}</div>
                            <div className="text-xs text-muted-foreground">{appt.enrollmentNumber}</div>
                        </TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate">{appt.reason}</TableCell>
                         <TableCell>
                            {appt.bookedBy === 'admin' ? (
                                <Badge variant="secondary"><Shield className="h-3 w-3 mr-1"/>Admin</Badge>
                            ) : (
                                <Badge variant="outline"><User className="h-3 w-3 mr-1"/>Student</Badge>
                            )}
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
                    )))}
                    </TableBody>
                </Table>
            </div>
        </div>
    </div>
  );
}
