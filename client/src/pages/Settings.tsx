import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const [user, setUser] = useState<any>(null);
  
  // Get user from localStorage
  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        setUser(JSON.parse(userString));
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }
  }, []);
  
  // Simple sign out function
  const signOut = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    autoStart: false,
    quality: "480p",
    volume: 0.1,
    boostWhileBrowsing: true,
    collectAnalytics: true,
    showDonation: true
  });
  
  const handleToggle = (setting: string) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };
  
  const handleVolumeChange = (value: number[]) => {
    setSettings(prev => ({
      ...prev,
      volume: value[0]
    }));
  };
  
  const handleQualityChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      quality: value
    }));
  };
  
  const handleSaveSettings = () => {
    // Save settings logic would go here
    alert('Settings saved successfully!');
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold text-neutral-800 mb-6">Settings</h2>
      
      {/* User Profile */}
      <div className="flex items-center pb-6 border-b border-neutral-200">
        <Avatar className="w-12 h-12">
          <AvatarImage src={user?.avatarUrl} alt={user?.username} />
          <AvatarFallback>{user?.username?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="ml-4">
          <div className="font-medium text-neutral-800">{user?.email}</div>
          <div className="text-sm text-neutral-600">Signed in with Google</div>
        </div>
        <button 
          className="ml-auto text-sm text-red-500 hover:text-red-600"
          onClick={signOut}
        >
          Sign Out
        </button>
      </div>
      
      {/* General Settings */}
      <div className="py-6 border-b border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-800 mb-4">General Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium text-neutral-700">Dark Mode</Label>
              <p className="text-sm text-neutral-600">Switch between light and dark themes</p>
            </div>
            <Switch 
              checked={settings.darkMode} 
              onCheckedChange={() => handleToggle('darkMode')} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium text-neutral-700">Notifications</Label>
              <p className="text-sm text-neutral-600">Receive updates about your boosting activity</p>
            </div>
            <Switch 
              checked={settings.notifications} 
              onCheckedChange={() => handleToggle('notifications')} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium text-neutral-700">Auto-Start Boosting</Label>
              <p className="text-sm text-neutral-600">Resume boosting automatically on browser start</p>
            </div>
            <Switch 
              checked={settings.autoStart} 
              onCheckedChange={() => handleToggle('autoStart')} 
            />
          </div>
        </div>
      </div>
      
      {/* Boosting Preferences */}
      <div className="py-6 border-b border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-800 mb-4">Boosting Preferences</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-medium text-neutral-700">Default Playback Quality</Label>
            <Select 
              defaultValue={settings.quality} 
              onValueChange={handleQualityChange}
            >
              <SelectTrigger className="w-full bg-neutral-100 border border-neutral-300">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="240p">240p (Lowest)</SelectItem>
                <SelectItem value="480p">480p (Recommended)</SelectItem>
                <SelectItem value="720p">720p (HD)</SelectItem>
                <SelectItem value="1080p">1080p (Full HD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="font-medium text-neutral-700">Default Volume Level</Label>
            <Slider 
              min={0} 
              max={1} 
              step={0.01} 
              value={[settings.volume]} 
              onValueChange={handleVolumeChange}
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>Mute</span>
              <span>{Math.round(settings.volume * 100)}%</span>
              <span>Max</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="boost-while-browsing" 
              checked={settings.boostWhileBrowsing} 
              onCheckedChange={() => handleToggle('boostWhileBrowsing')} 
            />
            <Label htmlFor="boost-while-browsing">Continue boosting while browsing other sites</Label>
          </div>
        </div>
      </div>
      
      {/* Data & Privacy */}
      <div className="py-6">
        <h3 className="text-lg font-medium text-neutral-800 mb-4">Data & Privacy</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="collect-analytics" 
              checked={settings.collectAnalytics} 
              onCheckedChange={() => handleToggle('collectAnalytics')} 
            />
            <Label htmlFor="collect-analytics">Allow anonymous usage statistics</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-donation" 
              checked={settings.showDonation} 
              onCheckedChange={() => handleToggle('showDonation')} 
            />
            <Label htmlFor="show-donation">Show donation prompts</Label>
          </div>
          
          <div className="mt-4">
            <Button 
              variant="link"
              className="p-0 text-primary hover:text-blue-600 text-sm font-medium"
            >
              Export My Data
            </Button>
            <Button 
              variant="link"
              className="p-0 text-red-500 hover:text-red-600 text-sm font-medium ml-4"
            >
              Delete All Data
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <Button 
          onClick={handleSaveSettings}
          className="bg-primary hover:bg-blue-500"
        >
          Save Settings
        </Button>
        <Button 
          variant="outline"
          className="ml-3 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
        >
          Cancel
        </Button>
      </div>
      
      {/* About Section */}
      <Separator className="my-6" />
      
      <div>
        <h3 className="text-lg font-medium text-neutral-800 mb-4">About CharityViewBooster</h3>
        <p className="text-neutral-600 text-sm mb-4">
          CharityViewBooster is a free application that helps charity YouTube channels increase their visibility by boosting view counts.
          By allowing this application to play videos in the background, you're helping worthy causes gain more exposure.
        </p>
        <div className="flex items-center text-sm text-neutral-600 mb-4">
          <span className="mr-4">Version 1.0.0</span>
          <a href="#" className="text-primary hover:text-blue-600">Check for Updates</a>
        </div>
        <div className="flex space-x-4">
          <a href="#" className="text-primary hover:text-blue-600 text-sm">Privacy Policy</a>
          <a href="#" className="text-primary hover:text-blue-600 text-sm">Terms of Service</a>
          <a href="#" className="text-primary hover:text-blue-600 text-sm">Help & Support</a>
        </div>
      </div>
    </div>
  );
}
