import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { formatDateTime } from '../utils/dateUtils';
import { Job, User } from '../types/taskTypes';

interface MobileUserJobsViewProps {
  user: User;
  jobs: Job[];
  onBack: () => void;
}

export default function MobileUserJobsView({ 
  user, 
  jobs, 
  onBack 
}: MobileUserJobsViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">{user.name}'s Jobs</h2>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              {user.avatar || user.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-gray-500">{user.role}</p>
            </div>
          </div>

          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{job.title}</h3>
                    <p className="text-sm text-gray-500">{job.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{job.priority}</Badge>
                      <Badge variant="outline">{job.status}</Badge>
                      <Badge variant="outline">{job.jobType}</Badge>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Created: {formatDateTime(job.createdAt)}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
