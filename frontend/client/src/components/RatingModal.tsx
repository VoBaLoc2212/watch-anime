import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { AddAnimeRatingApi } from "@/api/RatingAPI";
import { useToast } from "@/hooks/use-toast";

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animeSlug: string;
  animeName: string;
  onSuccess?: () => void;
}

const scoreLabels = [
  { score: 10, label: "Masterpiece", color: "text-purple-500" },
  { score: 9, label: "Great", color: "text-blue-500" },
  { score: 8, label: "Very Good", color: "text-cyan-500" },
  { score: 7, label: "Good", color: "text-green-500" },
  { score: 6, label: "Fine", color: "text-lime-500" },
  { score: 5, label: "Average", color: "text-yellow-500" },
  { score: 4, label: "Bad", color: "text-orange-500" },
  { score: 3, label: "Very Bad", color: "text-red-500" },
  { score: 2, label: "Horrible", color: "text-red-700" },
  { score: 1, label: "Appalling", color: "text-red-900" },
];

export function RatingModal({
  open,
  onOpenChange,
  animeSlug,
  animeName,
  onSuccess,
}: RatingModalProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedScore) {
      toast({
        title: "Score Required",
        description: "Please select a score before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await AddAnimeRatingApi(animeSlug, selectedScore, review);
      toast({
        title: "Rating Submitted",
        description: "Your rating has been added successfully",
      });
      onOpenChange(false);
      setSelectedScore(null);
      setReview("");
      onSuccess?.();
    } catch (error) {
      console.error("Failed to submit rating:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit rating",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedLabel = scoreLabels.find((s) => s.score === selectedScore);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rate {animeName}</DialogTitle>
          <DialogDescription>
            Share your thoughts and rating for this anime
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Score</label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setSelectedScore(score)}
                  className={`relative group transition-all ${
                    selectedScore === score ? "scale-125" : "hover:scale-110"
                  }`}
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      selectedScore && selectedScore >= score
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-200"
                    }`}
                  />
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {score}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Score Label */}
            {selectedLabel && (
              <div className="text-center py-2">
                <p className={`text-lg font-semibold ${selectedLabel.color}`}>
                  {selectedLabel.label} ({selectedLabel.score}/10)
                </p>
              </div>
            )}
          </div>

          {/* Review Textarea */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Review (Optional)</label>
            <Textarea
              placeholder="Share your thoughts about this anime..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {review.length} characters
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedScore}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
