export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string
  backdrop_path: string
  release_date: string
  vote_average: number
  genre_ids?: number[]
  media_type?: 'movie'
}

export interface TMDBShow {
  id: number
  name: string
  overview: string
  poster_path: string
  backdrop_path: string
  first_air_date: string
  vote_average: number
  number_of_seasons: number
  genre_ids?: number[]
  media_type?: 'tv'
}

export type TMDBMedia = TMDBMovie | TMDBShow

export interface TMDBEpisode {
  id: number
  name: string
  episode_number: number
  season_number: number
  overview: string
  still_path: string
  air_date: string
}

export interface TMDBSeason {
  id: number
  name: string
  season_number: number
  episode_count: number
  poster_path: string
  air_date: string
  episodes?: TMDBEpisode[]
}

export interface RoomUser {
  id: string
  name: string
  isHost: boolean
  joinedAt: number
}

export interface RoomState {
  roomId: string
  hostId: string
  users: RoomUser[]
  currentMedia: {
    tmdbId: number
    mediaType: 'movie' | 'tv'
    season: number
    episode: number
  }
  playbackState: {
    currentTime: number
    isPlaying: boolean
    lastUpdated: number
  }
}

export interface PlayerEvent {
  event: 'timeupdate' | 'play' | 'pause' | 'ended' | 'seeked'
  currentTime: number
  duration: number
  progress: number
  id: string
  mediaType: 'movie' | 'tv'
  season: number
  episode: number
  timestamp: number
}

export interface ChatMessage {
  id: number
  userName: string
  message: string
  timestamp: number
  isSystem?: boolean
}

export interface AppSettings {
  partyMode: boolean
  autoplay: boolean
  playbackSpeed: number
  colorScheme: string
}

export interface TMDBGenre {
  id: number
  name: string
}

export interface TMDBListResponse<T> {
  results: T[]
}

export interface TMDBPerson {
  id: number
  name: string
  profile_path: string | null
  character?: string
  job?: string
  known_for_department?: string
}

export interface TMDBCredits {
  cast: TMDBPerson[]
  crew: TMDBPerson[]
}

export interface TMDBVideo {
  key: string
  site: string
  type: string
  name: string
}

export interface TMDBKeyword {
  id: number
  name: string
}

export interface TMDBCollection {
  id: number
  name: string
  overview?: string
  poster_path?: string
  parts: TMDBMedia[]
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number
  genres: TMDBGenre[]
  belongs_to_collection?: { id: number; name: string; poster_path?: string }
  credits: TMDBCredits
  videos: { results: TMDBVideo[] }
  similar: { results: TMDBMedia[] }
  recommendations: { results: TMDBMedia[] }
  keywords?: { keywords: TMDBKeyword[] }
  release_dates?: { results: { iso_3166_1: string; release_dates: { certification: string; type: number }[] }[] }
}

export interface TMDBShowDetails extends TMDBShow {
  episode_run_time: number[]
  genres: TMDBGenre[]
  seasons?: TMDBSeason[]
  credits: TMDBCredits
  videos: { results: TMDBVideo[] }
  similar: { results: TMDBMedia[] }
  recommendations: { results: TMDBMedia[] }
  keywords?: { results: TMDBKeyword[] }
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] }
}

export interface TMDBPersonDetails {
  id: number
  name: string
  biography: string
  profile_path: string | null
  known_for_department: string
  movie_credits: { cast: TMDBMedia[] }
  tv_credits: { cast: TMDBMedia[] }
}

export interface DiscoverParams {
  genres?: number[]
  sortBy?: string
  decadeStart?: number
  decadeEnd?: number
  runtimeLte?: number
  runtimeGte?: number
  voteAverageGte?: number
  voteCountGte?: number
  voteCountLte?: number
  language?: string
  page?: number
  primaryReleaseDateGte?: string
  firstAirDateGte?: string
}
