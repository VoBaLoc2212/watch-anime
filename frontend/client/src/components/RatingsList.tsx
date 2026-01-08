import { Rating } from "@/models/RatingModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RatingsListProps {
  ratings: Rating[];
  isLoading?: boolean;
}

const scoreColors: Record<number, string> = {
  10: "text-purple-500",
  9: "text-blue-500",
  8: "text-cyan-500",
  7: "text-green-500",
  6: "text-lime-500",
  5: "text-yellow-500",
  4: "text-orange-500",
  3: "text-red-500",
  2: "text-red-700",
  1: "text-red-900",
};

const scoreLabels: Record<number, string> = {
  10: "Masterpiece",
  9: "Great",
  8: "Very Good",
  7: "Good",
  6: "Fine",
  5: "Average",
  4: "Bad",
  3: "Very Bad",
  2: "Horrible",
  1: "Appalling",
};

export function RatingsList({ ratings, isLoading }: RatingsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground text-sm">Loading reviews...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ratings || ratings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              No reviews yet. Be the first to review this anime!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate average score
  const avgScore = (
    ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
  ).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Reviews</CardTitle>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="text-xl font-bold">{avgScore}</span>
            <span className="text-sm text-muted-foreground">
              ({ratings.length} {ratings.length === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {ratings.map((rating, index) => (
          <div
            key={index}
            className="border-b last:border-b-0 pb-4 last:pb-0 space-y-2"
          >
            {/* User Info and Score */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{rating.userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(rating.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>

              {/* Score Badge */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex">
                  {[...Array(10)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < rating.score
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span
                  className={`text-sm font-bold ${
                    scoreColors[rating.score] || "text-gray-500"
                  }`}
                >
                  {rating.score}/10
                </span>
              </div>
            </div>

            {/* Review Text */}
            {rating.review && (
              <p className="text-sm text-muted-foreground pl-10 leading-relaxed">
                {rating.review}
              </p>
            )}

            {/* Score Label */}
            <div className="pl-10">
              <span
                className={`text-xs font-medium ${
                  scoreColors[rating.score] || "text-gray-500"
                }`}
              >
                {scoreLabels[rating.score]}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
