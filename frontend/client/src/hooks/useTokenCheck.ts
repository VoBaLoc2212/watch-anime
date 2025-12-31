import { useEffect } from "react";
import { useLocation } from "wouter";
import { checkTokenAndLogout } from "@/utils/tokenUtils";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to check token expiration on mount and periodically
 * Automatically redirects to login if token is expired
 */
export const useTokenCheck = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Check token immediately on mount
    const isValid = checkTokenAndLogout();
    
    if (!isValid) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please login again.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    // Check token every 60 seconds
    const interval = setInterval(() => {
      const isValid = checkTokenAndLogout();
      
      if (!isValid) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please login again.",
          variant: "destructive",
        });
        setLocation("/login");
      }
    }, 60000); // Check every 1 minute

    return () => clearInterval(interval);
  }, [setLocation, toast]);
};
