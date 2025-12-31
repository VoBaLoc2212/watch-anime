import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Film, Save, Plus, ArrowLeft, Image as ImageIcon, X } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { availableGenres, statusOptions } from "@/constants/animeConstants";
import { GetAnimeDetailApi, UpdateAnimeApi } from "@/api/AnimeAPI";
import { GetEpisodesApi } from "@/api/EpisodeAPI";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ImageCropDialog from "@/components/ImageCropDialog";
import EpisodeUploadDialog from "@/components/EpisodeUploadDialog";

const animeEditSchema = z.object({
  animeName: z.string().min(1, "Anime name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  releaseYear: z.string().min(4, "Release year is required"),
  studio: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  totalEpisodes: z.string().optional()
});

type AnimeEditFormData = z.infer<typeof animeEditSchema>;

export default function EditAnime() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const animeName = new URLSearchParams(searchParams).get("animeName");
  const queryClient = useQueryClient();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");
  const [showEpisodeUpload, setShowEpisodeUpload] = useState(false);

  const { data: anime, isLoading, isError, error } = useQuery({
    queryKey: ['anime', animeName],
    queryFn: () => GetAnimeDetailApi(animeName || ""),
    enabled: !!animeName, // Chỉ gọi API khi có animeName
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const { data: episodes = [], isLoading: episodesLoading } = useQuery({
    queryKey: ['episodes', animeName],
    queryFn: () => GetEpisodesApi(animeName || ""),
    enabled: !!animeName,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const form = useForm<AnimeEditFormData>({
    resolver: zodResolver(animeEditSchema),
    defaultValues: {
      animeName: "",
      description: "",
      releaseYear: "",
      studio: "",
      status: "Ongoing",
      totalEpisodes: ""
    },
  });

  useEffect(() => {
    if (anime) {
      form.reset({
        animeName: anime.animeName,
        description: anime.description,
        releaseYear: anime.releaseYear.toString(),
        studio: anime.studio || "",
        status: anime.status,
        totalEpisodes: anime.totalEpisodes?.toString() || ""
      });
      setSelectedGenres(anime.genres || []);
    }
  }, [anime, form]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    // Load image and show crop dialog
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImageSrc(reader.result as string);
      setShowCropDialog(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImage: File) => {
    setThumbnailFile(croppedImage);
    
    // Create preview URL for cropped image
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(croppedImage);
  };

  const handleUploadSuccess = () => {
    // Refetch episodes after successful upload
    queryClient.invalidateQueries({ queryKey: ['episodes', animeName] });
  };

  const onSubmit = async (data: AnimeEditFormData) => {
    if (selectedGenres.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one genre",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }


      const formData = new FormData();
      formData.append("animeName", data.animeName);
      formData.append("description", data.description);
      formData.append("releaseYear", data.releaseYear);
      formData.append("status", data.status);
      formData.append("genres", selectedGenres.join(","));
      
      if (data.studio) {
        formData.append("studio", data.studio);
      }
      if (data.totalEpisodes) {
        formData.append("totalEpisodes", data.totalEpisodes);
      }
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      const response = await UpdateAnimeApi(formData, animeName || "");

      if (response.error) {
        throw new Error(response.message || "Failed to update anime");
      }
      toast({
        title: "Success",
        description: response.message,
      });

      setTimeout(() => {
        setLocation("/manage-anime");
      }, 1500);
    } catch (error) {
      console.error("Update error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to update anime";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading anime data...</p>
        </div>
      </div>
    );
  }

  if (isError || !anime) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-lg font-medium mb-2">Anime not found</p>
              <p className="text-muted-foreground mb-4">
                {isError 
                  ? (error instanceof Error ? error.message : "Failed to load anime data")
                  : "The anime you're looking for doesn't exist or has been removed."}
              </p>
              <Button onClick={() => setLocation("/manage-anime")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Manage Anime
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/manage-anime")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Anime</h1>
          <p className="text-muted-foreground mt-1">
            Update anime information and manage episodes
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Thumbnail */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Thumbnail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-4">
                <img
                  src={thumbnailPreview || anime.thumbnailUrl}
                  alt={anime.animeName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              {thumbnailPreview ? (
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setThumbnailFile(null);
                      setThumbnailPreview("");
                    }}
                    disabled={isUpdating}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove New Thumbnail
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    New thumbnail will be saved when you click "Save Changes"
                  </p>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                    id="thumbnail-upload"
                    disabled={isUpdating}
                  />
                  <label htmlFor="thumbnail-upload">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      asChild
                      disabled={isUpdating}
                    >
                      <span>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Change Thumbnail
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Click to upload and crop new thumbnail (896x1280)
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Anime Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5" />
                Anime Information
              </CardTitle>
              <CardDescription>
                Update the basic information about the anime series
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Anime Name */}
                  <FormField
                    control={form.control}
                    name="animeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anime Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter anime name"
                            {...field}
                            disabled={isUpdating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <textarea
                            placeholder="Enter anime description..."
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                            disabled={isUpdating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Release Year */}
                    <FormField
                      control={form.control}
                      name="releaseYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Release Year</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="2024"
                              {...field}
                              disabled={isUpdating}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Status */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                              disabled={isUpdating}
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Total Episodes */}
                    <FormField
                      control={form.control}
                      name="totalEpisodes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Episodes</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="12"
                              {...field}
                              disabled={isUpdating}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {/* Studio */}
                    <FormField
                      control={form.control}
                      name="studio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Studio (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Studio Ghibli"
                              {...field}
                              disabled={isUpdating}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Genres */}
                  <div className="space-y-3">
                    <FormLabel>Genres *</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {availableGenres.map((genre) => (
                        <Badge
                          key={genre}
                          variant={selectedGenres.includes(genre) ? "default" : "outline"}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => !isUpdating && toggleGenre(genre)}
                        >
                          {genre}
                        </Badge>
                      ))}
                    </div>
                    {selectedGenres.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedGenres.join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={isUpdating}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Episodes Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Episodes
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowEpisodeUpload(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Episode
                </Button>
              </CardTitle>
              <CardDescription>
                Manage episodes for this anime series
              </CardDescription>
            </CardHeader>
            <CardContent>
              {episodesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading episodes...</p>
                </div>
              ) : episodes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No episodes yet</p>
                  <p className="text-sm mt-2">
                    Click "Add Episode" to upload your first episode
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {episodes.map((episode: any) => (
                    <div
                      key={episode.episodeId}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Episode {episode.episodeNumber}</span>
                          <span className="text-muted-foreground">•</span>
                          <span>{episode.episodeName}</span>
                        </div>
                        {episode.duration && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Duration: {episode.duration}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" disabled>
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={showCropDialog}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
        onClose={() => setShowCropDialog(false)}
      />

      {/* Episode Upload Dialog */}
      <EpisodeUploadDialog
        open={showEpisodeUpload}
        onClose={() => setShowEpisodeUpload(false)}
        animeSlug={animeName || ""}
        animeName={anime.animeName}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
