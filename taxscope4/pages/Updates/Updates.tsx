import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Info, Bell, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { BASE_URL } from '@/constants/ApiConstants';

interface Notice {
  id: number;
  title: string;
  content: string;
  type: 'update' | 'notice' | 'important';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  posted_by: string;
  date_created: string;
}

const Updates: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchNotices = async (type: string = 'all') => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/get_notices.php${type !== 'all' ? `?type=${type}` : ''}`);
      if (response.data.status === 'success') {
        setNotices(response.data.notices);
      }
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices(activeTab);
  }, [activeTab]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'update': return <RefreshCw className="h-4 w-4" />;
      case 'important': return <AlertTriangle className="h-4 w-4" />;
      case 'notice': return <Info className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotices = notices.filter(notice =>
    activeTab === 'all' || notice.type === activeTab
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Updates & Notices</h1>
          <p className="text-muted-foreground">
            Stay informed with the latest updates, important notices, and announcements.
          </p>
        </div>
        <Button
          onClick={() => fetchNotices(activeTab)}
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="update">Updates</TabsTrigger>
          <TabsTrigger value="notice">Notices</TabsTrigger>
          <TabsTrigger value="important">Important</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notices found</h3>
                <p className="text-muted-foreground text-center">
                  There are no {activeTab === 'all' ? '' : activeTab} notices at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredNotices.map((notice) => (
                <Card key={notice.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          {getTypeIcon(notice.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{notice.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="secondary"
                              className={`${getPriorityColor(notice.priority)} text-white`}
                            >
                              {notice.priority.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Posted by {notice.posted_by}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(notice.date_created)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {notice.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Updates;