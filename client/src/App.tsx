import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Channels from "@/pages/Channels";
import Boosting from "@/pages/Boosting";
import Settings from "@/pages/Settings";
import Donate from "@/pages/Donate";
import ContentCalendar from "@/pages/ContentCalendar";
import Recommendations from "@/pages/Recommendations";
import GeoAnalytics from "@/pages/GeoAnalytics";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/Navbar";
import { BoosterProvider } from "./contexts/BoosterContext";

// Simplified App component to avoid circular dependencies
function App() {
  // Check if user exists in localStorage
  const userString = localStorage.getItem("user");
  const isAuthenticated = !!userString;
  
  // Simple Auth UI when not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Auth />
        <Toaster />
      </>
    );
  }
  
  // Main UI when authenticated
  return (
    <>
      <BoosterProvider>
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Navbar />
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/channels" component={Channels} />
            <Route path="/boosting" component={Boosting} />
            <Route path="/calendar" component={ContentCalendar} />
            <Route path="/recommendations" component={Recommendations} />
            <Route path="/analytics" component={GeoAnalytics} />
            <Route path="/settings" component={Settings} />
            <Route path="/donate/:channelId">
              {(params) => <Donate params={params} />}
            </Route>
            <Route component={NotFound} />
          </Switch>
        </div>
      </BoosterProvider>
      <Toaster />
    </>
  );
}

export default App;
