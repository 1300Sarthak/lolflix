import type { TMDBMedia, TMDBMovie, TMDBShow, TMDBSeason, TMDBMovieDetails, TMDBShowDetails, TMDBPersonDetails, TMDBCollection, DiscoverParams } from "@/types"

const BASE = process.env.NEXT_PUBLIC_TMDB_BASE_URL
const KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TMDB API error: ${res.status}`)
  return res.json()
}

function buildDiscoverUrl(type: "movie" | "tv", params: DiscoverParams): string {
  const parts = [`${BASE}/discover/${type}?api_key=${KEY}`]
  if (params.genres?.length) parts.push(`with_genres=${params.genres.join(",")}`)
  if (params.sortBy) parts.push(`sort_by=${params.sortBy}`)
  if (params.decadeStart) parts.push(`primary_release_date.gte=${params.decadeStart}-01-01`)
  if (params.decadeEnd) parts.push(`primary_release_date.lte=${params.decadeEnd}-12-31`)
  if (params.runtimeGte) parts.push(`with_runtime.gte=${params.runtimeGte}`)
  if (params.runtimeLte) parts.push(`with_runtime.lte=${params.runtimeLte}`)
  if (params.voteAverageGte) parts.push(`vote_average.gte=${params.voteAverageGte}`)
  if (params.voteCountGte) parts.push(`vote_count.gte=${params.voteCountGte}`)
  if (params.voteCountLte) parts.push(`vote_count.lte=${params.voteCountLte}`)
  if (params.language) parts.push(`with_original_language=${params.language}`)
  if (params.page) parts.push(`page=${params.page}`)
  return parts.join("&")
}

export const tmdb = {
  // Search
  searchMovies: (query: string) =>
    fetchJSON<{ results: TMDBMovie[] }>(
      `${BASE}/search/movie?query=${encodeURIComponent(query)}&api_key=${KEY}`
    ),

  searchTV: (query: string) =>
    fetchJSON<{ results: TMDBShow[] }>(
      `${BASE}/search/tv?query=${encodeURIComponent(query)}&api_key=${KEY}`
    ),

  searchPerson: (query: string) =>
    fetchJSON<{ results: { id: number; name: string; profile_path: string | null; known_for: TMDBMedia[] }[] }>(
      `${BASE}/search/person?query=${encodeURIComponent(query)}&api_key=${KEY}`
    ),

  // Trending
  trendingMovies: () =>
    fetchJSON<{ results: TMDBMedia[] }>(`${BASE}/trending/movie/week?api_key=${KEY}`),

  trendingTV: () =>
    fetchJSON<{ results: TMDBMedia[] }>(`${BASE}/trending/tv/week?api_key=${KEY}`),

  trendingMoviesDaily: () =>
    fetchJSON<{ results: TMDBMedia[] }>(`${BASE}/trending/movie/day?api_key=${KEY}`),

  trendingTVDaily: () =>
    fetchJSON<{ results: TMDBMedia[] }>(`${BASE}/trending/tv/day?api_key=${KEY}`),

  // Lists
  popularMovies: () =>
    fetchJSON<{ results: TMDBMedia[] }>(`${BASE}/movie/popular?api_key=${KEY}`),

  topRatedMovies: () =>
    fetchJSON<{ results: TMDBMedia[] }>(`${BASE}/movie/top_rated?api_key=${KEY}`),

  nowPlayingMovies: () =>
    fetchJSON<{ results: TMDBMedia[] }>(`${BASE}/movie/now_playing?api_key=${KEY}`),

  upcomingMovies: () =>
    fetchJSON<{ results: TMDBMedia[] }>(`${BASE}/movie/upcoming?api_key=${KEY}`),

  popularTV: () =>
    fetchJSON<{ results: TMDBMedia[] }>(`${BASE}/tv/popular?api_key=${KEY}`),

  topRatedTV: () =>
    fetchJSON<{ results: TMDBMedia[] }>(`${BASE}/tv/top_rated?api_key=${KEY}`),

  onTheAirTV: () =>
    fetchJSON<{ results: TMDBMedia[] }>(`${BASE}/tv/on_the_air?api_key=${KEY}`),

  airingTodayTV: () =>
    fetchJSON<{ results: TMDBMedia[] }>(`${BASE}/tv/airing_today?api_key=${KEY}`),

  // Genres / Discover
  movieGenres: () =>
    fetchJSON<{ genres: { id: number; name: string }[] }>(
      `${BASE}/genre/movie/list?api_key=${KEY}`
    ),

  tvGenres: () =>
    fetchJSON<{ genres: { id: number; name: string }[] }>(
      `${BASE}/genre/tv/list?api_key=${KEY}`
    ),

  discoverMoviesByGenre: (genreId: number, sortBy?: string) =>
    fetchJSON<{ results: TMDBMedia[] }>(
      `${BASE}/discover/movie?with_genres=${genreId}&sort_by=${sortBy || "popularity.desc"}&api_key=${KEY}`
    ),

  discoverTVByGenre: (genreId: number, sortBy?: string) =>
    fetchJSON<{ results: TMDBMedia[] }>(
      `${BASE}/discover/tv?with_genres=${genreId}&sort_by=${sortBy || "popularity.desc"}&api_key=${KEY}`
    ),

  // Advanced discover
  discoverMovies: (params: DiscoverParams) =>
    fetchJSON<{ results: TMDBMedia[] }>(buildDiscoverUrl("movie", params)),

  discoverTV: (params: DiscoverParams) =>
    fetchJSON<{ results: TMDBMedia[] }>(buildDiscoverUrl("tv", params)),

  // New Releases (last 30 days)
  newReleaseMovies: () => {
    const d = new Date(); d.setDate(d.getDate() - 30)
    const gte = d.toISOString().split("T")[0]
    return fetchJSON<{ results: TMDBMedia[] }>(
      `${BASE}/discover/movie?primary_release_date.gte=${gte}&sort_by=popularity.desc&api_key=${KEY}`
    )
  },

  newReleaseTV: () => {
    const d = new Date(); d.setDate(d.getDate() - 30)
    const gte = d.toISOString().split("T")[0]
    return fetchJSON<{ results: TMDBMedia[] }>(
      `${BASE}/discover/tv?first_air_date.gte=${gte}&sort_by=popularity.desc&api_key=${KEY}`
    )
  },

  // Hidden Gems (high rating, low popularity)
  hiddenGemMovies: () =>
    fetchJSON<{ results: TMDBMedia[] }>(
      `${BASE}/discover/movie?vote_average.gte=7.5&vote_count.lte=500&vote_count.gte=50&sort_by=vote_average.desc&api_key=${KEY}`
    ),

  hiddenGemTV: () =>
    fetchJSON<{ results: TMDBMedia[] }>(
      `${BASE}/discover/tv?vote_average.gte=7.5&vote_count.lte=500&vote_count.gte=50&sort_by=vote_average.desc&api_key=${KEY}`
    ),

  // Critically Acclaimed
  criticallyAcclaimedMovies: () =>
    fetchJSON<{ results: TMDBMedia[] }>(
      `${BASE}/discover/movie?vote_average.gte=8.0&vote_count.gte=1000&sort_by=vote_average.desc&api_key=${KEY}`
    ),

  criticallyAcclaimedTV: () =>
    fetchJSON<{ results: TMDBMedia[] }>(
      `${BASE}/discover/tv?vote_average.gte=8.0&vote_count.gte=1000&sort_by=vote_average.desc&api_key=${KEY}`
    ),

  // Indian content
  discoverHindiMovies: () =>
    fetchJSON<{ results: TMDBMedia[] }>(
      `${BASE}/discover/movie?with_original_language=hi&sort_by=popularity.desc&api_key=${KEY}`
    ),

  discoverHindiTV: () =>
    fetchJSON<{ results: TMDBMedia[] }>(
      `${BASE}/discover/tv?with_original_language=hi&sort_by=popularity.desc&api_key=${KEY}`
    ),

  discoverPunjabiMovies: () =>
    fetchJSON<{ results: TMDBMedia[] }>(
      `${BASE}/discover/movie?with_original_language=pa&sort_by=popularity.desc&api_key=${KEY}`
    ),

  discoverPunjabiTV: () =>
    fetchJSON<{ results: TMDBMedia[] }>(
      `${BASE}/discover/tv?with_original_language=pa&sort_by=popularity.desc&api_key=${KEY}`
    ),

  // Director spotlight
  discoverByPerson: (personId: number) =>
    fetchJSON<{ results: TMDBMedia[] }>(
      `${BASE}/discover/movie?with_people=${personId}&sort_by=popularity.desc&api_key=${KEY}`
    ),

  // Recommendations
  movieRecommendations: (id: number) =>
    fetchJSON<{ results: TMDBMedia[] }>(
      `${BASE}/movie/${id}/recommendations?api_key=${KEY}`
    ),

  tvRecommendations: (id: number) =>
    fetchJSON<{ results: TMDBMedia[] }>(
      `${BASE}/tv/${id}/recommendations?api_key=${KEY}`
    ),

  // Extended Details
  getMovieDetails: (id: number) =>
    fetchJSON<TMDBMovieDetails>(
      `${BASE}/movie/${id}?append_to_response=credits,videos,similar,recommendations,keywords,release_dates&api_key=${KEY}`
    ),

  getShowDetails: (id: number) =>
    fetchJSON<TMDBShowDetails>(
      `${BASE}/tv/${id}?append_to_response=credits,videos,similar,recommendations,keywords,content_ratings&api_key=${KEY}`
    ),

  getMovie: (id: number) =>
    fetchJSON<TMDBMovie>(`${BASE}/movie/${id}?api_key=${KEY}`),

  getShow: (id: number) =>
    fetchJSON<TMDBShow & { seasons: TMDBSeason[] }>(`${BASE}/tv/${id}?api_key=${KEY}`),

  getSeason: (showId: number, season: number) =>
    fetchJSON<TMDBSeason>(`${BASE}/tv/${showId}/season/${season}?api_key=${KEY}`),

  // Person
  getPersonDetails: (id: number) =>
    fetchJSON<TMDBPersonDetails>(
      `${BASE}/person/${id}?append_to_response=movie_credits,tv_credits&api_key=${KEY}`
    ),

  // Collection / Franchise
  getCollection: (id: number) =>
    fetchJSON<TMDBCollection>(`${BASE}/collection/${id}?api_key=${KEY}`),

  imageUrl: (path: string | null, size = "w500") =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,

  backdropUrl: (path: string | null) =>
    path ? `https://image.tmdb.org/t/p/original${path}` : null,
}
