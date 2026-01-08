import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { DecodeToken, useUserInfo } from "@/hooks/useTokenUrl";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, Save, Clock, Play } from "lucide-react";
import { useLocation, Link } from "wouter";
import { GetUserInfoApi, UpdateUserProfileApi } from "@/api/AuthAPI";
import { slugify } from "@/utils/slugify";
import magicalGirlImage from "@assets/generated_images/magical_girl_anime_poster.png";
import darkFantasyImage from "@assets/generated_images/dark_fantasy_anime_poster.png";
import schoolAnimeImage from "@assets/generated_images/school_anime_poster.png";
import mechaImage from "@assets/generated_images/mecha_robot_anime_poster.png";
import sportsImage from "@assets/generated_images/sports_anime_poster.png";

const userInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 10, {
      message: "Phone number must be at least 10 digits",
    }),
  email: z.string().email("Invalid email address"),
  photoUrl: z.string().optional(),
});

type UserInfoFormData = z.infer<typeof userInfoSchema>;

export default function UserInformation() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const { data: userInfo } = useUserInfo();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const form = useForm<UserInfoFormData>({
    resolver: zodResolver(userInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      photoUrl: "",
    },
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      setLocation("/login");
      return;
    }
    if(userInfo == undefined){
      GetUserInfoApi(DecodeToken(token).unique_name).then((info) => {
        form.reset({
          firstName: info.fullName.split(" ").slice(0, -1).join(" ") || "",
          lastName: info.fullName.split(" ").slice(-1).join("") || "",
          phoneNumber: info.phoneNumber || "",
          email: info.email || "",
        });
        setFullName(info.fullName);
        setPhotoUrl(info.photoUrl || "");
        setPhoneNumber(info.phoneNumber || "");
      });
      return;
    }
    // Decode token and populate form
    try {
      const fullName = userInfo?.fullName || "";
      const nameParts = fullName.trim().split(/\s+/);

      setFullName(fullName || "");
      setPhotoUrl(userInfo?.photoUrl || "");

      form.reset({
        firstName: nameParts.slice(0, -1).join(" ") || "",
        lastName: nameParts[nameParts.length - 1] || "",
        phoneNumber: userInfo?.phoneNumber || "", // Phone number không có trong token, cần fetch từ API
        email: userInfo?.email || "",
      });
    } catch (error) {
      console.error("Error decoding token:", error);
      toast({
        title: "Error",
        description: "Unable to load user information",
        variant: "destructive",
      });
    }
  }, []);

  const onSubmit = async (data: UserInfoFormData) => {
    setIsLoading(true);

    try {
      // Create FormData
      const formData = new FormData();
      
      // Append form fields
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("email", data.email);
      
      if (data.phoneNumber) {
        formData.append("phoneNumber", data.phoneNumber);
      }
      


      // Append avatar file if selected
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      // Call API to update user information
      const result = await UpdateUserProfileApi(formData);
      
      // Update local state with new data from response
      if (result.photoUrl) {
        setPhotoUrl(result.photoUrl);
      }
      
      if (result.fullName) {
        setFullName(result.fullName);
      }

      if(result.phoneNumber) {
        setPhoneNumber(result.phoneNumber);
      }
      
      // Clear avatar file after successful upload
      setAvatarFile(null);

      toast({
        title: "Success",
        description: "Your information has been updated successfully",
      });
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  

  const watchHistory = [
    {
      id: 1,
      title: "Magical Dreams",
      image: magicalGirlImage,
      episode: 12,
      totalEpisodes: 24,
      genres: ["Fantasy", "Action"],
      lastWatched: "2 hours ago",
    },
    {
      id: 2,
      title: "Dark Realm",
      image: darkFantasyImage,
      episode: 8,
      totalEpisodes: 12,
      genres: ["Dark Fantasy", "Adventure"],
      lastWatched: "Yesterday",
    },
    {
      id: 3,
      title: "School Days",
      image: schoolAnimeImage,
      episode: 5,
      totalEpisodes: 13,
      genres: ["Slice of Life", "Comedy"],
      lastWatched: "3 days ago",
    },
    {
      id: 4,
      title: "Mecha Warriors",
      image: mechaImage,
      episode: 15,
      totalEpisodes: 26,
      genres: ["Mecha", "Sci-Fi"],
      lastWatched: "1 week ago",
    },
    {
      id: 5,
      title: "Victory Sprint",
      image: sportsImage,
      episode: 10,
      totalEpisodes: 24,
      genres: ["Sports", "Drama"],
      lastWatched: "1 week ago",
    },
  ];

  return (

    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">User Information</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal information and account details
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Details
              </CardTitle>
              <CardDescription>
                Update your personal information below
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Avatar Section - Full Width */}
                <div className="flex flex-col items-center gap-4 pb-6 border-b mb-6">
                <div className="relative group">
                  <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                      toast({
                        title: "Error",
                        description: "Please select an image file",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                      toast({
                        title: "Error",
                        description: "Image size must be less than 5MB",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Save file for later upload
                    setAvatarFile(file);

                    // Preview image locally
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setPhotoUrl(reader.result as string);
                    };
                    reader.readAsDataURL(file);

                    toast({
                      title: "Preview Updated",
                      description: "Click 'Save Changes' to upload your new avatar",
                    });
                  }}
                  />
                  
                  {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={fullName}
                    className="h-32 w-32 rounded-full object-cover border-4 border-primary/10"
                    referrerPolicy="no-referrer"
                  />
                  ) : (
                  <div className="h-32 w-32 rounded-full bg-primary/10 text-primary flex items-center justify-center text-4xl font-bold border-4 border-primary/10">
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                  )}
                  
                  {/* Hover overlay */}
                  <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center text-white"
                  >
                  <User className="h-8 w-8 mb-1" />
                  <span className="text-xs font-medium">Change avatar</span>
                  </label>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-xl">{fullName}</p>
                </div>
              </div>

              {/* Form Section - Expanded */}
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your first name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your last name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your.email@example.com"
                            {...field}
                            disabled
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed
                        </p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="Enter your phone number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/dashboard")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Watch History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Watch History
              </CardTitle>
              <CardDescription>
                Continue watching your favorite anime
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {watchHistory.map((anime) => (
                  <Link key={anime.id} href={`/watch?animeName=${slugify(anime.title)}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div className="relative w-32 h-48 flex-shrink-0">
                          <img
                            src={anime.image}
                            alt={anime.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="h-12 w-12 text-white" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 py-4 pr-4">
                          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                            {anime.title}
                          </h3>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {anime.genres.map((genre) => (
                              <Badge
                                key={genre}
                                variant="secondary"
                                className="text-xs"
                              >
                                {genre}
                              </Badge>
                            ))}
                          </div>

                          <div className="space-y-2">
                            {/* Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>
                                  Episode {anime.episode} of{" "}
                                  {anime.totalEpisodes}
                                </span>
                                <span>
                                  {Math.round(
                                    (anime.episode / anime.totalEpisodes) * 100
                                  )}
                                  %
                                </span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                  className="bg-primary rounded-full h-2 transition-all"
                                  style={{
                                    width: `${
                                      (anime.episode / anime.totalEpisodes) *
                                      100
                                    }%`,
                                  }}
                                />
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground">
                              Last watched: {anime.lastWatched}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
