import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { User, Project, Rating } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import RequestForm from "@/components/request-form";
import { useState } from "react";
import { 
  Star, 
  StarHalf, 
  MessageSquare, 
  FileCode, 
  Clock, 
  Code, 
  Terminal, 
  Laptop, 
  Server,
  Download,
  ExternalLink,
  Play
} from "lucide-react";

export default function SellerProfile() {
  const params = useParams<{ id: string }>();
  const sellerId = parseInt(params.id);
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  
  // Fetch seller profile
  const { data: seller, isLoading: isSellerLoading } = useQuery<User>({
    queryKey: [`/api/users/${sellerId}`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${sellerId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch seller profile");
      }
      return res.json();
    },
  });
  
  // Fetch seller projects
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: [`/api/projects`, sellerId],
    queryFn: async () => {
      const res = await fetch(`/api/projects?sellerId=${sellerId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch seller projects");
      }
      return res.json();
    },
  });
  
  // Fetch seller ratings
  const { data: ratings = [], isLoading: isRatingsLoading } = useQuery<Rating[]>({
    queryKey: [`/api/ratings/${sellerId}`],
    queryFn: async () => {
      const res = await fetch(`/api/ratings/${sellerId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch seller ratings");
      }
      return res.json();
    },
  });
  
  // Calculate average rating
  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
    : 0;
  
  // Format price from cents to dollars
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };
  
  // Format date (e.g., "3 days ago")
  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  };
  
  // Get icon for project type
  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case "cli":
        return <Terminal className="h-5 w-5" />;
      case "gui":
        return <Laptop className="h-5 w-5" />;
      case "web":
        return <Code className="h-5 w-5" />;
      default:
        return <FileCode className="h-5 w-5" />;
    }
  };
  
  // Get avatar initials
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };
  
  const isLoading = isSellerLoading || isProjectsLoading || isRatingsLoading;
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!seller) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Seller Not Found</h1>
          <p className="text-gray-600 mb-6">The seller you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/marketplace")}>
            Return to Marketplace
          </Button>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Get status color class
  const getStatusColorClass = () => {
    switch (seller.status) {
      case "active":
        return "bg-green-400";
      case "busy":
        return "bg-orange-400";
      case "unavailable":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };

  // Get status display name
  const getStatusDisplay = () => {
    return seller.status.charAt(0).toUpperCase() + seller.status.slice(1);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-slate-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <button 
            onClick={() => navigate("/marketplace")}
            className="mb-6 flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Marketplace
          </button>
          
          {/* Seller profile header */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="p-6">
              <div className="sm:flex sm:items-center sm:justify-between">
                <div className="sm:flex sm:space-x-5">
                  <div className="flex-shrink-0 relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={seller.avatar} alt={seller.name} />
                      <AvatarFallback>{getInitials(seller.name)}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full ${getStatusColorClass()} border-2 border-white`}></div>
                  </div>
                  <div className="mt-4 sm:mt-0 text-center sm:text-left">
                    <p className="text-xl font-bold text-gray-900 sm:text-2xl">{seller.name}</p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start mt-2">
                      {/* Status badge */}
                      <Badge variant="secondary" className={`${
                        seller.status === "active" 
                          ? "bg-green-100 text-green-800" 
                          : seller.status === "busy" 
                            ? "bg-orange-100 text-orange-800" 
                            : "bg-red-100 text-red-800"
                      }`}>
                        {getStatusDisplay()}
                      </Badge>
                      
                      {/* Location */}
                      {!seller.isVpnUser && seller.location && (
                        <div className="flex items-center ml-2">
                          <img 
                            src={`https://flagcdn.com/w20/${seller.location.toLowerCase()}.png`} 
                            alt={seller.location} 
                            className="h-4 w-auto mr-1"
                          />
                          <span className="text-xs text-gray-500">{seller.location}</span>
                        </div>
                      )}
                      
                      {/* VPN user */}
                      {seller.isVpnUser && (
                        <div className="flex items-center ml-2">
                          <span className="text-xs text-gray-500">Unknown Location ❓</span>
                        </div>
                      )}
                      
                      {/* Ratings */}
                      <div className="flex items-center ml-2">
                        <div className="flex items-center">
                          {[...Array(Math.floor(averageRating))].map((_, i) => (
                            <Star key={i} className="text-yellow-400 h-4 w-4" />
                          ))}
                          {averageRating % 1 >= 0.5 && (
                            <StarHalf className="text-yellow-400 h-4 w-4" />
                          )}
                          {[...Array(5 - Math.ceil(averageRating))].map((_, i) => (
                            <Star key={i} className="text-gray-300 h-4 w-4" />
                          ))}
                        </div>
                        <span className="ml-1 text-sm text-gray-500">
                          {averageRating.toFixed(1)} ({ratings.length} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="mt-6 flex flex-col sm:flex-row sm:space-x-3 sm:mt-0">
                  <Button 
                    onClick={() => setIsRequestFormOpen(true)}
                    disabled={seller.status === "unavailable" || user?.id === seller.id}
                    className="mb-2 sm:mb-0"
                  >
                    Send Request
                  </Button>
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
              
              {/* Seller bio/status message */}
              <div className="mt-6 max-w-4xl">
                <p className="text-sm text-gray-500">
                  {seller.statusMessage || 
                    "Experienced developer specializing in creating efficient, scalable solutions for diverse technical challenges."}
                </p>
              </div>
              
              {/* Seller stats */}
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-gray-50 overflow-hidden shadow rounded-md">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{projects.length}</dd>
                  </div>
                </div>
                <div className="bg-gray-50 overflow-hidden shadow rounded-md">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">Starting Price</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {projects.length > 0 
                        ? formatPrice(Math.min(...projects.map(p => p.price)))
                        : "$0.00"}
                    </dd>
                  </div>
                </div>
                <div className="bg-gray-50 overflow-hidden shadow rounded-md">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">Member Since</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {new Date(seller.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short'
                      })}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs section */}
          <Tabs defaultValue="projects" className="space-y-4">
            <TabsList className="bg-white shadow-sm rounded-md">
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            
            {/* Projects tab */}
            <TabsContent value="projects" className="space-y-4">
              {projects.length === 0 ? (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6 text-center">
                    <FileCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-lg font-medium text-gray-900">No Projects Yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This seller hasn't uploaded any projects yet.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {projects.map((project) => (
                    <Card key={project.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              {getProjectTypeIcon(project.projectType)}
                            </div>
                            <CardTitle>{project.title}</CardTitle>
                          </div>
                          <Badge>{project.projectType.toUpperCase()}</Badge>
                        </div>
                        <CardDescription className="mt-2">{project.languageTags}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                          {project.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{formatDate(project.createdAt)}</span>
                          </div>
                          <span className="font-medium text-lg">{formatPrice(project.price)}</span>
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <Button className="flex-1" variant="outline" size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Run Demo
                          </Button>
                          <Button className="flex-1" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Buy Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* Reviews tab */}
            <TabsContent value="reviews" className="space-y-4">
              {ratings.length === 0 ? (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6 text-center">
                    <Star className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-lg font-medium text-gray-900">No Reviews Yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This seller hasn't received any reviews yet.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:p-6 space-y-6">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {ratings.length} {ratings.length === 1 ? "Review" : "Reviews"}
                        </h3>
                        <div className="flex items-center mt-1">
                          <div className="flex items-center">
                            {[...Array(Math.floor(averageRating))].map((_, i) => (
                              <Star key={i} className="text-yellow-400 h-5 w-5" />
                            ))}
                            {averageRating % 1 >= 0.5 && (
                              <StarHalf className="text-yellow-400 h-5 w-5" />
                            )}
                            {[...Array(5 - Math.ceil(averageRating))].map((_, i) => (
                              <Star key={i} className="text-gray-300 h-5 w-5" />
                            ))}
                          </div>
                          <p className="ml-2 text-sm text-gray-700">{averageRating.toFixed(1)} out of 5 stars</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-6">
                      {ratings.map((rating) => (
                        <div key={rating.id} className="mb-6 pb-6 border-b border-gray-200 last:mb-0 last:pb-0 last:border-0">
                          <div className="flex items-center mb-1">
                            <div className="flex items-center">
                              {[...Array(rating.rating)].map((_, i) => (
                                <Star key={i} className="text-yellow-400 h-4 w-4" />
                              ))}
                              {[...Array(5 - rating.rating)].map((_, i) => (
                                <Star key={i} className="text-gray-300 h-4 w-4" />
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-500">
                              {formatDate(rating.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-start mt-2">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarFallback>
                                {`B${rating.buyerId}`.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Buyer_{rating.buyerId}</h4>
                              <p className="mt-1 text-sm text-gray-600">{rating.review || "Great work! Exactly what I needed."}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* About tab */}
            <TabsContent value="about" className="space-y-4">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">About {seller.name}</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Expertise Areas</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-blue-50">Web Development</Badge>
                        <Badge variant="outline" className="bg-blue-50">JavaScript</Badge>
                        <Badge variant="outline" className="bg-blue-50">React</Badge>
                        <Badge variant="outline" className="bg-blue-50">Node.js</Badge>
                        <Badge variant="outline" className="bg-blue-50">API Development</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Experience</h4>
                      <p className="text-sm text-gray-600">
                        8+ years of experience in software development, specializing in creating 
                        efficient, scalable applications for various industries. Proficient in multiple 
                        programming languages and frameworks with a focus on delivering high-quality code.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Education</h4>
                      <div className="text-sm text-gray-600">
                        <p>Bachelor of Science in Computer Science</p>
                        <p className="text-gray-500">University of Technology, 2015-2019</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Languages</h4>
                      <p className="text-sm text-gray-600">English (Fluent), Spanish (Intermediate)</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Dialog open={isRequestFormOpen} onOpenChange={setIsRequestFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Request to {seller.name}</DialogTitle>
            <DialogDescription>
              Describe your project requirements and set a budget for this seller.
            </DialogDescription>
          </DialogHeader>
          <RequestForm onComplete={() => setIsRequestFormOpen(false)} selectedSellerId={seller.id} />
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
