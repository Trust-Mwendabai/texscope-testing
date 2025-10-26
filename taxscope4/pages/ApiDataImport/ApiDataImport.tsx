import { useState } from 'react';
import PageHeader from '@/components/navigation/page-header';
import CardWrapper from '@/components/card-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Plus, Play, CheckCircle, XCircle, Loader2, Settings, Key, Globe } from 'lucide-react';
import { BASE_URL } from '@/constants/ApiConstants';

interface ApiConnection {
  id: string;
  name: string;
  endpoint: string;
  authType: 'none' | 'api_key' | 'bearer_token' | 'basic_auth';
  authValue: string;
  dataType: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
}

const ApiDataImport = () => {
  const [connections, setConnections] = useState<ApiConnection[]>([
    {
      id: '1',
      name: 'Salesforce CRM',
      endpoint: 'https://api.salesforce.com/v1/data',
      authType: 'bearer_token',
      authValue: '••••••••••••••••',
      dataType: 'customer_data',
      status: 'connected',
      lastSync: '2024-01-15 10:30:00'
    },
    {
      id: '2',
      name: 'QuickBooks',
      endpoint: 'https://api.quickbooks.com/v3/company',
      authType: 'api_key',
      authValue: '••••••••••••••••',
      dataType: 'financial_data',
      status: 'disconnected'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [importResults, setImportResults] = useState<any>(null);

  const [newConnection, setNewConnection] = useState({
    name: '',
    endpoint: '',
    authType: 'none' as 'none' | 'api_key' | 'bearer_token' | 'basic_auth',
    authValue: '',
    dataType: 'general'
  });

  const dataTypes = [
    { value: 'customer_data', label: 'Customer Data' },
    { value: 'financial_data', label: 'Financial Data' },
    { value: 'inventory_data', label: 'Inventory Data' },
    { value: 'sales_data', label: 'Sales Data' },
    { value: 'marketing_data', label: 'Marketing Data' },
    { value: 'operational_data', label: 'Operational Data' },
    { value: 'general', label: 'General Data' }
  ];

  const authTypes = [
    { value: 'none', label: 'No Authentication' },
    { value: 'api_key', label: 'API Key' },
    { value: 'bearer_token', label: 'Bearer Token' },
    { value: 'basic_auth', label: 'Basic Authentication' }
  ];

  const handleCreateConnection = async () => {
    if (!newConnection.name || !newConnection.endpoint) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}api_data_import.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_connection',
          ...newConnection,
          user_id: '1' // This should come from authentication context
        })
      });

      const data = await response.json();
      if (data.success) {
        const connection: ApiConnection = {
          id: data.connection_id,
          name: newConnection.name,
          endpoint: newConnection.endpoint,
          authType: newConnection.authType,
          authValue: newConnection.authValue ? '••••••••••••••••' : '',
          dataType: newConnection.dataType,
          status: 'disconnected'
        };

        setConnections([...connections, connection]);
        setNewConnection({
          name: '',
          endpoint: '',
          authType: 'none',
          authValue: '',
          dataType: 'general'
        });
        setIsDialogOpen(false);
      } else {
        alert(data.error || 'Failed to create connection');
      }
    } catch (error) {
      console.error('Error creating connection:', error);
      alert('Error creating connection');
    }
  };

  const handleTestConnection = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    try {
      const response = await fetch(`${BASE_URL}api_data_import.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_connection',
          connection_id: connectionId,
          user_id: '1' // This should come from authentication context
        })
      });

      const data = await response.json();
      if (data.success) {
        // Update connection status
        setConnections(connections.map(c =>
          c.id === connectionId
            ? { ...c, status: 'connected' as const }
            : c
        ));
        alert('Connection test successful!');
      } else {
        setConnections(connections.map(c =>
          c.id === connectionId
            ? { ...c, status: 'error' as const }
            : c
        ));
        alert(data.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('Error testing connection');
    }
  };

  const handleImportData = async () => {
    if (!selectedConnection) {
      alert('Please select a connection');
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch(`${BASE_URL}api_data_import.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'import_data',
          connection_id: selectedConnection,
          user_id: '1' // This should come from authentication context
        })
      });

      const data = await response.json();
      setImportResults(data);

      if (data.success) {
        alert(`Data import completed! Imported ${data.records_imported || 0} records.`);
      } else {
        alert(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error importing data');
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  return (
    <>
      <PageHeader
        items={[
          { label: 'Home', href: '/' },
          { label: 'API Data Import', href: '/api-data-import' }
        ]}
        heading="API Data Import"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API Connections */}
        <div className="lg:col-span-2 space-y-6">
          <CardWrapper title="API Connections">
            <div className="space-y-4">
              {connections.map((connection) => (
                <Card key={connection.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Database className="h-8 w-8 text-blue-500" />
                      <div>
                        <h3 className="font-semibold">{connection.name}</h3>
                        <p className="text-sm text-muted-foreground">{connection.endpoint}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusIcon(connection.status)}
                          {getStatusBadge(connection.status)}
                          <Badge variant="outline">{connection.dataType.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(connection.id)}
                      >
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedConnection(connection.id)}
                        disabled={connection.status !== 'connected'}
                      >
                        Select for Import
                      </Button>
                    </div>
                  </div>
                  {connection.lastSync && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last sync: {connection.lastSync}
                    </p>
                  )}
                </Card>
              ))}

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New API Connection
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create API Connection</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Connection Name</Label>
                      <Input
                        id="name"
                        value={newConnection.name}
                        onChange={(e) => setNewConnection({...newConnection, name: e.target.value})}
                        placeholder="e.g., Salesforce CRM"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endpoint">API Endpoint</Label>
                      <Input
                        id="endpoint"
                        value={newConnection.endpoint}
                        onChange={(e) => setNewConnection({...newConnection, endpoint: e.target.value})}
                        placeholder="https://api.example.com/v1/data"
                      />
                    </div>
                    <div>
                      <Label htmlFor="authType">Authentication Type</Label>
                      <Select
                        value={newConnection.authType}
                        onValueChange={(value: any) => setNewConnection({...newConnection, authType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {authTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {newConnection.authType !== 'none' && (
                      <div>
                        <Label htmlFor="authValue">
                          {newConnection.authType === 'api_key' && 'API Key'}
                          {newConnection.authType === 'bearer_token' && 'Bearer Token'}
                          {newConnection.authType === 'basic_auth' && 'Credentials (username:password)'}
                        </Label>
                        <Input
                          id="authValue"
                          type="password"
                          value={newConnection.authValue}
                          onChange={(e) => setNewConnection({...newConnection, authValue: e.target.value})}
                          placeholder="Enter authentication value"
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="dataType">Data Type</Label>
                      <Select
                        value={newConnection.dataType}
                        onValueChange={(value) => setNewConnection({...newConnection, dataType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dataTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreateConnection} className="w-full">
                      Create Connection
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardWrapper>
        </div>

        {/* Import Panel */}
        <div className="space-y-6">
          <CardWrapper title="Import Data">
            <div className="space-y-4">
              <div>
                <Label htmlFor="connection">Select API Connection</Label>
                <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a connection" />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.filter(c => c.status === 'connected').map((connection) => (
                      <SelectItem key={connection.id} value={connection.id}>
                        {connection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleImportData}
                disabled={!selectedConnection || isImporting}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing Data...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Import
                  </>
                )}
              </Button>
            </div>
          </CardWrapper>

          {/* Import Results */}
          {importResults && (
            <CardWrapper title="Import Results">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {importResults.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {importResults.success ? 'Import Successful' : 'Import Failed'}
                  </span>
                </div>
                {importResults.records_imported && (
                  <p className="text-sm text-muted-foreground">
                    Records imported: {importResults.records_imported}
                  </p>
                )}
                {importResults.message && (
                  <p className="text-sm text-muted-foreground">
                    {importResults.message}
                  </p>
                )}
              </div>
            </CardWrapper>
          )}

          {/* Quick Stats */}
          <CardWrapper title="Import Statistics">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Connections</span>
                <span className="font-medium">{connections.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Active Connections</span>
                <span className="font-medium text-green-600">
                  {connections.filter(c => c.status === 'connected').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Data Types</span>
                <span className="font-medium">{new Set(connections.map(c => c.dataType)).size}</span>
              </div>
            </div>
          </CardWrapper>
        </div>
      </div>
    </>
  );
};

export default ApiDataImport;