/**
 * Social Media Service
 * Handles Twitter/X, Reddit, BlueSky, TruthSocial, and Instagram integrations
 */

import config from '../config/index.js';
import { cacheService } from './cache.service.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const CACHE_KEYS = {
  tweets: 'social:tweets',
  tweetsByUser: (user) => `social:tweets:${user}`,
  reddit: 'social:reddit',
  redditBySub: (sub) => `social:reddit:${sub}`,
  bluesky: 'social:bluesky',
  blueskyByUser: (user) => `social:bluesky:${user}`,
  truthsocial: 'social:truthsocial',
  instagram: 'social:instagram',
};

class SocialService {
  constructor() {
    this.hasTwitter = Boolean(config.twitter.enabled && config.twitter.bearerToken);
    this.hasReddit = Boolean(config.reddit.clientId && config.reddit.clientSecret);
    this.hasBluesky = Boolean(config.bluesky?.enabled);
    this.hasTruthSocial = Boolean(config.truthSocial?.enabled);
    this.hasInstagram = Boolean(config.instagram?.accessToken);
  }

  // ==========================================
  // TWITTER/X
  // ==========================================

  /**
   * Fetch tweets from Twitter API v2
   */
  async fetchTweets(username) {
    if (!this.hasTwitter) {
      return this.getCustomTweets();
    }

    try {
      // First get user ID
      const userResponse = await fetch(
        `https://api.twitter.com/2/users/by/username/${username}`,
        {
          headers: { 'Authorization': `Bearer ${config.twitter.bearerToken}` }
        }
      );
      const userData = await userResponse.json();
      
      if (!userData.data?.id) return [];

      // Then get tweets
      const tweetsResponse = await fetch(
        `https://api.twitter.com/2/users/${userData.data.id}/tweets?` +
        `max_results=10&tweet.fields=created_at,public_metrics,author_id&` +
        `expansions=author_id&user.fields=name,username,profile_image_url`,
        {
          headers: { 'Authorization': `Bearer ${config.twitter.bearerToken}` }
        }
      );
      const tweetsData = await tweetsResponse.json();

      return (tweetsData.data || []).map(tweet => 
        this.normalizeTweet(tweet, tweetsData.includes?.users?.[0])
      );
    } catch (error) {
      console.error('[Twitter] Fetch error:', error.message);
      return this.getCustomTweets();
    }
  }

  /**
   * Get tweets from configured accounts
   */
  async getTweets() {
    const cacheKey = CACHE_KEYS.tweets;
    
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    // If no Twitter auth, try custom feed and return early
    if (!this.hasTwitter) {
      const custom = await this.getCustomTweets();
      await cacheService.set(cacheKey, custom, config.cache.tweets);
      return custom;
    }

    const allTweets = [];
    for (const account of config.twitter.accounts) {
      const tweets = await this.fetchTweets(account);
      allTweets.push(...tweets);
    }
    // Sort by date
    allTweets.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    await cacheService.set(cacheKey, allTweets, config.cache.tweets);
    return allTweets;
  }

  /**
   * Normalize tweet to common format
   */
  normalizeTweet(tweet, user) {
    return {
      id: `tweet-${tweet.id}`,
      contentType: 'tweet',
      source: 'twitter',
      sourceName: 'Twitter',
      title: null,
      content: tweet.text,
      summary: tweet.text?.substring(0, 140),
      url: `https://twitter.com/${user?.username}/status/${tweet.id}`,
      imageUrl: null,
      author: user?.name || 'Unknown',
      authorHandle: user?.username ? `@${user.username}` : null,
      authorAvatarUrl: user?.profile_image_url,
      publishedAt: tweet.created_at,
      likesCount: tweet.public_metrics?.like_count || 0,
      retweetsCount: tweet.public_metrics?.retweet_count || 0,
      repliesCount: tweet.public_metrics?.reply_count || 0,
      fetchedAt: new Date().toISOString(),
    };
  }

  // ==========================================
  // REDDIT
  // ==========================================

