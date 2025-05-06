import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, Phone, MapPin, Shield, Users, Clock, ArrowRight, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    if (isAuthenticated) {
      navigate("/admin");
    } else {
      navigate("/login");
    }
  };

  const features = [
    {
      icon: AlertCircle,
      title: "Rapid Response",
      description: "Our system enables immediate alert notifications and dispatch of emergency personnel.",
    },
    {
      icon: MapPin,
      title: "Location Tracking",
      description: "Precise GPS-based location tracking for accurate emergency response coordination.",
    },
    {
      icon: Shield,
      title: "Staff Management",
      description: "Efficient assignment and management of emergency response staff and resources.",
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Live status updates and communication between responders and control center.",
    },
  ];

  const stats = [
    { value: "95%", label: "Response Rate" },
    { value: "< 10min", label: "Avg. Response Time" },
    { value: "24/7", label: "Service Availability" },
    { value: "100%", label: "Client Satisfaction" },
  ];

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Fire Emergency Response</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Testimonials</a>
            <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">Contact</a>
          </nav>
          <ThemeToggle/>
          <div className="flex items-center gap-3">
            <Button size="sm" className="flex items-center gap-1" onClick={handleLoginRedirect}>
              {isAuthenticated ? "Dashboard" : "Admin Login"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-20 bg-gradient-to-b from-red-50 to-orange-50 dark:from-gray-900 dark:to-red-950">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 bg-primary/10 text-primary">
                Emergency Response System
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Rapid Response For <span className="text-primary">Fire Emergencies</span>
              </h1>
              <p className="text-lg">
                Our advanced emergency management system connects clients with emergency responders for rapid, effective fire emergency response.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" className="group" onClick={() => navigate("/login")}>Admin Portal <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></Button>
                <Button size="lg" variant="outline" onClick={() => window.open("tel:+252619742449")}>Emergency Hotline</Button>
              </div>
            </div>
            <div className="hidden md:block relative">
              <div className="absolute inset-0 rounded-2xl transform rotate-3 bg-primary/20"></div>
              <img src="/emergency.jpg" alt="Emergency response team" className="relative z-10 rounded-2xl shadow-lg object-cover w-full h-[400px]" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">
              Features that <span className="text-primary">Save Lives</span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto">
              Our platform offers advanced tools that enhance emergency response time and efficiency for both responders and clients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-xl bg-card border hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className="p-3 rounded-lg inline-block mb-4 bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Enhance Your Emergency Response?</h2>
            <p className="mb-8">Join our network of emergency response professionals and clients for faster, more effective emergency management.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" onClick={() => navigate("/login")}>Admin Portal</Button>
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10" onClick={() => window.open("https://client-portal.example.com")}>Client Registration</Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">Fire Emergency Response</h2>
              </div>
              <p>Providing rapid response and coordination for fire emergencies to save lives and property.</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-primary">About Us</a></li>
                <li><a href="#" className="hover:text-primary">Services</a></li>
                <li><a href="#" className="hover:text-primary">Coverage Areas</a></li>
                <li><a href="#" className="hover:text-primary">News</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-primary">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary">Help Center</a></li>
                <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +123 456 7890</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> 123 Emergency St, Mogadishu</li>
                <li>info@fireemergency.com</li>
                <li>24/7 Emergency Hotline</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} Fire Emergency Response System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
