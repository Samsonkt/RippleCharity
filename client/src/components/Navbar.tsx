import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [location, setLocation] = useLocation();
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
  
  const isActive = (path: string) => location === path;
  
  const handleTabClick = (path: string) => {
    setLocation(path);
  };
  
  return (
    <div className="flex border-b border-neutral-200 mb-6">
      <button 
        onClick={() => handleTabClick('/dashboard')} 
        className={`mr-6 pb-3 px-1 font-medium ${
          isActive('/dashboard') 
            ? 'tab-active text-primary' 
            : 'text-neutral-600 hover:text-neutral-800'
        }`}
      >
        Dashboard
      </button>
      
      <button 
        onClick={() => handleTabClick('/channels')} 
        className={`mr-6 pb-3 px-1 font-medium ${
          isActive('/channels') 
            ? 'tab-active text-primary' 
            : 'text-neutral-600 hover:text-neutral-800'
        }`}
      >
        Channels
      </button>
      
      <button 
        onClick={() => handleTabClick('/boosting')} 
        className={`mr-6 pb-3 px-1 font-medium ${
          isActive('/boosting') 
            ? 'tab-active text-primary' 
            : 'text-neutral-600 hover:text-neutral-800'
        }`}
      >
        Boosting
      </button>
      
      <button 
        onClick={() => handleTabClick('/settings')} 
        className={`mr-6 pb-3 px-1 font-medium ${
          isActive('/settings') 
            ? 'tab-active text-primary' 
            : 'text-neutral-600 hover:text-neutral-800'
        }`}
      >
        Settings
      </button>
      
      <div className="ml-auto flex items-center">
        {user && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatarUrl} alt={user.username} />
            <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
          </Avatar>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .tab-active {
          position: relative;
        }
        .tab-active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: currentColor;
          border-radius: 2px;
        }
      `}} />
    </div>
  );
}