  /**
   * Fetch posts from a subreddit
   */
  async fetchRedditPosts(subreddit, sort = 'hot', limit = 10) {
    try {
      // Reddit allows unauthenticated requests with proper User-Agent
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`,
        {
          headers: { 'User-Agent': config.reddit.userAgent }
        }
      );
      
      const data = await response.json();
      return (data.data?.children || []).map(post => 
        this.normalizeRedditPost(post.data, subreddit)
      );
    } catch (error) {
      console.error('[Reddit] Fetch error:', error.message);
      return this.getMockRedditPosts(subreddit);
    }
  }

  /**
   * Get posts from configured subreddits
   */
  async getRedditPosts() {
    const cacheKey = CACHE_KEYS.reddit;
    
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const allPosts = [];
    for (const subreddit of config.reddit.subreddits) {
      const posts = await this.fetchRedditPosts(subreddit);
      allPosts.push(...posts);
    }

    // Sort by score
    allPosts.sort((a, b) => b.likesCount - a.likesCount);

    await cacheService.set(cacheKey, allPosts, config.cache.tweets);
    return allPosts;
  }

  /**
   * Normalize Reddit post to common format
   */
  normalizeRedditPost(post, subreddit) {
    return {
      id: `reddit-${post.id}`,
      contentType: 'reddit_post',
      source: 'reddit',
      sourceName: `r/${subreddit}`,
      title: post.title,
      content: post.selftext || null,
      summary: post.selftext?.substring(0, 200) || post.title,
      url: post.url?.startsWith('/') 
        ? `https://reddit.com${post.url}` 
        : `https://reddit.com${post.permalink}`,
      imageUrl: post.thumbnail?.startsWith('http') ? post.thumbnail : null,
      author: post.author,
      authorHandle: `u/${post.author}`,
      publishedAt: new Date(post.created_utc * 1000).toISOString(),
      likesCount: post.score || 0,
      repliesCount: post.num_comments || 0,
      fetchedAt: new Date().toISOString(),
    };
  }

  // ==========================================
  // BLUESKY (AT Protocol — public, no auth required)
  // ==========================================

  /**
   * Fetch posts from a BlueSky account via public AT Protocol API
   * Free tier: no auth needed for public reads; rate limit ~3000 req/5min
   */
  async fetchBlueskyPosts(handle) {
    try {
      // Resolve handle to DID
      const resolveRes = await fetch(
        `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`
      );
      if (!resolveRes.ok) {
        console.warn(`[BlueSky] Could not resolve handle ${handle}: ${resolveRes.status}`);
        return [];
      }
      const { did } = await resolveRes.json();

      // Fetch author feed
      const feedRes = await fetch(
        `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(did)}&limit=15&filter=posts_no_replies`
      );
      if (!feedRes.ok) {
        console.warn(`[BlueSky] Feed fetch failed for ${handle}: ${feedRes.status}`);
        return [];
      }
      const feedData = await feedRes.json();
      return (feedData.feed || []).map(item => this.normalizeBlueskyPost(item, handle));
    } catch (err) {
      console.error(`[BlueSky] Error fetching ${handle}:`, err.message);
      return [];
    }
  }

  normalizeBlueskyPost(item, fallbackHandle) {
    const post = item.post;
    const record = post?.record || {};
    const author = post?.author || {};
    const uri = post?.uri || '';
    // Convert at:// URI to web URL
    const rkey = uri.split('/').pop();
    const webUrl = `https://bsky.app/profile/${author.handle || fallbackHandle}/post/${rkey}`;

    return {
      id: `bsky-${post?.cid || rkey}`,
      contentType: 'bluesky_post',
      source: 'bluesky',
      sourceName: 'BlueSky',
      title: null,
      content: record.text || '',
      summary: (record.text || '').substring(0, 200),
      url: webUrl,
      imageUrl: post?.embed?.images?.[0]?.thumb || null,
      author: author.displayName || author.handle || fallbackHandle,
      authorHandle: `@${author.handle || fallbackHandle}`,
      authorAvatarUrl: author.avatar || null,
      publishedAt: record.createdAt || post?.indexedAt || new Date().toISOString(),
      likesCount: post?.likeCount || 0,
      retweetsCount: post?.repostCount || 0,
      repliesCount: post?.replyCount || 0,
      fetchedAt: new Date().toISOString(),
    };
  }

  async getBlueskyPosts() {
    if (!this.hasBluesky) return [];

    const cacheKey = CACHE_KEYS.bluesky;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const accounts = config.bluesky?.accounts || [];
    const allPosts = [];
    for (const handle of accounts) {
      const posts = await this.fetchBlueskyPosts(handle);
      allPosts.push(...posts);
    }
    allPosts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    await cacheService.set(cacheKey, allPosts, config.cache.tweets);
    return allPosts;
  }

  // ==========================================
  // TRUTH SOCIAL (public RSS feeds)
  // ==========================================

