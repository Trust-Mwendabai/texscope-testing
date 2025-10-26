import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, TrendingUp, Database, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ActivityItem {
   user: string;
   type: string;
   time: string;
   content?: string;
   photos?: string[];
   project?: string;
   action?: string;
}

const ProfileActivity = ({ activityFeed }: { activityFeed: ActivityItem[] }) => {
   const [feed, setFeed] = useState(activityFeed);

   const handleRemove = (idx: number) => {
      setFeed(f => f.filter((_, i) => i !== idx));
   };

   const getActivityIcon = (type: string) => {
      switch (type) {
         case 'report':
            return <FileText className="w-5 h-5 text-blue-500" />;
         case 'prediction':
            return <TrendingUp className="w-5 h-5 text-green-500" />;
         case 'dataset':
            return <Database className="w-5 h-5 text-purple-500" />;
         default:
            return <FileText className="w-5 h-5 text-gray-500" />;
      }
   };

  return (
     <div className="space-y-6">
        {feed.map((item, idx) => (
           <Card key={idx} className="relative">
              <button
                 className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                 onClick={() => handleRemove(idx)}
                 aria-label="Remove activity"
                 type="button"
              >
                 <X className="w-5 h-5" />
              </button>
              <CardContent className="py-4">
                 <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                       {getActivityIcon(item.type)}
                    </div>
                    <div className="flex-1">
                       <div className="flex items-center gap-2 mb-1">
                          <div className="font-semibold">{item.user}</div>
                          {item.project && (
                             <Badge variant="secondary" className="text-xs">
                                {item.project}
                             </Badge>
                          )}
                       </div>
                       <div className="text-xs text-muted-foreground mb-2">{item.time}</div>
                       <div className="text-sm">
                          {item.action && <span className="font-medium">{item.action}</span>}
                          {item.content && <span className="ml-1">{item.content}</span>}
                       </div>
                       {item.type === 'photos' && item.photos && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                             {item.photos.map((url, i) => (
                                <img key={i} src={url} alt="activity" className="rounded-lg object-cover w-full h-28" />
                             ))}
                          </div>
                       )}
                    </div>
                 </div>
              </CardContent>
           </Card>
        ))}
     </div>
  );
};

export default ProfileActivity; 