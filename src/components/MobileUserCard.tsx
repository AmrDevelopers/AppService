import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ChevronRight } from 'lucide-react';

interface MobileUserCardProps {
  user: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
    skills: string[];
    currentJobs: number;
  };
}

export default function MobileUserCard({ user }: MobileUserCardProps) {
  return (
    <Card 
      className="border-0 shadow-sm mb-3 active:scale-[0.98] transition-transform"
      onClick={() => {
        // Handle click if needed
      }}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              {user.avatar || user.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-gray-500">{user.role}</p>
              <div className="flex gap-1 mt-1">
                {user.skills.map(skill => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <ChevronRight className="text-gray-400" />
        </div>
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
          <span>Current jobs: {user.currentJobs}</span>
          <span className="h-1 w-1 rounded-full bg-gray-300"></span>
          <span>Available: {5 - user.currentJobs}</span>
        </div>
      </CardContent>
    </Card>
  );
}
