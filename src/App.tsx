import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import FullScreenMedical from "./pages/FullScreenMedical";
import DraggableInterface from "./pages/DraggableInterface";
import NotFound from "./pages/NotFound";
import VirtualAssistant from "./components/VirtualAssistant";
import { tokenService } from "./services/tokenService";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Fetch token on app load
    const fetchToken = async () => {
      try {
        const token = await tokenService.getTokenOnLoad();
        console.log("Token fetched successfully:", token ? "Yes" : "No");
      } catch (error) {
        console.error("Failed to fetch token:", error);
      }
    };
    
    fetchToken();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner position="top-right" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DraggableInterface />} />
            <Route path="/index" element={<Index />} />
            <Route path="/medical" element={<FullScreenMedical />} />
            <Route path="/draggable" element={<DraggableInterface />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
