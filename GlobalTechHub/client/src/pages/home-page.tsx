import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Code, Search, ShoppingBag, Upload, UserCircle, CheckCircle } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  const navigateToDashboard = () => {
    if (user?.role === "buyer") {
      navigate("/buyer-dashboard");
    } else if (user?.role === "seller") {
      navigate("/seller-dashboard");
    } else if (user?.role === "both") {
      // Default to marketplace for users with both roles
      navigate("/marketplace");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="md:w-1/2">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white">
                  Global Tech Talent Hub
                </h1>
                <p className="mt-6 text-xl max-w-3xl text-blue-100/90 leading-relaxed">
                  Connect with skilled developers, showcase your tech projects, and find the perfect solutions for your needs.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row sm:gap-3">
                  <Button 
                    onClick={() => navigate("/marketplace")}
                    size="lg" 
                    className="bg-white text-blue-600 hover:bg-gray-100"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Browse Marketplace
                  </Button>
                  <Button 
                    onClick={navigateToDashboard}
                    size="lg" 
                    variant="outline"
                    className="mt-3 sm:mt-0 border-white text-white hover:bg-white/20"
                  >
                    <UserCircle className="mr-2 h-5 w-5" />
                    My Dashboard
                  </Button>
                </div>
              </div>
              <div className="hidden md:block md:w-1/2">
                <div className="pl-4 mt-10 md:mt-0 md:pl-10">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=500&q=80"
                    alt="Developers collaborating"
                    className="w-full rounded-lg shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400 sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-gray-600/90 max-w-2xl mx-auto">
                Connect, collaborate, and create with tech talents from around the world
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                  <Code className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Upload Your Projects</h3>
                <p className="mt-2 text-base text-gray-600">
                  Share your CLI tools, GUI apps, or web applications with potential buyers.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 text-purple-600 mb-4">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Discover Solutions</h3>
                <p className="mt-2 text-base text-gray-600">
                  Browse tech solutions created by global professionals, with secure previews.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-4">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Custom Requests</h3>
                <p className="mt-2 text-base text-gray-600">
                  Need something specific? Request custom work directly from sellers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400 sm:text-4xl">
                Platform Features
              </h2>
              <p className="mt-4 text-lg text-gray-600/90 max-w-2xl mx-auto">
                Everything you need to showcase your skills or find the perfect tech solution
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <CheckCircle className="h-8 w-8 text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Global Talent Network</h3>
                <p className="mt-2 text-gray-600">
                  Connect with tech professionals from around the world, with automatic location detection.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <CheckCircle className="h-8 w-8 text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Secure Sandbox Environment</h3>
                <p className="mt-2 text-gray-600">
                  Preview and test applications in a secure, containerized environment before purchasing.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <CheckCircle className="h-8 w-8 text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Flexible Role Switching</h3>
                <p className="mt-2 text-gray-600">
                  Seamlessly switch between buyer and seller roles to both offer services and find solutions.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <CheckCircle className="h-8 w-8 text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Custom Requests System</h3>
                <p className="mt-2 text-gray-600">
                  Submit detailed job requests to talented developers with clear pricing and specifications.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <CheckCircle className="h-8 w-8 text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Rating & Trust System</h3>
                <p className="mt-2 text-gray-600">
                  Find reliable partners through verified reviews and completion metrics.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <CheckCircle className="h-8 w-8 text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Direct Communication</h3>
                <p className="mt-2 text-gray-600">
                  Message buyers or sellers directly to discuss project requirements and specifications.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mt-4 text-lg max-w-2xl mx-auto">
              Join our global community of tech professionals today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => navigate("/marketplace")}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                <Search className="mr-2 h-5 w-5" />
                Browse Marketplace
              </Button>
              {user?.role === "seller" || user?.role === "both" ? (
                <Button 
                  onClick={() => navigate("/upload-project")}
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/20"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload a Project
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
