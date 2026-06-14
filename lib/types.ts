// Database types
export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  website: string | null
  is_admin: boolean
  is_banned: boolean
  theme_preference: string
  notification_email: boolean
  notification_push: boolean
  locale: string
  created_at: string
  updated_at: string
}

export interface Collection {
  id: string
  user_id: string
  name: string
  description: string | null
  cover_url: string | null
  is_public: boolean
  item_count: number
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface CollectionItem {
  id: string
  collection_id: string
  item_type: 'artist' | 'album' | 'track'
  item_mbid: string | null
  item_name: string
  item_artist: string | null
  item_image: string | null
  item_url: string | null
  position: number
  notes: string | null
  added_at: string
}

export interface List {
  id: string
  user_id: string
  title: string
  description: string | null
  cover_url: string | null
  is_public: boolean
  is_ranked: boolean
  item_count: number
  likes_count: number
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface ListItem {
  id: string
  list_id: string
  item_type: 'artist' | 'album' | 'track'
  item_mbid: string | null
  item_name: string
  item_artist: string | null
  item_image: string | null
  item_url: string | null
  position: number
  comment: string | null
  added_at: string
}

export interface Review {
  id: string
  user_id: string
  item_type: 'artist' | 'album' | 'track'
  item_mbid: string | null
  item_name: string
  item_artist: string | null
  item_image: string | null
  item_url: string | null
  rating: number | null
  title: string | null
  content: string | null
  is_public: boolean
  is_featured?: boolean
  likes_count: number
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'follow' | 'like_review' | 'like_list' | 'new_review' | 'new_list' | 'mention'
  title: string
  message: string | null
  link: string | null
  actor_id: string | null
  is_read: boolean
  created_at: string
  profiles?: Profile
}

export interface Activity {
  id: string
  user_id: string
  type: 'review' | 'list' | 'collection' | 'follow' | 'like'
  target_type: string | null
  target_id: string | null
  target_name: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  profiles?: Profile
}

export interface Conversation {
  id: string
  created_at: string
  updated_at: string
}

export interface ConversationParticipant {
  conversation_id: string
  user_id: string
  last_read_at: string | null
  joined_at: string
  profiles?: Profile
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface ConversationPreview {
  id: string
  updated_at: string
  other_user: Profile
  last_message: Message | null
  unread_count: number
}

export interface ProfileMusic {
  id: string
  user_id: string
  category: 'favorite' | 'recent' | 'now_playing'
  item_type: 'artist' | 'album' | 'track'
  item_mbid: string | null
  item_name: string
  item_artist: string | null
  item_image: string | null
  item_url: string | null
  position: number
  played_at: string | null
  created_at: string
}

export interface ProfileSummary extends Profile {
  followers_count: number
  following_count: number
  favorites_preview: ProfileMusic[]
  now_playing: ProfileMusic | null
  public_lists_count: number
}

// Last.fm API types
export interface LastFmImage {
  '#text': string
  size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega' | ''
}

export interface LastFmArtist {
  name: string
  mbid?: string
  url: string
  image?: LastFmImage[]
  listeners?: string
  playcount?: string
  streamable?: string
  bio?: {
    summary: string
    content: string
    published?: string
  }
  similar?: {
    artist: LastFmArtist[]
  }
  tags?: {
    tag: { name: string; url: string }[]
  }
  stats?: {
    listeners: string
    playcount: string
  }
}

export interface LastFmAlbum {
  name: string
  artist: string | { name: string; mbid?: string; url: string }
  mbid?: string
  url: string
  image?: LastFmImage[]
  listeners?: string
  playcount?: string
  tracks?: {
    track: LastFmTrack[]
  }
  tags?: {
    tag: { name: string; url: string }[]
  }
  wiki?: {
    summary: string
    content: string
    published?: string
  }
}

export interface LastFmTrack {
  name: string
  artist: string | { name: string; mbid?: string; url: string }
  mbid?: string
  url: string
  duration?: string
  listeners?: string
  playcount?: string
  image?: LastFmImage[]
  album?: {
    artist: string
    title: string
    mbid?: string
    url: string
    image?: LastFmImage[]
  }
  toptags?: {
    tag: { name: string; url: string }[]
  }
  wiki?: {
    summary: string
    content: string
    published?: string
  }
  '@attr'?: {
    rank: string
  }
}

export interface LastFmSearchResults {
  artists?: {
    artist: LastFmArtist[]
    '@attr': {
      for: string
    }
    'opensearch:totalResults': string
    'opensearch:startIndex': string
    'opensearch:itemsPerPage': string
  }
  albums?: {
    album: LastFmAlbum[]
    '@attr': {
      for: string
    }
    'opensearch:totalResults': string
    'opensearch:startIndex': string
    'opensearch:itemsPerPage': string
  }
  tracks?: {
    track: LastFmTrack[]
    '@attr': {
      for: string
    }
    'opensearch:totalResults': string
    'opensearch:startIndex': string
    'opensearch:itemsPerPage': string
  }
}

// Normalized types for UI
export interface MusicItem {
  type: 'artist' | 'album' | 'track'
  name: string
  artist?: string
  mbid?: string
  url: string
  image?: string
  listeners?: number
  playcount?: number
}

export interface SearchFilters {
  type: 'artist' | 'album' | 'track' | 'all'
  query: string
  page?: number
  limit?: number
}
