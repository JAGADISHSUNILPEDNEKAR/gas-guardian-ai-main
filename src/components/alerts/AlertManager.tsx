import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Bell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAlerts } from '@/hooks/useAlerts';

export function AlertManager() {
  const { alerts, loading, createAlert, deleteAlert } = useAlerts();
  const [isCreating, setIsCreating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    alertType: 'gas_price',
    condition: {
      type: 'gas_price' as 'gas_price' | 'asset_price' | 'congestion',
      operator: 'lt' as 'lt' | 'lte' | 'gt' | 'gte' | 'eq',
      value: 20,
    },
    notificationChannels: {
      browser: true,
      email: false,
      telegram: false,
      discord: false,
    },
  });

  const handleCreate = async () => {
    try {
      await createAlert(newAlert.alertType, newAlert.condition, newAlert.notificationChannels);
      setIsCreating(false);
      setNewAlert({
        alertType: 'gas_price',
        condition: {
          type: 'gas_price',
          operator: 'lt',
          value: 20,
        },
        notificationChannels: {
          browser: true,
          email: false,
          telegram: false,
          discord: false,
        },
      });
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Failed to create alert');
    }
  };

  const handleDelete = async (alertId: string) => {
    if (confirm('Are you sure you want to delete this alert?')) {
      try {
        await deleteAlert(alertId);
      } catch (error) {
        console.error('Error deleting alert:', error);
        alert('Failed to delete alert');
      }
    }
  };

  const getConditionText = (condition: any) => {
    const typeLabels: Record<string, string> = {
      gas_price: 'Gas Price',
      asset_price: 'FLR Price',
      congestion: 'Network Congestion',
    };
    const operatorLabels: Record<string, string> = {
      lt: '<',
      lte: '≤',
      gt: '>',
      gte: '≥',
      eq: '=',
    };
    return `${typeLabels[condition.type] || condition.type} ${operatorLabels[condition.operator] || condition.operator} ${condition.value}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Alert Manager</CardTitle>
            <CardDescription>Set up notifications for optimal gas conditions</CardDescription>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Alert</DialogTitle>
                <DialogDescription>
                  Get notified when gas conditions meet your criteria
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Alert Type</Label>
                  <Select
                    value={newAlert.alertType}
                    onValueChange={(value) =>
                      setNewAlert({
                        ...newAlert,
                        alertType: value,
                        condition: {
                          ...newAlert.condition,
                          type: value as any,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gas_price">Gas Price</SelectItem>
                      <SelectItem value="asset_price">Asset Price</SelectItem>
                      <SelectItem value="congestion">Network Congestion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Condition</Label>
                  <div className="flex gap-2">
                    <Select
                      value={newAlert.condition.operator}
                      onValueChange={(value) =>
                        setNewAlert({
                          ...newAlert,
                          condition: { ...newAlert.condition, operator: value as any },
                        })
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lt">&lt;</SelectItem>
                        <SelectItem value="lte">≤</SelectItem>
                        <SelectItem value="gt">&gt;</SelectItem>
                        <SelectItem value="gte">≥</SelectItem>
                        <SelectItem value="eq">=</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={newAlert.condition.value}
                      onChange={(e) =>
                        setNewAlert({
                          ...newAlert,
                          condition: {
                            ...newAlert.condition,
                            value: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notification Channels</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="browser">Browser</Label>
                      <Switch
                        id="browser"
                        checked={newAlert.notificationChannels.browser}
                        onCheckedChange={(checked) =>
                          setNewAlert({
                            ...newAlert,
                            notificationChannels: {
                              ...newAlert.notificationChannels,
                              browser: checked,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email">Email</Label>
                      <Switch
                        id="email"
                        checked={newAlert.notificationChannels.email}
                        onCheckedChange={(checked) =>
                          setNewAlert({
                            ...newAlert,
                            notificationChannels: {
                              ...newAlert.notificationChannels,
                              email: checked,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleCreate} className="w-full">
                  Create Alert
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No alerts configured</p>
            <p className="text-sm">Create your first alert to get notified about optimal gas conditions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{alert.alertType}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {getConditionText(alert.condition)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Triggered {alert.triggerCount} time{alert.triggerCount !== 1 ? 's' : ''}
                    {alert.lastTriggeredAt &&
                      ` • Last: ${new Date(alert.lastTriggeredAt).toLocaleString()}`}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(alert.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

