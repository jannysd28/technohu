import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { User, Project, Request } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Users, ShoppingBag, Code, DollarSign, Book, Star, Shield, LineChart, Settings, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access the admin dashboard.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === "admin",
  });

  // Fetch all projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: user?.role === "admin",
  });

  // Fetch all requests
  const { data: requests = [], isLoading: requestsLoading } = useQuery<Request[]>({
    queryKey: ["/api/requests"],
    enabled: user?.role === "admin",
  });

  // Mutation for verifying a seller
  const verifySellerMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/verify`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Seller Verified",
        description: "The seller has been successfully verified.",
      });
      setVerifyDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pendingVerificationSellers = users.filter(
    (user) => user.role === "seller" && user.status !== "verified"
  );

  const totalVerifiedSellers = users.filter(
    (user) => user.role === "seller" && user.status === "verified"
  ).length;

  const totalPendingRequests = requests.filter(
    (request) => request.status === "pending"
  ).length;

  const totalCompletedProjects = requests.filter(
    (request) => request.status === "completed"
  ).length;

  const totalRevenueInCents = requests
    .filter((request) => request.status === "completed")
    .reduce((sum, request) => sum + request.price, 0);

  const openVerifyDialog = (user: User) => {
    setSelectedUser(user);
    setVerifyDialogOpen(true);
  };

  const handleVerifySeller = () => {
    if (selectedUser) {
      verifySellerMutation.mutate(selectedUser.id);
    }
  };

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-slate-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Admin Dashboard
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage users, monitor activity, and oversee platform operations.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-500 mr-3" />
                  <div className="text-3xl font-bold">{users.length}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Verified Sellers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                  <div className="text-3xl font-bold">{totalVerifiedSellers}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Pending Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Book className="h-8 w-8 text-amber-500 mr-3" />
                  <div className="text-3xl font-bold">{totalPendingRequests}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-500 mr-3" />
                  <div className="text-3xl font-bold">${(totalRevenueInCents / 100).toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="verification" className="mb-8">
            <TabsList className="mb-6">
              <TabsTrigger value="verification">
                <CheckCircle className="w-4 h-4 mr-2" />
                Seller Verification
              </TabsTrigger>
              <TabsTrigger value="projects">
                <Code className="w-4 h-4 mr-2" />
                Content Oversight
              </TabsTrigger>
              <TabsTrigger value="transactions">
                <DollarSign className="w-4 h-4 mr-2" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <LineChart className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="w-4 h-4 mr-2" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Platform Config
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="verification">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Verification Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingVerificationSellers.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No pending verification requests
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingVerificationSellers.map((seller) => (
                        <div key={seller.id} className="flex justify-between items-center p-4 bg-white rounded-lg border">
                          <div>
                            <p className="font-medium">{seller.name}</p>
                            <p className="text-sm text-gray-500">{seller.email}</p>
                            <p className="text-xs text-gray-400 mt-1">Joined: {new Date(seller.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Button 
                            onClick={() => openVerifyDialog(seller)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            Verify Seller
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <CardTitle>Content Oversight</CardTitle>
                  <CardDescription>
                    Monitor and manage uploaded projects and scripts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6 mb-8">
                    <div className="border rounded-lg p-4 bg-white flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <h3 className="text-lg font-medium">Security Monitoring</h3>
                      </div>
                      <div className="space-y-2">
                        <p className="flex justify-between text-sm">
                          <span>Virus Scan Status:</span>
                          <Badge className="bg-green-500">All Clear</Badge>
                        </p>
                        <p className="flex justify-between text-sm">
                          <span>Last Full Scan:</span>
                          <span className="font-medium">Today, 4:30 AM</span>
                        </p>
                        <p className="flex justify-between text-sm">
                          <span>Code Sandbox Status:</span>
                          <Badge className="bg-green-500">Active</Badge>
                        </p>
                        <div className="mt-4">
                          <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600">
                            Initiate Security Scan
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 bg-white flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <Shield className="h-5 w-5 text-blue-500" />
                        <h3 className="text-lg font-medium">Guidelines Monitoring</h3>
                      </div>
                      <div className="space-y-2">
                        <p className="flex justify-between text-sm">
                          <span>Flagged Content:</span>
                          <Badge className="bg-green-500">None</Badge>
                        </p>
                        <p className="flex justify-between text-sm">
                          <span>Content Awaiting Review:</span>
                          <span className="font-medium">{projects.length} Projects</span>
                        </p>
                        <p className="flex justify-between text-sm">
                          <span>Rejected Content:</span>
                          <span className="font-medium">0 Projects</span>
                        </p>
                        <div className="mt-4">
                          <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600">
                            Update Guidelines
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium">All Projects</h3>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-500">Active</Badge>
                      <Badge className="bg-amber-500">Pending Review</Badge>
                      <Badge className="bg-red-500">Flagged</Badge>
                    </div>
                  </div>
                  
                  {projects.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No projects available
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((project) => {
                        const seller = users.find(u => u.id === project.sellerId);
                        return (
                          <div key={project.id} className="flex justify-between items-center p-4 bg-white rounded-lg border">
                            <div>
                              <div className="flex items-center">
                                <p className="font-medium mr-2">{project.title}</p>
                                <Badge className="bg-green-500">Active</Badge>
                              </div>
                              <p className="text-sm text-gray-500">
                                Seller: {seller?.name || 'Unknown'} • Type: {project.projectType}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                ${(project.price / 100).toFixed(2)} • 
                                {new Date(project.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                View Code
                              </Button>
                              <Button size="sm" variant="outline" className="text-amber-500 border-amber-500 hover:bg-amber-50">
                                Flag
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle>All Buyer Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {requests.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No requests available
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requests.map((request) => {
                        const buyer = users.find(u => u.id === request.buyerId);
                        const seller = users.find(u => u.id === request.sellerId);
                        return (
                          <div key={request.id} className="flex justify-between items-center p-4 bg-white rounded-lg border">
                            <div>
                              <p className="font-medium">{request.title}</p>
                              <p className="text-sm text-gray-500">
                                Buyer: {buyer?.name || 'Unknown'} • 
                                Seller: {seller?.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                ${(request.price / 100).toFixed(2)} • 
                                {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge 
                              className={
                                request.status === 'completed' ? 'bg-green-500' :
                                request.status === 'pending' ? 'bg-amber-500' :
                                request.status === 'accepted' ? 'bg-blue-500' : 'bg-red-500'
                              }
                            >
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Management</CardTitle>
                  <CardDescription>
                    View and manage all financial transactions on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="border rounded-lg p-4 bg-white">
                      <h3 className="text-lg font-medium mb-2">Commission Revenue</h3>
                      <p className="text-3xl font-bold text-green-600">
                        ${((totalRevenueInCents * 0.1) / 100).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">10% of all transactions</p>
                    </div>
                    <div className="border rounded-lg p-4 bg-white">
                      <h3 className="text-lg font-medium mb-2">Completed Transactions</h3>
                      <p className="text-3xl font-bold text-blue-600">{totalCompletedProjects}</p>
                      <p className="text-sm text-gray-500 mt-1">Successfully completed projects</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Recent Transactions</h3>
                    {requests.filter(r => r.status === 'completed').slice(0, 5).map((request) => {
                      const buyer = users.find(u => u.id === request.buyerId);
                      const seller = users.find(u => u.id === request.sellerId);
                      return (
                        <div key={request.id} className="flex justify-between items-center p-4 bg-white rounded-lg border">
                          <div>
                            <p className="font-medium">{request.title}</p>
                            <p className="text-sm">
                              <span className="text-gray-500">Buyer:</span> {buyer?.name || 'Unknown'} • 
                              <span className="text-gray-500">Seller:</span> {seller?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              ${(request.price / 100).toFixed(2)} • 
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <Badge className="bg-green-500 mb-1">Completed</Badge>
                            <p className="text-xs text-green-600">Commission: ${(request.price * 0.1 / 100).toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Analytics</CardTitle>
                  <CardDescription>
                    Key metrics and insights about platform performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="border rounded-lg p-4 bg-white">
                      <h3 className="text-sm font-medium text-gray-500">Users</h3>
                      <p className="text-2xl font-bold">{users.length}</p>
                      <div className="flex items-center text-sm mt-2">
                        <Users className="w-4 h-4 mr-1 text-blue-500" />
                        <p>Total registered users</p>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 bg-white">
                      <h3 className="text-sm font-medium text-gray-500">Projects</h3>
                      <p className="text-2xl font-bold">{projects.length}</p>
                      <div className="flex items-center text-sm mt-2">
                        <Code className="w-4 h-4 mr-1 text-blue-500" />
                        <p>Available in marketplace</p>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 bg-white">
                      <h3 className="text-sm font-medium text-gray-500">Transactions</h3>
                      <p className="text-2xl font-bold">{totalCompletedProjects}</p>
                      <div className="flex items-center text-sm mt-2">
                        <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                        <p>Completed purchases</p>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 bg-white">
                      <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
                      <p className="text-2xl font-bold">${(totalRevenueInCents / 100).toFixed(2)}</p>
                      <div className="flex items-center text-sm mt-2">
                        <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                        <p>Total transaction value</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h3 className="text-lg font-medium mb-4">Revenue Breakdown</h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Scripts', value: totalRevenueInCents * 0.3 / 100 },
                            { name: 'Applications', value: totalRevenueInCents * 0.4 / 100 },
                            { name: 'APIs', value: totalRevenueInCents * 0.15 / 100 },
                            { name: 'Other', value: totalRevenueInCents * 0.15 / 100 },
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']} />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Configuration</CardTitle>
                  <CardDescription>
                    Manage platform settings and feature toggles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Feature Toggles</h3>
                      <div className="border rounded-lg divide-y">
                        <div className="flex justify-between items-center p-4">
                          <div>
                            <p className="font-medium">User Registration</p>
                            <p className="text-sm text-gray-500">Allow new users to register on the platform</p>
                          </div>
                          <Switch checked={true} />
                        </div>
                        <div className="flex justify-between items-center p-4">
                          <div>
                            <p className="font-medium">Project Uploads</p>
                            <p className="text-sm text-gray-500">Allow sellers to upload new projects</p>
                          </div>
                          <Switch checked={true} />
                        </div>
                        <div className="flex justify-between items-center p-4">
                          <div>
                            <p className="font-medium">Automatic Verification</p>
                            <p className="text-sm text-gray-500">Auto-verify sellers with GitHub connections</p>
                          </div>
                          <Switch checked={false} />
                        </div>
                        <div className="flex justify-between items-center p-4">
                          <div>
                            <p className="font-medium">Maintenance Mode</p>
                            <p className="text-sm text-gray-500">Put the platform in maintenance mode</p>
                          </div>
                          <Switch checked={false} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Platform Settings</h3>
                      <div className="border rounded-lg divide-y">
                        <div className="p-4">
                          <p className="font-medium">Commission Rate</p>
                          <p className="text-sm text-gray-500 mb-2">Platform fee percentage on transactions</p>
                          <div className="flex items-center">
                            <p className="text-xl font-bold">10%</p>
                            <Button className="ml-2" variant="outline" size="sm">Change</Button>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="font-medium">Default Language</p>
                          <p className="text-sm text-gray-500 mb-2">Platform default display language</p>
                          <div className="flex items-center">
                            <p className="text-xl font-bold">English</p>
                            <Button className="ml-2" variant="outline" size="sm">Change</Button>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="font-medium">Security Settings</p>
                          <p className="text-sm text-gray-500 mb-2">Configure platform security options</p>
                          <Button variant="outline">Security Configuration</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    View and manage all users registered on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {users.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No users available
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {users.map((user) => (
                        <div key={user.id} className="flex justify-between items-center p-4 bg-white rounded-lg border">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Joined: {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center space-x-2">
                              <Badge 
                                className={
                                  user.role === 'admin' ? 'bg-purple-500' :
                                  user.role === 'seller' ? 'bg-blue-500' :
                                  user.role === 'buyer' ? 'bg-green-500' : 'bg-gray-500'
                                }
                              >
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </Badge>
                              {user.status === 'verified' && (
                                <Badge className="bg-green-500">Verified</Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">Edit</Button>
                              {user.role !== 'admin' && (
                                <Button size="sm" variant="destructive">Suspend</Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
      
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Seller</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to verify {selectedUser?.name} as a seller?</p>
            <p className="text-sm text-gray-500 mt-2">
              This will grant them permission to upload and sell projects on the platform.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleVerifySeller} 
              className="bg-green-500 hover:bg-green-600"
              disabled={verifySellerMutation.isPending}
            >
              {verifySellerMutation.isPending ? 'Verifying...' : 'Verify Seller'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}