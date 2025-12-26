import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockEmergencyReports } from "@/lib/data";
import { formatDistanceToNow } from "date-fns";

export default function LiveAlerts() {
  const getBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case "medical":
        return "destructive";
      case "safety":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="hidden md:table-cell">Student</TableHead>
            <TableHead className="text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockEmergencyReports.map((report) => (
            <TableRow key={report.reportId}>
              <TableCell>
                <Badge variant={getBadgeVariant(report.emergencyType)}>
                  {report.emergencyType}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{report.location}</TableCell>
              <TableCell className="hidden md:table-cell">{report.studentDetails}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
