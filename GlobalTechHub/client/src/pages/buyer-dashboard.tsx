import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Request } from "@shared/schema";
import { FileCode, MessageSquare, Plus, DollarSign } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import RequestForm from "@/components/request-form";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ProjectWithSeller extends Request {
  sellerName: string;
}

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);

  // Fetch active requests
  const { data: requests = [], isLoading } = useQuery<ProjectWithSeller[]>({
    queryKey: ["/api/requests", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/requests?buyerId=${user?.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }
      
      const requests = await response.json();
      
      // In a real app, we would have relational data with user info
      // Here we're simulating it with mock seller names
      return requests.map((request: Request) => ({
        ...request,
        sellerName: `Seller_${request.sellerId}`,
      }));
    },
    enabled: !!user,
  });

  const activeRequests = requests.filter(req => req.status === "pending" || req.status === "accepted");
  const completedRequests = requests.filter(req => req.status === "completed" || req.status === "rejected");
  
  // Calculate total spent - in a real app, this would be a dedicated API endpoint
  // or done server-side for accuracy
  useEffect(() => {
    if (requests.length > 0) {
      const spent = requests.reduce((total, request) => {
        // Only count completed requests
        if (request.status === "completed") {
          return total + request.price;
        }
        return total;
      }, 0);
      setTotalSpent(spent);
    }
  }, [requests]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-slate-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Buyer Dashboard
              </h2>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Button onClick={() => setIsRequestFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Browse Seller Uploads
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>Total Spent</CardTitle>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {completedRequests.length} Projects
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 mr-4">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      ${(totalSpent / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">Total spent on completed projects</div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    View Payment History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  My Active Jobs
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Track your active job requests and purchases.
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
              {isLoading ? (
                <div className="px-4 py-5 sm:p-6 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : activeRequests.length === 0 ? (
                <div className="px-4 py-10 sm:p-6 text-center">
                  <h4 className="text-lg font-medium text-gray-900">No active jobs</h4>
                  <p className="mt-1 text-gray-500">You don't have any active job requests.</p>
                  <Button 
                    onClick={() => setIsRequestFormOpen(true)}
                    className="mt-4"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create a Request
                  </Button>
                </div>
              ) : (
                activeRequests.map(request => (
                  <div key={request.id} className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <FileCode className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-lg font-medium text-gray-900">{request.title}</h4>
                          <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              request.status === "pending" 
                                ? "bg-yellow-100 text-yellow-800" 
                                : "bg-green-100 text-green-800"
                            }`}>
                              {request.status === "pending" ? "Pending" : "In Progress"}
                            </span>
                            <span className="ml-2 text-sm text-gray-500">Seller: {request.sellerName}</span>
                            <span className="ml-2 text-sm text-gray-500">Request ID: #{request.id}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-medium text-gray-900">${(request.price / 100).toFixed(2)}</span>
                        <Button variant="outline" size="sm" className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {completedRequests.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Completed Jobs
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Your past job requests and purchases.
                </p>
              </div>
              
              <div className="border-t border-gray-200 divide-y divide-gray-200">
                {completedRequests.map(request => (
                  <div key={request.id} className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                            <FileCode className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-lg font-medium text-gray-900">{request.title}</h4>
                          <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              request.status === "completed" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {request.status === "completed" ? "Completed" : "Rejected"}
                            </span>
                            <span className="ml-2 text-sm text-gray-500">Seller: {request.sellerName}</span>
                            <span className="ml-2 text-sm text-gray-500">Request ID: #{request.id}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-medium text-gray-900">${(request.price / 100).toFixed(2)}</span>
                        {request.status === "completed" && (
                          <Button variant="outline" size="sm">
                            Leave Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Dialog open={isRequestFormOpen} onOpenChange={setIsRequestFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create a Custom Request</DialogTitle>
            <DialogDescription>
              Describe your project requirements and set a budget for potential sellers.
            </DialogDescription>
          </DialogHeader>
          <RequestForm onComplete={() => setIsRequestFormOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
