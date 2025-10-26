import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface User {
   name: string;
   title: string;
   avatar: string;
   education: string;
   location: string;
   skills: string;
   notes: string;
   department?: string;
   employeeId?: string;
   joinDate?: string;
}

const ProfileSidebar = ({ user }: { user: User }) => (
  <div className="w-full md:w-80 flex-shrink-0">
    <Card className="mb-4">
      <CardContent className="flex flex-col items-center py-6">
        <img src={user.avatar} alt="avatar" className="w-24 h-24 rounded-full mb-2 border-4 border-primary object-cover" />
        <h2 className="text-xl font-semibold mt-2">{user.name}</h2>
        <p className="text-muted-foreground text-sm mb-4">{user.title}</p>
        {user.employeeId && (
          <div className="text-sm text-muted-foreground mb-2">
            Employee ID: {user.employeeId}
          </div>
        )}
        {user.joinDate && (
          <div className="text-sm text-muted-foreground">
            Joined: {user.joinDate}
          </div>
        )}
      </CardContent>
    </Card>
    <Card>
      <CardContent className="py-4">
        <div className="mb-2 font-semibold text-primary">Professional Information</div>
        {user.department && (
          <div className="mb-2">
            <div className="font-semibold flex items-center gap-2"><span>Department</span></div>
            <div className="text-sm text-muted-foreground">{user.department}</div>
          </div>
        )}
        <div className="mb-2">
          <div className="font-semibold flex items-center gap-2"><span>Education</span></div>
          <div className="text-sm text-muted-foreground">{user.education}</div>
        </div>
        <div className="mb-2">
          <div className="font-semibold flex items-center gap-2"><span>Location</span></div>
          <div className="text-sm text-muted-foreground">{user.location}</div>
        </div>
        <div className="mb-2">
          <div className="font-semibold flex items-center gap-2"><span>Skills</span></div>
          <div className="text-sm text-muted-foreground">{user.skills}</div>
        </div>
        <div>
          <div className="font-semibold flex items-center gap-2"><span>Bio</span></div>
          <div className="text-sm text-muted-foreground">{user.notes}</div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default ProfileSidebar; 