  /**
   * Fetch TruthSocial posts via public RSS proxy
   * Uses a public RSS bridge since TruthSocial has no official API
   * Rate limits depend on the bridge service used
   */
  async fetchTruthSocialPosts(username) {
    // TruthSocial doesn't have an official API — use their public pages
    // which serve JSON-LD or fall back to RSS bridge
    try {
      const feedUrl = config.truthSocial?.rssBridgeUrl
        ? `${config.truthSocial.rssBridgeUrl}?action=display&bridge=TruthSocialBridge&context=By+username&username=${encodeURIComponent(username)}&format=Json`
        : `https://truthsocial.com/api/v1/accounts/lookup?acct=${encodeURIComponent(username)}`;

      const res = await fetch(feedUrl, {
        headers: { 'User-Agent': 'monitr/1.0' },
      });
      if (!res.ok) {
        console.warn(`[TruthSocial] Fetch failed for ${username}: ${res.status}`);
        return [];
      }

      // If using Mastodon-compatible API (TruthSocial is a Mastodon fork)
      if (!config.truthSocial?.rssBridgeUrl) {
        const account = await res.json();
        if (!account?.id) return [];

        const statusesRes = await fetch(
          `https://truthsocial.com/api/v1/accounts/${account.id}/statuses?limit=15&exclude_replies=true`,
          { headers: { 'User-Agent': 'monitr/1.0' } }
        );
        if (!statusesRes.ok) return [];
        const statuses = await statusesRes.json();
        return (Array.isArray(statuses) ? statuses : []).map(s => this.normalizeTruthSocialPost(s, username));
      }

      // RSS bridge JSON format
      const data = await res.json();
      return (data.items || []).map(item => ({
        id: `truth-${item.id || Date.now()}`,
        contentType: 'truthsocial_post',
        source: 'truthsocial',
        sourceName: 'Truth Social',
        title: null,
        content: item.content_text || item.title || '',
        summary: (item.content_text || item.title || '').substring(0, 200),
        url: item.url || `https://truthsocial.com/@${username}`,
        imageUrl: item.image || null,
        author: username,
        authorHandle: `@${username}`,
        authorAvatarUrl: null,
        publishedAt: item.date_published || new Date().toISOString(),
        likesCount: 0,
        retweetsCount: 0,
        repliesCount: 0,
        fetchedAt: new Date().toISOString(),
      }));
    } catch (err) {
      console.error(`[TruthSocial] Error fetching ${username}:`, err.message);
      return [];
    }
  }

  normalizeTruthSocialPost(status, fallbackUsername) {
    // Strip HTML tags from content
    const text = (status.content || '').replace(/<[^>]+>/g, '');
    return {
      id: `truth-${status.id}`,
      contentType: 'truthsocial_post',
      source: 'truthsocial',
      sourceName: 'Truth Social',
      title: null,
      content: text,
      summary: text.substring(0, 200),
      url: status.url || `https://truthsocial.com/@${fallbackUsername}/${status.id}`,
      imageUrl: status.media_attachments?.[0]?.preview_url || null,
      author: status.account?.display_name || fallbackUsername,
      authorHandle: `@${status.account?.username || fallbackUsername}`,
      authorAvatarUrl: status.account?.avatar || null,
      publishedAt: status.created_at || new Date().toISOString(),
      likesCount: status.favourites_count || 0,
      retweetsCount: status.reblogs_count || 0,
      repliesCount: status.replies_count || 0,
      fetchedAt: new Date().toISOString(),
    };
  }

  async getTruthSocialPosts() {
    if (!this.hasTruthSocial) return [];

    const cacheKey = CACHE_KEYS.truthsocial;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const accounts = config.truthSocial?.accounts || [];
    const allPosts = [];
    for (const username of accounts) {
      const posts = await this.fetchTruthSocialPosts(username);
      allPosts.push(...posts);
    }
    allPosts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    await cacheService.set(cacheKey, allPosts, config.cache.tweets);
    return allPosts;
  }

  // ==========================================
  // INSTAGRAM (Meta Graph API)
  // ==========================================

  /**
   * Fetch Instagram posts via Meta Graph API
   * Requires Instagram Basic Display API or Instagram Graph API token
   * Free tier: 200 calls/user/hour (Basic Display), 200 calls/hour (Graph API)
   */
  async fetchInstagramPosts() {
    if (!this.hasInstagram) return [];

    try {
      const token = config.instagram.accessToken;
      // Instagram Basic Display API — fetch user's own media
      const res = await fetch(
        `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=15&access_token=${encodeURIComponent(token)}`
      );
      if (!res.ok) {
        console.warn(`[Instagram] API error: ${res.status}`);
        return [];
      }
      const data = await res.json();
      return (data.data || []).map(post => this.normalizeInstagramPost(post));
    } catch (err) {
      console.error('[Instagram] Error:', err.message);
      return [];
    }
  }

