/**
 * Social Media Service
 * Handles Twitter/X and Reddit integrations
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
};

class SocialService {
  constructor() {
    this.hasTwitter = Boolean(config.twitter.enabled && config.twitter.bearerToken);
    this.hasReddit = Boolean(config.reddit.clientId && config.reddit.clientSecret);
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
