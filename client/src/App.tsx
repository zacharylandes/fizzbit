import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import SavedPage from "@/pages/saved";
import SettingsPage from "@/pages/settings";
import HistoryPage from "@/pages/history";
import LandingPage from "@/pages/landing";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={LandingPage} />
          <Route path="/saved" component={LandingPage} />
          <Route path="/settings" component={LandingPage} />
          <Route path="/history" component={LandingPage} />
          <Route component={LandingPage} />
        </>
      ) : (
        <Layout>
          <Route path="/" component={HomePage} />
          <Route path="/saved" component={SavedPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/history" component={HistoryPage} />
          <Route component={NotFound} />
        </Layout>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
