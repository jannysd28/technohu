import { Link } from "wouter";
import { Code, Twitter, Facebook, Instagram, Github } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex items-center">
            <Code className="text-primary h-6 w-6 mr-2" />
            <span className="font-bold text-xl text-gray-800">TechTalentHub</span>
          </div>
          
          <div className="mt-8 md:mt-0">
            <nav className="-mx-5 -my-2 flex flex-wrap justify-center">
              <div className="px-5 py-2">
                <Link href="/marketplace" className="text-base text-gray-500 hover:text-gray-900">
                  Marketplace
                </Link>
              </div>
              <div className="px-5 py-2">
                <Link href="#" className="text-base text-gray-500 hover:text-gray-900">
                  About Us
                </Link>
              </div>
              <div className="px-5 py-2">
                <Link href="#" className="text-base text-gray-500 hover:text-gray-900">
                  How It Works
                </Link>
              </div>
              <div className="px-5 py-2">
                <Link href="#" className="text-base text-gray-500 hover:text-gray-900">
                  Support
                </Link>
              </div>
              <div className="px-5 py-2">
                <Link href="#" className="text-base text-gray-500 hover:text-gray-900">
                  Terms of Service
                </Link>
              </div>
              <div className="px-5 py-2">
                <Link href="#" className="text-base text-gray-500 hover:text-gray-900">
                  Privacy Policy
                </Link>
              </div>
            </nav>
          </div>
          
          <div className="mt-8 md:mt-0">
            <div className="flex space-x-6 md:order-2">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-5 w-5" aria-hidden="true" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-5 w-5" aria-hidden="true" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-5 w-5" aria-hidden="true" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">GitHub</span>
                <Github className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center">
          <p className="text-base text-gray-500">
            &copy; {currentYear} TechTalentHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
