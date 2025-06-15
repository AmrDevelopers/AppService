import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Clock, ChevronRight, Wrench, Check, List } from "lucide-react";
import { formatDateTime } from "../utils/dateUtils";

interface MobileJobCardProps {
  job: {
    id: string;
    jobNumber: string;
    customerName: string;
    description: string;
    requiredDate: string;
    estimatedHours: number;
    status: string;
    priority: string;
    jobType: string;
    assignedTo: string[];
  };
}

const jobTypeColors: Record<string, string> = {
  Installation: 'bg-green-100 text-green-800',
  Maintenance: 'bg-blue-100 text-blue-800',
  Repair: 'bg-red-100 text-red-800',
  Inspection: 'bg-purple-100 text-purple-800',
  Other: 'bg-gray-100 text-gray-800',
};

const jobTypeIcons: Record<string, React.ReactNode> = {
  Installation: <Wrench className="w-4 h-4 mr-1" />,
  Maintenance: <Wrench className="w-4 h-4 mr-1" />,
  Repair: <Wrench className="w-4 h-4 mr-1" />,
  Inspection: <Check className="w-4 h-4 mr-1" />,
  Other: <List className="w-4 h-4 mr-1" />,
};

export default function MobileJobCard({ job }: MobileJobCardProps) {
  return (
    <Card className="border-0 shadow-sm mb-3 active:scale-[0.98] transition-transform">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-base">{job.jobNumber}</span>
              <Badge className={`text-xs ${jobTypeColors[job.jobType]}`}>
                <span className="flex items-center gap-1">
                  {jobTypeIcons[job.jobType]}
                  {job.jobType}
                </span>
              </Badge>
            </div>
            <p className="text-sm line-clamp-2">{job.description}</p>
            
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{formatDateTime(job.requiredDate)}</span>
              <span>•</span>
              <span>{job.estimatedHours} hrs</span>
            </div>
            
            <div className="flex gap-2 mt-2">
              <Badge className={`text-xs ${job.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                job.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                job.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                'bg-red-100 text-red-800'}`}>
                {job.status}
              </Badge>
              <Badge className={`text-xs ${job.priority === 'Low' ? 'bg-blue-100 text-blue-800' : 
                job.priority === 'Medium' ? 'bg-orange-100 text-orange-800' : 
                job.priority === 'High' ? 'bg-red-100 text-red-800' : 
                'bg-purple-100 text-purple-800'}`}>
                {job.priority}
              </Badge>
            </div>
          </div>
          <ChevronRight className="text-gray-400" />
        </div>
        
        {/* Assigned users chips */}
        {job.assignedTo.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {job.assignedTo.map(userId => (
              <div key={userId} className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 text-xs">
                <div className="w-4 h-4 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 text-[10px]">
                  {userId.charAt(0)}
                </div>
                <span className="truncate max-w-[80px]">User {userId}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
