import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Upload, Film, Image as ImageIcon, X } from "lucide-react";
import { useLocation } from "wouter";
import ImageCropDialog from "@/components/ImageCropDialog";
import { availableGenres, statusOptions } from "@/constants/animeConstants";
import { AddAnimeApi } from "@/api/AnimeAPI";
import { set } from "date-fns";

const animeUploadSchema = z.object({
  animeName: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  releaseYear: z.string().min(4, "Release year is required"),
  studio: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  totalEpisodes: z.string().optional(),
});

type AnimeUploadFormData = z.infer<typeof animeUploadSchema>;

export default function UploadAnime() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const form = useForm<AnimeUploadFormData>({
    resolver: zodResolver(animeUploadSchema),
    defaultValues: {
      animeName: "",
      description: "",
      releaseYear: new Date().getFullYear().toString(),
      studio: "",
      status: "Ongoing",
      totalEpisodes: "",
    },
  });

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

    // Validate file size (max 10MB for original image)
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

  const onSubmit = async (data: AnimeUploadFormData) => {

    setErrorMessage("");

    if (selectedGenres.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one genre",
        variant: "destructive",
      });
      return;
    }

    if (!thumbnailFile) {
      toast({
        title: "Error",
        description: "Please upload a thumbnail image",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Create FormData for multipart upload
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

      // API Call to create anime
      try {
        // Gọi API
        const data = await AddAnimeApi(formData);
        
        toast({
          title: "Success",
          description: data.message,
        });

        window.location.href = "/manage-anime";

      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : "Failed to create anime";
        setErrorMessage(errorMsg);
        throw new Error(errorMsg);
      }

      

      //Reset form
      form.reset();
      setSelectedGenres([]);
      setThumbnailFile(null);
      setThumbnailPreview("");

      //Redirect to manage anime page or anime detail
      setTimeout(() => {
        setLocation("/manage-anime");
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create anime",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Anime</h1>
        <p className="text-muted-foreground mt-2">
          Add a new anime series to your collection. You can upload episodes later.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            Anime Information
          </CardTitle>
          <CardDescription>
            Fill in the basic information about the anime series
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
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
                        disabled={isUploading}
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
                        disabled={isUploading}
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
                          type="text"
                          placeholder="2024"
                          {...field}
                          disabled={isUploading}
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
                          disabled={isUploading}
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
                      <FormLabel>Total Episodes (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="12"
                          {...field}
                          disabled={isUploading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Studio */}
              <FormField
                control={form.control}
                name="studio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Studio (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Studio Ghibli, Kyoto Animation"
                        {...field}
                        disabled={isUploading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Genres */}
              <div className="space-y-3">
                <FormLabel>Genres *</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {availableGenres.map((genre) => (
                    <Badge
                      key={genre}
                      variant={selectedGenres.includes(genre) ? "default" : "outline"}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => !isUploading && toggleGenre(genre)}
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
                {selectedGenres.length === 0 && (
                  <p className="text-sm text-destructive">
                    Please select at least one genre
                  </p>
                )}
              </div>

              {/* Thumbnail Upload */}
              <div className="space-y-3">
                <FormLabel className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Thumbnail Image *
                </FormLabel>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                  {thumbnailPreview ? (
                    <div className="space-y-3">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="max-h-48 mx-auto rounded"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setThumbnailFile(null);
                          setThumbnailPreview("");
                        }}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        className="hidden"
                        id="thumbnail-upload"
                        disabled={isUploading}
                      />
                      <label
                        htmlFor="thumbnail-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Click to upload thumbnail</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            PNG, JPG (Max 10MB) - Will be cropped to 896x1280
                          </p>
                        </div>
                      </label>
                    </>
                  )}
                </div>
                {!thumbnailFile && (
                  <p className="text-sm text-destructive">
                    Please upload a thumbnail image
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/manage-anime")}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading || !thumbnailFile}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? "Creating..." : "Create Anime"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        {errorMessage && (
              <div className="text-sm text-red-500 text-center" data-testid="error-message">
                {errorMessage}
              </div>
            )}
      </Card>

      {/* Info Card */}
      <Card className="mt-6 bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Film className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Next Steps</p>
              <p className="text-sm text-muted-foreground">
                After creating the anime, you can upload individual episodes with their videos and thumbnails from the Manage Anime page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={showCropDialog}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
        onClose={() => setShowCropDialog(false)}
      />
    </div>
  );
}
