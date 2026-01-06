import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Plus, Edit, Trash2, Eye } from "lucide-react";
import { Link } from "wouter";
import { availableGenres } from "@/constants/animeConstants";
import { GetAnimeListApi } from "@/api/AnimeAPI";
import { Anime } from "@/models/AnimeModel";
import { useQuery } from "@tanstack/react-query";
import { slugify } from "@/utils/slugify";
import { FFmpegProvider } from "@/contexts/FFmpegContext";

function ManageAnimeContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("animeName");

  const { data: animes = [], isLoading } = useQuery({
    queryKey: ['animes'],
    queryFn: GetAnimeListApi,
    staleTime: 1000 * 60 * 5, // Cache dữ liệu trong 5 phút
    gcTime: 1000 * 60 * 10, // Giữ cache trong 10 phút
  });

  const filteredAnimes = useMemo(() => {
    let result = [...animes];

    // Filter by search query
    if (searchQuery) {
      result = result.filter(
        (anime: Anime) =>
          anime.animeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          anime.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by genre
    if (selectedGenre !== "all") {
      result = result.filter((anime: Anime) =>
        anime.genres.includes(selectedGenre)
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      result = result.filter((anime: Anime) => anime.status === selectedStatus);
    }

    // Sort
    switch (sortBy) {
      case "animeName":
        result.sort((a: Anime, b: Anime) => a.animeName.localeCompare(b.animeName));
        break;
      case "releaseYear":
        result.sort((a: Anime, b: Anime) => b.releaseYear - a.releaseYear);
        break;
      case "totalEpisodes":
        result.sort((a: Anime, b: Anime) => b.totalEpisodes - a.totalEpisodes);
        break;
    }

    return result;
  }, [animes, searchQuery, selectedGenre, selectedStatus, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ongoing":
        return "bg-green-500/10 text-green-500";
      case "Completed":
        return "bg-blue-500/10 text-blue-500";
      case "Upcoming":
        return "bg-orange-500/10 text-orange-500";
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Manage Anime</h1>
          <p className="text-muted-foreground mt-2">
            Manage and organize your anime collection
          </p>
        </div>
        <Link href="/upload-anime">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Anime
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading anime...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search anime by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Genre Filter */}
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger>
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {availableGenres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="animeName">Anime Name (A-Z)</SelectItem>
                <SelectItem value="releaseYear">Year (Newest)</SelectItem>
                <SelectItem value="totalEpisodes">Episodes (Most)</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground ml-auto">
              {filteredAnimes.length} anime{filteredAnimes.length !== 1 ? "s" : ""} found
            </span>
          </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Anime Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading anime collection...</p>
          </div>
        </div>
      ) : filteredAnimes.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No anime found</p>
            <p className="text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAnimes.map((anime) => (
            <Card key={anime.slug} className="overflow-hidden group hover:shadow-lg transition-shadow">
              {/* Thumbnail */}
              <div className="relative aspect-[2/3] overflow-hidden">
                <img
                  src={anime.thumbnailUrl}
                  alt={anime.animeName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2">
                  <Badge className={getStatusColor(anime.status)}>
                    {anime.status}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                  {anime.animeName}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {anime.description}
                </p>

                {/* Genres */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {anime.genres.slice(0, 3).map((genre: string) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>

                {/* Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>{anime.totalEpisodes} episodes</span>
                  <span>{anime.releaseYear}</span>
                  {/* <Badge variant="outline" className="text-xs">
                    {anime.rating}
                  </Badge> */}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/watch?animeName=${slugify(anime.animeName)}`} className="flex-1">
                    <Button variant="default" size="sm" className="w-full gap-1">
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/manage-anime/edit?animeName=${slugify(anime.animeName)}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManageAnime() {
  return (
    <FFmpegProvider autoLoad={true}>
      <ManageAnimeContent />
    </FFmpegProvider>
  );
}