  normalizeInstagramPost(post) {
    return {
      id: `ig-${post.id}`,
      contentType: 'instagram_post',
      source: 'instagram',
      sourceName: 'Instagram',
      title: null,
      content: post.caption || '',
      summary: (post.caption || '').substring(0, 200),
      url: post.permalink,
      imageUrl: post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url,
      author: null,
      authorHandle: null,
      authorAvatarUrl: null,
      publishedAt: post.timestamp || new Date().toISOString(),
      likesCount: post.like_count || 0,
      repliesCount: post.comments_count || 0,
      fetchedAt: new Date().toISOString(),
    };
  }

  async getInstagramPosts() {
    if (!this.hasInstagram) return [];

    const cacheKey = CACHE_KEYS.instagram;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const posts = await this.fetchInstagramPosts();
    await cacheService.set(cacheKey, posts, config.cache.tweets);
    return posts;
  }

  // ==========================================
  // COMBINED SOCIAL FEED
  // ==========================================

  /**
   * Get all social posts from all enabled platforms
   */
  async getAllSocialPosts() {
    const results = await Promise.allSettled([
      this.getTweets(),
      this.getRedditPosts(),
      this.getBlueskyPosts(),
      this.getTruthSocialPosts(),
      this.getInstagramPosts(),
    ]);

    const all = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        all.push(...r.value);
      }
    }
    all.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    return all;
  }

  // ==========================================
  // CUSTOM DATA (for development/offline)
  // ==========================================

  async getCustomTweets() {
    const customPath = config.twitter.customFeedPath;
    if (!customPath) return [];

    try {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const resolved = path.resolve(__dirname, '..', customPath);
      const file = await fs.readFile(resolved, 'utf-8');
      const data = JSON.parse(file);
      if (!Array.isArray(data)) return [];
      return data.map((tweet, idx) => ({
        id: tweet.id || `tweet-custom-${idx}`,
        contentType: 'tweet',
        source: tweet.source || 'twitter',
        sourceName: tweet.sourceName || 'Twitter',
        title: tweet.title || null,
        content: tweet.content || tweet.text || '',
        summary: tweet.summary || tweet.content || tweet.text || '',
        url: tweet.url || null,
        imageUrl: tweet.imageUrl || null,
        author: tweet.author || tweet.handle || null,
        authorHandle: tweet.authorHandle || tweet.handle || null,
        authorAvatarUrl: tweet.authorAvatarUrl || null,
        publishedAt: tweet.publishedAt || new Date().toISOString(),
        likesCount: tweet.likesCount || 0,
        retweetsCount: tweet.retweetsCount || 0,
        repliesCount: tweet.repliesCount || 0,
        fetchedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('[Twitter] Custom feed load error:', error.message);
      return [];
    }
  }

  getMockRedditPosts(subreddit = 'news') {
    const mockPosts = [
      {
        title: 'New study shows significant progress in cancer treatment research',
        score: 15234,
        comments: 1456,
        author: 'science_enthusiast',
        hoursAgo: 2,
      },
      {
        title: 'International space collaboration announces ambitious new mission',
        score: 12567,
        comments: 987,
        author: 'space_watcher',
        hoursAgo: 4,
      },
      {
        title: 'Historic preservation effort saves centuries-old landmark',
        score: 8934,
        comments: 567,
        author: 'history_buff',
        hoursAgo: 6,
      },
      {
        title: 'New transportation infrastructure project receives funding approval',
        score: 7823,
        comments: 1234,
        author: 'urban_planner',
        hoursAgo: 8,
      },
    ];

    return mockPosts.map((post, i) => ({
      id: `reddit-mock-${i}`,
      contentType: 'reddit_post',
      source: 'reddit',
      sourceName: `r/${subreddit}`,
      title: post.title,
      url: `https://reddit.com/r/${subreddit}/comments/${Date.now() - i}`,
      author: post.author,
      authorHandle: `u/${post.author}`,
      publishedAt: new Date(Date.now() - post.hoursAgo * 3600000).toISOString(),
      likesCount: post.score,
      repliesCount: post.comments,
      fetchedAt: new Date().toISOString(),
    }));
  }
}

export const socialService = new SocialService();
export default socialService;
