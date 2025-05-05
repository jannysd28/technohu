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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
                            <FileCode className="h-6 w-6 text-violet-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-lg font-medium text-gray-900">{request.title}</h4>
                          <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              request.status === "pending" 
                                ? "bg-yellow-100 text-yellow-800" 
                                : "bg-blue-100 text-blue-800"
                            }`}>
                              {request.status === "pending" ? "Pending" : "In Progress"}
                            </span>
                            <span className="ml-2 text-sm text-gray-500">Buyer: Buyer_{request.buyerId}</span>
                            <span className="ml-2 text-sm text-gray-500">Request ID: #{request.id}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-medium text-gray-900">${(request.price / 100).toFixed(2)}</span>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          {request.status === "accepted" && (
                            <Button 
                              onClick={() => {
                                // Handle file upload
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.onchange = async (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (!file) return;
                                  
                                  const formData = {
                                    requestId: request.id,
                                    sellerId: user!.id,
                                    buyerId: request.buyerId,
                                    fileName: file.name,
                                    filePath: `/uploads/${request.id}/${file.name}`,
                                    status: "pending"
                                  };
                                  
                                  try {
                                    await fetch('/api/uploads', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(formData)
                                    });
                                    toast({
                                      title: "Upload successful",
                                      description: "File has been uploaded for the request."
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Upload failed",
                                      description: (error as Error).message,
                                      variant: "destructive"
                                    });
                                  }
                                };
                                input.click();
                              }}
                              size="sm"
                              className="flex items-center"
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Upload Work
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>Total Earnings</CardTitle>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {completedRequests.length} Projects
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 mr-4">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      ${(totalEarnings / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">Total earnings from completed projects</div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    View Payment History
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>Daily Pitch Limit</CardTitle>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {dailyPitchCount}/{dailyPitchLimit} Used
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative pt-1">
                  <Progress value={pitchPercentage} className="h-2" />
                </div>
                <div className="mt-5">
                  <Button variant="outline" className="w-full">
                    <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                    Upgrade to Unlimited Pitches
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>New Buyer Requests</CardTitle>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    3 New
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Custom E-commerce API Integration</p>
                      <p className="text-xs text-gray-500 mt-1">$350 • 7 days ago</p>
                    </div>
                    <Button variant="secondary" size="sm">
                      View Details
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">PDF Generation Tool</p>
                      <p className="text-xs text-gray-500 mt-1">$180 • 3 days ago</p>
                    </div>
                    <Button variant="secondary" size="sm">
                      View Details
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Data Visualization Dashboard</p>
                      <p className="text-xs text-gray-500 mt-1">$275 • 1 day ago</p>
                    </div>
                    <Button variant="secondary" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
