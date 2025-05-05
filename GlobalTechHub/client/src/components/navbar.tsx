import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { useState } from "react";
import { Code, User, LogOut, ShoppingCart, Menu, X, Bell } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Navbar() {
  const { user, logoutMutation, updateProfileMutation } = useAuth();
  const [_, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleRoleSwitch = (newRole: string) => {
    updateProfileMutation.mutate({ role: newRole as "buyer" | "seller" | "both" });
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center cursor-pointer">
              <Code className="text-primary h-6 w-6 mr-2" />
              <span className="font-bold text-xl text-gray-800">TechTalentHub</span>
            </Link>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/marketplace" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-primary text-sm font-medium">
                Marketplace
              </Link>
              {user?.role === "buyer" || user?.role === "both" ? (
                <Link href="/buyer-dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Buyer Dashboard
                </Link>
              ) : null}
              {user?.role === "seller" || user?.role === "both" ? (
                <Link href="/seller-dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Seller Dashboard
                </Link>
              ) : null}
              {user?.role === "admin" ? (
                <Link href="/admin-dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Admin Dashboard
                </Link>
              ) : null}
            </div>
          </div>
          
          <div className="flex items-center">
            {user && (
              <div className="flex-shrink-0 hidden md:block">
                <div className="relative">
                  <Select
                    defaultValue={user.role}
                    onValueChange={handleRoleSwitch}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">
                        <div className="flex items-center">
                          <ShoppingCart className="mr-2 h-4 w-4 text-primary" />
                          <span>Buyer Mode</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="seller">
                        <div className="flex items-center">
                          <Code className="mr-2 h-4 w-4 text-accent" />
                          <span>Seller Mode</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="both">
                        <div className="flex items-center">
                          <span>Both Roles</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {user && (
              <div className="hidden md:ml-4 md:flex md:items-center">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-gray-400" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">3</Badge>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-3 relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground mt-1">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            
            <div className="-mr-2 flex items-center md:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="pt-2 pb-3 space-y-1">
            <Link 
              href="/marketplace"
              className="block pl-3 pr-4 py-2 border-l-4 border-primary bg-primary-foreground/10 text-primary font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Marketplace
            </Link>
            {user?.role === "buyer" || user?.role === "both" ? (
              <Link 
                href="/buyer-dashboard"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent hover:border-gray-300 hover:bg-gray-50 text-gray-500 hover:text-gray-700 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Buyer Dashboard
              </Link>
            ) : null}
            {user?.role === "seller" || user?.role === "both" ? (
              <Link 
                href="/seller-dashboard"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent hover:border-gray-300 hover:bg-gray-50 text-gray-500 hover:text-gray-700 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Seller Dashboard
              </Link>
            ) : null}
            {user?.role === "admin" ? (
              <Link 
                href="/admin-dashboard"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent hover:border-gray-300 hover:bg-gray-50 text-gray-500 hover:text-gray-700 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
            ) : null}
          </div>
          
          {user ? (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto">
                  <Bell className="h-6 w-6 text-gray-400" />
                </Button>
              </div>
              <div className="mt-3 space-y-1">
                <div className="px-4 py-2">
                  <Select
                    defaultValue={user.role}
                    onValueChange={handleRoleSwitch}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer Mode</SelectItem>
                      <SelectItem value="seller">Seller Mode</SelectItem>
                      <SelectItem value="both">Both Roles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Link 
                  href="/profile"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Your Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex flex-col space-y-2 px-4">
                <Button onClick={() => navigate("/auth")}>
                  Login / Register
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
