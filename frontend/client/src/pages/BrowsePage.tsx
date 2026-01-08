import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useEffect } from "react";
import { 
  Play, 
  Search, 
  Star, 
  Users, 
  Video, 
  Database,
  Cloud,
  Zap,
  Shield,
  Tv
} from "lucide-react";

export default function BrowsePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      icon: Video,
      title: "HLS Video Streaming",
      description: "High-quality adaptive streaming with multiple quality options (360p, 720p) using HLS technology for smooth playback across all devices."
    },
    {
      icon: Search,
      title: "Smart Search",
      description: "Powerful search functionality to quickly find your favorite anime by title, genre, or studio."
    },
    {
      icon: Star,
      title: "Rating & Reviews",
      description: "Share your thoughts and rate anime with a 10-star rating system. Read reviews from other users to discover great shows."
    },
    {
      icon: Users,
      title: "User Authentication",
      description: "Secure authentication system with JWT tokens, Google OAuth integration, and password management."
    },
    {
      icon: Database,
      title: "Rich Database",
      description: "Comprehensive anime database with detailed information including genres, studios, release years, and episode counts."
    },
    {
      icon: Cloud,
      title: "Cloud Infrastructure",
      description: "Azure Blob Storage for media files, DigitalOcean Droplet for FFmpeg video processing, and PostgreSQL database."
    }
  ];

  const pages = [
    {
      title: "Home",
      path: "/",
      description: "Discover trending anime and new releases with our hero carousel showcasing popular titles.",
      features: ["Hero Carousel", "Trending Anime", "New Releases", "Quick Navigation"]
    },
    {
      title: "Watch Page",
      path: "/watch",
      description: "Stream anime episodes with our custom video player featuring HLS technology for optimal performance.",
      features: ["HLS Video Player", "Episode Selection", "Previous/Next Controls", "Rating System", "User Reviews"]
    },
    {
      title: "User Profile",
      path: "/user-information",
      description: "Manage your account settings and view your anime watching history.",
      features: ["Profile Management", "Watch History", "Password Change", "Theme Preferences"]
    }
  ];

  const techStack = [
    { name: "React", category: "Frontend" },
    { name: "TypeScript", category: "Frontend" },
    { name: "Tailwind CSS", category: "Frontend" },
    { name: "Vite", category: "Build Tool" },
    { name: "ASP.NET Core", category: "Backend" },
    { name: "PostgreSQL", category: "Database" },
    { name: "Azure Blob", category: "Storage" },
    { name: "FFmpeg", category: "Video Processing" },
    { name: "HLS.js", category: "Video Streaming" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary/10 to-background py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Tv className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">Animever</h1>
            </div>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              An online anime streaming platform developed for educational and research purposes.
              Built with modern web technologies to provide the best user experience.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Zap className="w-4 h-4 mr-2" />
                Modern Tech Stack
              </Badge>
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Shield className="w-4 h-4 mr-2" />
                Secure Authentication
              </Badge>
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Video className="w-4 h-4 mr-2" />
                HLS Streaming
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        {/* Key Features */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Key Features</h2>
            <p className="text-muted-foreground text-lg">
              Explore what makes Animever a modern anime streaming platform
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pages Overview */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Pages & Navigation</h2>
            <p className="text-muted-foreground text-lg">
              Discover all the pages available in Animever
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pages.map((page, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Link href={page.path}>
                    <CardTitle className="text-xl hover:text-primary transition-colors cursor-pointer flex items-center gap-2">
                      {page.title}
                      <Play className="w-4 h-4" />
                    </CardTitle>
                  </Link>
                  <CardDescription className="text-base">
                    {page.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Features:</p>
                    <div className="flex flex-wrap gap-2">
                      {page.features.map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Technology Stack</h2>
            <p className="text-muted-foreground text-lg">
              Built with modern and reliable technologies
            </p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {techStack.map((tech, index) => (
                  <div 
                    key={index} 
                    className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-center"
                  >
                    <p className="font-semibold mb-1">{tech.name}</p>
                    <p className="text-xs text-muted-foreground">{tech.category}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Educational Purpose Notice */}
        <section>
          <Card className="bg-muted/50 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Educational Purpose
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                <strong>Animever</strong> is an educational project developed to demonstrate modern web development practices, 
                including video streaming, user authentication, cloud storage integration, and responsive design.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This platform showcases the implementation of various technologies such as ASP.NET Core backend, 
                React frontend, HLS video streaming, Azure cloud services, and FFmpeg video processing.
              </p>
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> All content is used for educational purposes only. 
                  Please respect copyright and intellectual property rights of original creators.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact CTA */}
        <section className="text-center py-12">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold mb-4">Get in Touch</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Have questions or suggestions? Feel free to reach out for collaboration or inquiries about this project.
              </p>
              <a 
                href="mailto:asagawatakaku2212@gmail.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Contact Us
                <Play className="w-4 h-4" />
              </a>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
