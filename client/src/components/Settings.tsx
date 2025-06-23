import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Bell, Globe, Palette, Database, Shield } from 'lucide-react';

interface SettingsData {
  notifications: boolean;
  theme: string;
  language: string;
  refreshInterval: number;
  autoSync: boolean;
  dataRetention: number;
}

// Simple UI components to replace missing shadcn components
const Switch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) => (
  <button
    onClick={() => onCheckedChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-blue-600' : 'bg-gray-600'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const Label = ({ children, htmlFor, className }: { children: React.ReactNode; htmlFor?: string; className?: string }) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium text-tactical-text ${className || ''}`}>
    {children}
  </label>
);

const Select = ({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode }) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    className="bg-tactical-panel border border-tactical-border rounded px-3 py-2 text-tactical-text"
  >
    {children}
  </select>
);

const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <option value={value}>{children}</option>
);

const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const SelectTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const SelectValue = ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>;

const Slider = ({ value, onValueChange, min, max, step }: { 
  value: number[]; 
  onValueChange: (value: number[]) => void; 
  min: number; 
  max: number; 
  step: number; 
}) => (
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={value[0]}
    onChange={(e) => onValueChange([Number(e.target.value)])}
    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
  />
);

const Badge = ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    variant === 'destructive' ? 'bg-red-100 text-red-800' : 
    variant === 'secondary' ? 'bg-gray-100 text-gray-800' :
    variant === 'outline' ? 'bg-transparent border border-gray-300 text-gray-700' :
    'bg-blue-100 text-blue-800'
  }`}>
    {children}
  </span>
);

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

  const handleNotificationsChange = (checked: boolean) => {
    updateSetting('notifications', checked);
  };

  const handleThemeChange = (value: string) => {
    updateSetting('theme', value);
  };

  const handleLanguageChange = (value: string) => {
    updateSetting('language', value);
  };

  const handleRefreshIntervalChange = (value: number[]) => {
    updateSetting('refreshInterval', value[0]);
  };

  const handleAutoSyncChange = (checked: boolean) => {
    updateSetting('autoSync', checked);
  };

  const handleDataRetentionChange = (value: number[]) => {
    updateSetting('dataRetention', value[0]);
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
                checked={settings.notifications}
                onCheckedChange={handleNotificationsChange}
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
              <Select value={settings.theme} onValueChange={handleThemeChange}>
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
              <Select value={settings.language} onValueChange={handleLanguageChange}>
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
                min={10}
                max={300}
                step={10}
                value={[settings.refreshInterval]}
                onValueChange={handleRefreshIntervalChange}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-sync">Auto-sync data</Label>
              <Switch
                checked={settings.autoSync}
                onCheckedChange={handleAutoSyncChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-retention">
                Data retention: {settings.dataRetention} days
              </Label>
              <Slider
                min={7}
                max={90}
                step={1}
                value={[settings.dataRetention]}
                onValueChange={handleDataRetentionChange}
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