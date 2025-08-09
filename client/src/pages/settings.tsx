import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Save, Mail, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { type User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Initialize form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: (user as User).firstName || "",
        lastName: (user as User).lastName || "",
        email: (user as User).email || "",
      });
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully!",
        variant: "default",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-card-purple-gray border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground" style={{ fontFamily: 'Crimson Text, serif' }}>
          Settings
        </h1>
        <p className="text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>Manage your account and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card className="bg-card border border-card-blue-gray/30 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-foreground" style={{ fontFamily: 'Crimson Text, serif' }}>
              <UserIcon className="h-5 w-5" />
              <span>Profile Information</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
              Update your personal information and profile details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 border-2 border-card-blue-gray/50">
                  <AvatarImage src={(user as User)?.profileImageUrl || undefined} alt="Profile" />
                  <AvatarFallback className="bg-card-blue-gray text-white">
                    <UserCircle className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-medium text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>Profile Picture</h3>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>Your profile picture from your authentication provider</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="bg-background border-card-blue-gray/30 text-foreground placeholder:text-muted-foreground focus:border-card-blue-gray"
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="bg-background border-card-blue-gray/30 text-foreground placeholder:text-muted-foreground focus:border-card-blue-gray"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email Address</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="glass border-electric-blue/30 text-white placeholder:text-white/50 focus:border-electric-blue"
                  placeholder="Enter your email address"
                  disabled
                />
                <p className="text-xs text-white/50">Email is managed by your authentication provider</p>
              </div>

              {/* Save Button */}
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="bg-gradient-electric text-white hover:scale-105 glow-electric-blue transition-all duration-300"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="glass border border-electric-purple/30 glow-electric-purple">
          <CardHeader>
            <CardTitle className="text-white">Account Information</CardTitle>
            <CardDescription className="text-white/70">
              Your account details and activity summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-white/70">User ID</Label>
                <p className="text-white font-mono">{(user as User)?.id}</p>
              </div>
              <div>
                <Label className="text-white/70">Member Since</Label>
                <p className="text-white">
                  {(user as User)?.createdAt ? new Date((user as User).createdAt!).toLocaleDateString() : "Recently"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}