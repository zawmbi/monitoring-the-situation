-- ===========================================
-- MONITORED DATABASE SCHEMA
-- ===========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search

-- ---------------------------------------------
-- SOURCES TABLE
-- Track all content sources (news sites, Twitter accounts, subreddits)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- 'news_api', 'twitter', 'reddit', 'rss'
    identifier VARCHAR(500) NOT NULL,  -- API source ID, username, subreddit, or feed URL
    enabled BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',  -- Source-specific configuration
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(type, identifier)
);

-- ---------------------------------------------
-- ARTICLES TABLE  
-- Normalized storage for all content types
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    external_id VARCHAR(500),  -- ID from the source (tweet ID, article URL hash, etc)
    content_type VARCHAR(50) NOT NULL,  -- 'article', 'tweet', 'reddit_post'
    
    -- Core content
    title TEXT,
    content TEXT,
    summary TEXT,
    url TEXT,
    image_url TEXT,
    
    -- Metadata
    author VARCHAR(255),
    author_handle VARCHAR(255),  -- Twitter handle, Reddit username
    author_avatar_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Engagement metrics (for social)
    likes_count INTEGER DEFAULT 0,
    retweets_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    
    -- Organization
    categories TEXT[],  -- ['technology', 'business']
    tags TEXT[],
    language VARCHAR(10) DEFAULT 'en',
    
    -- Internal
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicates
    UNIQUE(source_id, external_id)
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_articles_search 
ON articles USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- Time-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_articles_published 
ON articles(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_type_published 
ON articles(content_type, published_at DESC);

-- Source filtering
CREATE INDEX IF NOT EXISTS idx_articles_source 
ON articles(source_id, published_at DESC);

-- Category filtering
CREATE INDEX IF NOT EXISTS idx_articles_categories 
ON articles USING gin(categories);

-- ---------------------------------------------
-- USERS TABLE (for future auth)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    preferences JSONB DEFAULT '{}'
);

-- ---------------------------------------------
-- SAVED ARTICLES (bookmarks)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS saved_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, article_id)
);

-- ---------------------------------------------
-- FEED CONFIGURATIONS
-- Custom feeds users can create
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS custom_feeds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    filters JSONB NOT NULL,  -- {sources: [...], categories: [...], keywords: [...]}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------
-- SEED DEFAULT SOURCES
-- ---------------------------------------------
INSERT INTO sources (name, type, identifier, config) VALUES
    -- News APIs
    ('NewsAPI - Top Headlines', 'news_api', 'top-headlines', '{"country": "us"}'),
    ('NewsAPI - Technology', 'news_api', 'technology', '{"category": "technology"}'),
    ('NewsAPI - Business', 'news_api', 'business', '{"category": "business"}'),
    
    -- RSS Feeds
    ('BBC News', 'rss', 'https://feeds.bbci.co.uk/news/rss.xml', '{}'),
    ('Reuters', 'rss', 'https://www.reutersagency.com/feed/', '{}'),
    ('NY Times', 'rss', 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', '{}'),
    ('TechCrunch', 'rss', 'https://techcrunch.com/feed/', '{}'),
    ('Hacker News', 'rss', 'https://hnrss.org/frontpage', '{}'),
    
    -- Twitter accounts (placeholder - needs API access)
    ('Reuters Twitter', 'twitter', 'Reuters', '{}'),
    ('AP Twitter', 'twitter', 'AP', '{}'),
    ('BBC Breaking', 'twitter', 'BBCBreaking', '{}'),
    
    -- Reddit
    ('r/news', 'reddit', 'news', '{"sort": "hot"}'),
    ('r/worldnews', 'reddit', 'worldnews', '{"sort": "hot"}'),
    ('r/technology', 'reddit', 'technology', '{"sort": "hot"}')
ON CONFLICT (type, identifier) DO NOTHING;

-- ---------------------------------------------
-- DEMO USER
-- ---------------------------------------------
INSERT INTO users (id, email, preferences) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'demo@example.com', '{"theme": "dark"}')
ON CONFLICT (email) DO NOTHING;
