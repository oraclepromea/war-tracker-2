import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Bell, Globe, Palette, Database, Shield } from 'lucide-react';

interface SettingsData {
  notifications: boolean;
  theme: string;
  language: string;
  refreshInterval: number;
  autoSync: boolean;
  dataRetention: number;
}

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>({
    notifications: true,
    theme: 'system',
    language: 'en',
    refreshInterval: 30,
    autoSync: true,
    dataRetention: 30
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('war-tracker-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('war-tracker-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Enable notifications</Label>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) => updateSetting('notifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={settings.theme} onValueChange={(value) => updateSetting('theme', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language
            </CardTitle>
            <CardDescription>
              Choose your preferred language
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="uk">Українська</SelectItem>
                  <SelectItem value="ru">Русский</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data & Sync */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data & Sync
            </CardTitle>
            <CardDescription>
              Configure data refresh and storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refresh-interval">
                Refresh interval: {settings.refreshInterval} seconds
              </Label>
              <Slider
                id="refresh-interval"
                min={10}
                max={300}
                step={10}
                value={[settings.refreshInterval]}
                onValueChange={(value) => updateSetting('refreshInterval', value[0])}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-sync">Auto-sync data</Label>
              <Switch
                id="auto-sync"
                checked={settings.autoSync}
                onCheckedChange={(checked) => updateSetting('autoSync', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-retention">
                Data retention: {settings.dataRetention} days
              </Label>
              <Slider
                id="data-retention"
                min={7}
                max={90}
                step={1}
                value={[settings.dataRetention]}
                onValueChange={(value) => updateSetting('dataRetention', value[0])}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <Button onClick={saveSettings} className="px-8">
          {saved ? (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Saved!
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Notifications</Label>
              <Badge variant={settings.notifications ? "default" : "secondary"}>
                {settings.notifications ? "On" : "Off"}
              </Badge>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Theme</Label>
              <Badge variant="outline">{settings.theme}</Badge>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Language</Label>
              <Badge variant="outline">{settings.language.toUpperCase()}</Badge>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Auto-sync</Label>
              <Badge variant={settings.autoSync ? "default" : "secondary"}>
                {settings.autoSync ? "On" : "Off"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};