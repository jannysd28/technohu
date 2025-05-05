import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import SellerCard from "@/components/seller-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { User } from "@shared/schema";
import { Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("mostRecent");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [skillLevel, setSkillLevel] = useState<string>("all");
  const [activeTags, setActiveTags] = useState<string[]>(["Web Development", "Python"]);

  // Fetch sellers
  const { data: sellers = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/sellers", statusFilter],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (statusFilter) {
        queryParams.append("status", statusFilter);
      }

      const response = await fetch(`/api/sellers?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch sellers");
      }
      return response.json();
    },
  });

  // Filter sellers based on search query
  const filteredSellers = sellers.filter(seller => {
    if (!searchQuery) return true;

    return (
      seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (seller.statusMessage && seller.statusMessage.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Remove a tag filter
  const removeTag = (tag: string) => {
    setActiveTags(activeTags.filter(t => t !== tag));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow bg-slate-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Tech Talent Marketplace
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Find skilled developers and ready-to-use tech solutions
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="cli">CLI Tools</SelectItem>
                  <SelectItem value="gui">GUI Applications</SelectItem>
                  <SelectItem value="web">Web Applications</SelectItem>
                </SelectContent>
              </Select>
              <span className="ml-3 shadow-sm rounded-md">
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </span>
            </div>
          </div>

          {/* Search and filter bar */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="space-y-4 flex-grow">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input 
                    type="text" 
                    placeholder="Search by title, keyword, or tag"
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Price Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="0-100">$0 - $100</SelectItem>
                      <SelectItem value="101-500">$101 - $500</SelectItem>
                      <SelectItem value="501-1000">$501 - $1000</SelectItem>
                      <SelectItem value="1000+">$1000+</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={skillLevel} onValueChange={setSkillLevel}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Skill Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Most Recent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mostRecent">Most Recent</SelectItem>
                    <SelectItem value="priceLow">Price: Low to High</SelectItem>
                    <SelectItem value="priceHigh">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active filter tags */}
            {activeTags.length > 0 && (
              <div className="flex flex-wrap items-center mt-3">
                <span className="text-sm text-gray-500 mr-2">Active filters:</span>
                {activeTags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="mr-2 mb-2 pl-2.5 pr-1 bg-blue-100 text-blue-700 hover:bg-blue-100"
                  >
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(tag)}
                      className="ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Marketplace grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredSellers.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-lg font-medium text-gray-900">No sellers found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {filteredSellers.map((seller) => (
                <SellerCard key={seller.id} seller={seller} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <span className="flex h-10 w-10 items-center justify-center text-sm text-muted-foreground">
                  ...
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">9</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">10</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </main>

      <Footer />
    </div>
  );
}