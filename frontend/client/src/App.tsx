import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import WatchPage from "@/pages/WatchPage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import UserInformation from "@/pages/UserInformation";
import UploadAnime from "@/pages/UploadAnime";
import ManageAnime from "@/pages/ManageAnime";
import EditAnime from "@/pages/EditAnime";
import { useEffect } from "react";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,  // Cache trong 60 giây
      retry: 1,              // Retry khi lỗi
      refetchOnWindowFocus: false, // Không fetch lại khi chuyển tab
    }
  }
});
function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/">
        {() => (
          <Layout>
            <Dashboard />
          </Layout>
        )}
      </Route>
      <Route path="/dashboard">
        {() => (
          <Layout>
            <Dashboard />
          </Layout>
        )}
      </Route>
      <Route path="/watch">
        {() => (
          <Layout>
            <WatchPage />
          </Layout>
        )}
      </Route>
      <Route path="/user-information">
        {() => (
          <Layout>
            <UserInformation />
          </Layout>
        )}
      </Route>
      <Route path="/upload-anime">
        {() => (
          <Layout>
            <UploadAnime />
          </Layout>
        )}
      </Route>
      <Route path="/manage-anime">
        {() => (
          <Layout>
            <ManageAnime />
          </Layout>
        )}
      </Route>
      <Route path="/manage-anime/edit">
        {() => (
          <Layout>
            <EditAnime />
          </Layout>
        )}
      </Route>
      <Route>
        {() => (
          <Layout>
            <NotFound />
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  // Suppress runtime errors from showing on UI, only log to console
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Runtime error:", event.error);
      event.preventDefault();
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

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
