import { User, Project } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Star, StarHalf, Code, Terminal, Laptop, Server, Monitor, FileCode, CircleHelp } from "lucide-react";

interface SellerCardProps {
  seller: User;
}

export default function SellerCard({ seller }: SellerCardProps) {
  const [_, navigate] = useLocation();

  // Fetch seller's projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects", seller.id],
    queryFn: async () => {
      const response = await fetch(`/api/projects?sellerId=${seller.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch seller projects");
      }
      return response.json();
    },
  });

  // Get seller's rating (in a real app, would fetch from ratings data)
  const rating = generateRandomRating();
  const reviewCount = Math.floor(Math.random() * 50) + 10;

  // Generate random rating for demo purposes (would be real in production)
  function generateRandomRating() {
    return (Math.floor(Math.random() * 10) + 35) / 10; // Generate between 3.5 and 5.0
  }

  // Get avatar fallback (initials)
  const getInitials = () => {
    return seller.name
      .split(" ")
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  // Status color class
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

  // Get expertise icon
  const getExpertiseIcon = (expertise: string) => {
    // Simple logic to determine icon based on keywords
    if (expertise.toLowerCase().includes("web")) {
      return <Code className="mr-2 text-blue-500 h-4 w-4" />;
    } else if (expertise.toLowerCase().includes("cli") || expertise.toLowerCase().includes("terminal")) {
      return <Terminal className="mr-2 text-blue-500 h-4 w-4" />;
    } else if (expertise.toLowerCase().includes("mobile")) {
      return <Laptop className="mr-2 text-blue-500 h-4 w-4" />;
    } else if (expertise.toLowerCase().includes("backend") || expertise.toLowerCase().includes("cloud")) {
      return <Server className="mr-2 text-blue-500 h-4 w-4" />;
    } else if (expertise.toLowerCase().includes("gui") || expertise.toLowerCase().includes("desktop")) {
      return <Monitor className="mr-2 text-blue-500 h-4 w-4" />;
    } else {
      return <FileCode className="mr-2 text-blue-500 h-4 w-4" />;
    }
  };

  // Sample expertise areas (would be from actual data in production)
  const expertiseAreas = [
    seller.role === "seller" ? "Full-stack Development" : "Machine Learning",
    seller.status === "active" ? "Web Applications" : "CLI Tools"
  ];

  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${seller.status === "unavailable" ? "opacity-80" : ""}`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12 relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={seller.avatar} alt={seller.name} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${getStatusColorClass()} border-2 border-white`}></div>
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{seller.name}</h3>
              <div className="flex items-center">
                {seller.isVpnUser ? (
                  <div className="flex items-center">
                    <CircleHelp className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">Unknown ❓</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <img 
                      src={`https://flagcdn.com/w20/${seller.location ? seller.location.toLowerCase() : 'xx'}.png`} 
                      alt={seller.location || "Unknown"} 
                      className="h-4 w-auto mr-1"
                    />
                    <span className="text-xs text-gray-500">{seller.location || "Unknown"}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center mt-1">
              <div className="flex items-center">
                {[...Array(Math.floor(rating))].map((_, i) => (
                  <Star key={i} className="text-yellow-400 text-xs h-3.5 w-3.5" />
                ))}
                {rating % 1 >= 0.5 && (
                  <StarHalf className="text-yellow-400 text-xs h-3.5 w-3.5" />
                )}
              </div>
              <span className="ml-1 text-xs text-gray-500">({reviewCount} reviews)</span>
              <Badge variant="secondary" className={`ml-2 ${
                seller.status === "active" 
                  ? "bg-green-100 text-green-800" 
                  : seller.status === "busy" 
                    ? "bg-orange-100 text-orange-800" 
                    : "bg-red-100 text-red-800"
              }`}>
                {getStatusDisplay()}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <span className="text-sm text-gray-500">{seller.statusMessage || "Available for new projects and collaboration opportunities."}</span>
        </div>
        
        <div className="mt-4 space-y-2">
          {expertiseAreas.map((expertise, index) => (
            <div key={index} className="flex items-center text-sm font-medium text-gray-500">
              {getExpertiseIcon(expertise)}
              <span>{expertise}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-5 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Featured Projects</h4>
          {projects.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {projects.slice(0, 2).map((project) => (
                <div key={project.id} className="relative rounded-md overflow-hidden h-24 bg-gray-100">
                  {/* Default project image if none available */}
                  <img 
                    src={`https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80`} 
                    alt={project.title} 
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
                  <div className="absolute bottom-1 left-2 text-white text-xs font-medium">{project.title}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">No projects available</div>
          )}
        </div>
        
        <div className="mt-5 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-500">Projects: </span>
            <span className="font-medium">{projects.length}</span>
            <span className="mx-2 text-gray-300">|</span>
            <span className="text-sm text-gray-500">From </span>
            <span className="font-medium">${projects.length > 0 
              ? Math.min(...projects.map(p => p.price)) / 100 
              : 150}</span>
          </div>
          <div>
            <Button 
              onClick={() => navigate(`/sellers/${seller.id}`)}
              disabled={seller.status === "unavailable"}
              className={seller.status === "unavailable" ? "text-gray-500 bg-gray-100" : ""}
            >
              View Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
