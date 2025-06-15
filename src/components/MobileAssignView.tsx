import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Job, User, TaskStatus, TaskPriority, JobType } from '../types/taskTypes';
import { useState } from 'react';

interface MobileAssignViewProps {
  job: Job;
  users: User[];
  onBack: () => void;
  onAssign: (userId: string) => void;
  onUnassign: (userId: string) => void;
}

export default function MobileAssignView({ 
  job, 
  users, 
  onBack, 
  onAssign, 
  onUnassign 
}: MobileAssignViewProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const handleAssign = () => {
    if (selectedUser) {
      onAssign(selectedUser);
      setSelectedUser(null);
    }
  };

  const handleUnassign = (userId: string) => {
    onUnassign(userId);
  };

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
        <h2 className="text-lg font-semibold">Assign Job</h2>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="font-medium">Job Details</h3>
            <div className="space-y-1">
              <p className="text-gray-600">{job.title}</p>
              <p className="text-sm text-gray-500">{job.description}</p>
              <div className="flex gap-2">
                <Badge variant="outline">{job.priority}</Badge>
                <Badge variant="outline">{job.status}</Badge>
                <Badge variant="outline">{job.jobType}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {job.assignedTo.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Assigned Users</h3>
            <div className="space-y-2">
              {job.assignedTo.map(userId => {
                const user = users.find(u => u.id === userId);
                if (!user) return null;
                return (
                  <div key={userId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        {user.avatar || user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.role}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnassign(userId)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">Available Users</h3>
          <div className="space-y-2">
            {users.map(user => (
              <div
                key={user.id}
                className={`p-2 rounded cursor-pointer ${
                  selectedUser === user.id ? 'bg-blue-50' : 'bg-gray-50'
                }`}
                onClick={() => setSelectedUser(user.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      {user.avatar || user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.role}</p>
                    </div>
                  </div>
                  {selectedUser === user.id && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleAssign}
                    >
                      Assign
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
