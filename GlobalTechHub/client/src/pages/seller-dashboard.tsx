import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Request, Pitch } from "@shared/schema";
import { FileCode, MessageSquare, Crown, Upload, DollarSign, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SellerDashboard() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  // Fetch active requests where user is seller
  const { data: requests = [], isLoading: requestsLoading } = useQuery<Request[]>({
    queryKey: ["/api/requests", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/requests?sellerId=${user?.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch daily pitches (in a real app would be since today's date)
  const { data: pitches = [], isLoading: pitchesLoading } = useQuery<Pitch[]>({
    queryKey: ["/api/pitches", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/pitches?sellerId=${user?.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch pitches");
      }
      return response.json();
    },
    enabled: !!user,
  });

  const activeRequests = requests.filter(req => req.status === "pending" || req.status === "accepted");
  const completedRequests = requests.filter(req => req.status === "completed");
  const dailyPitchCount = pitches.length; // In a real app, filter by date
  const dailyPitchLimit = 5;
  const pitchPercentage = (dailyPitchCount / dailyPitchLimit) * 100;
  
  // Calculate total earnings in cents
  const totalEarnings = completedRequests.reduce((total, request) => {
    return total + request.price;
  }, 0);
  
  // Check if seller is verified (in a real app, this would be a property on the user object)
  const isVerifiedSeller = user?.status === "verified";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-slate-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

          {/* Seller Profile Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6 flex items-center space-x-4">
              <img 
                src={user?.avatar || "/default-avatar.png"} 
                alt="Profile Avatar" 
                className="w-16 h-16 rounded-full border border-gray-200"
              />
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">{user?.name}</h3>
                <p className="text-sm text-gray-500">{user?.profession}</p>
              </div>
            </div>
          </div>

          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Seller Dashboard
              </h2>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              {isVerifiedSeller ? (
                <Button onClick={() => navigate("/upload-project")}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New Project
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  <Upload className="mr-2 h-4 w-4" />
                  Verification Required
                </Button>
              )}
            </div>
          </div>
          
          {/* The rest of the Seller Dashboard content */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  My Active Work
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Track your current projects and requests.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <span className="text-xl font-bold text-gray-900">{activeRequests.length}</span>
                  <span className="ml-1 text-sm text-gray-500">Active</span>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="flex items-center">
                  <span className="text-xl font-bold text-gray-900">{requests.length}</span>
                  <span className="ml-1 text-sm text-gray-500">Total</span>
                </div>
              </div>
            </div>
            
            {/* Active Requests */}
            <div className="border-t border-gray-200 divide-y divide-gray-200">
              {requestsLoading ? (
                <div className="px-4 py-5 sm:p-6 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : activeRequests.length === 0 ? (
                <div className="px-4 py-10 sm:p-6 text-center">
                  <h4 className="text-lg font-medium text-gray-900">No active work</h4>
                  <p className="mt-1 text-gray-500">You don't have any active projects or requests.</p>
                  <Button 
                    onClick={() => navigate("/marketplace")}
                    className="mt-4"
                    variant="outline"
                  >
                    Browse Buyer Requests
                  </Button>
                </div>
              ) : (
                activeRequests.map(request => (
                  <div key={request.id} className="px-4 py-5 sm:p-6">
                    {/* Active Request Display */}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Additional Cards for Earnings, Pitches, etc. */}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
