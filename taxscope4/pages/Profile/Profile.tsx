import { useState } from 'react';
import PageHeader from '@/components/navigation/page-header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ProfileSidebar from '@/components/profile/profile-sidebar';
import ProfileSettings from '@/components/profile/profile-settings';
import profileImage from '@/assets/inno.png';

const user = {
  name: 'Innocent Mugwadi',
  title: 'Senior Data Scientist',
  avatar: profileImage,
  education: 'M.S. in Computer Science from Stanford University',
  location: 'San Francisco, California',
  skills: 'Python Machine Learning TensorFlow Data Analysis SQL',
  notes: 'Specialized in predictive analytics and machine learning model development. Currently leading AI initiatives for business intelligence and automated decision systems.',
  department: 'Data Science & Analytics',
  employeeId: 'DS-2024-001',
  joinDate: 'January 2022'
};


const Profile = () => {
  const [tab, setTab] = useState('settings');
  return (
    <>
      <PageHeader
        items={[
          { label: 'Home', href: '/' },
          { label: 'User Profile', href: '/profile' }
        ]}
        heading="Profile"
      />
      <div className="flex flex-col md:flex-row gap-6 w-full">
        <ProfileSidebar user={user} />
        <div className="flex-1">
          <Tabs value={tab} onValueChange={setTab} className="mt-4">
            <TabsList className="mb-4 flex gap-2 bg-muted p-1 rounded-lg w-fit">
              <TabsTrigger value="settings" className={tab === 'settings' ? '!bg-primary text-white shadow' : 'text-muted-foreground'}>
                Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="settings">
              <ProfileSettings user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Profile; 