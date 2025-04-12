import { 
  users, channels, viewStats, currentBoosting, contentCalendar, channelRecommendations, geoViewStats,
  type User, type InsertUser, 
  type Channel, type InsertChannel,
  type ViewStat, type InsertViewStat,
  type CurrentBoosting, type InsertCurrentBoosting,
  type ContentCalendar, type InsertContentCalendar,
  type ChannelRecommendation, type InsertChannelRecommendation,
  type GeoViewStat, type InsertGeoViewStat,
  type UserStats, type Video, type CalendarEvent, type ChannelImpactScore, type GeoViewMetrics, type DeviceViewMetrics
} from "@shared/schema";

export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Channel related methods
  getChannel(id: number): Promise<Channel | undefined>;
  getChannelByYoutubeId(channelId: string): Promise<Channel | undefined>;
  getVerifiedChannels(): Promise<Channel[]>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  
  // View stats related methods
  createViewStat(viewStat: InsertViewStat): Promise<ViewStat>;
  getUserStats(userId: number): Promise<UserStats>;
  
  // Current boosting related methods
  getCurrentBoosting(userId: number): Promise<CurrentBoosting | undefined>;
  startBoosting(boosting: InsertCurrentBoosting): Promise<CurrentBoosting>;
  stopBoosting(userId: number): Promise<void>;
  updateBoostingProgress(userId: number, videoId: string, videosWatched: number): Promise<CurrentBoosting>;
  
  // Content Calendar methods
  getContentCalendarEvents(userId: number): Promise<CalendarEvent[]>;
  getContentCalendarEvent(id: number): Promise<ContentCalendar | undefined>;
  createContentCalendarEvent(calendarEvent: InsertContentCalendar): Promise<ContentCalendar>;
  updateContentCalendarEvent(id: number, calendarEvent: Partial<InsertContentCalendar>): Promise<ContentCalendar>;
  deleteContentCalendarEvent(id: number): Promise<void>;
  
  // Channel Recommendation methods
  getChannelRecommendations(userId: number): Promise<ChannelImpactScore[]>;
  createChannelRecommendation(recommendation: InsertChannelRecommendation): Promise<ChannelRecommendation>;
  updateChannelRecommendationEngagement(id: number, viewsActual: number): Promise<ChannelRecommendation>;
  
  // Geographic Analytics methods
  createGeoViewStat(geoViewStat: InsertGeoViewStat): Promise<GeoViewStat>;
  getGeoViewMetrics(userId: number): Promise<GeoViewMetrics[]>;
  getDeviceViewMetrics(userId: number): Promise<DeviceViewMetrics[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private channels: Map<number, Channel>;
  private viewStats: ViewStat[];
  private currentBoosting: Map<number, CurrentBoosting>;
  private contentCalendars: Map<number, ContentCalendar>;
  private channelRecs: Map<number, ChannelRecommendation>;
  private geoViewStats: GeoViewStat[];
  private userIdCounter: number;
  private channelIdCounter: number;
  private viewStatIdCounter: number;
  private boostingIdCounter: number;
  private calendarIdCounter: number;
  private recIdCounter: number;
  private geoViewStatIdCounter: number;

  constructor() {
    this.users = new Map();
    this.channels = new Map();
    this.viewStats = [];
    this.currentBoosting = new Map();
    this.contentCalendars = new Map();
    this.channelRecs = new Map();
    this.geoViewStats = [];
    this.userIdCounter = 1;
    this.channelIdCounter = 1;
    this.viewStatIdCounter = 1;
    this.boostingIdCounter = 1;
    this.calendarIdCounter = 1;
    this.recIdCounter = 1;
    this.geoViewStatIdCounter = 1;
    
    // Initialize with some default verified channels
    this.initializeDefaultChannels();
  }

  private initializeDefaultChannels() {
    const defaultChannels: InsertChannel[] = [
      {
        channelId: "UC6Bkb7sGltQ8BNgwxw9B2ow",
        name: "Beast Philanthropy",
        description: "MrBeast's charity focused on alleviating hunger and helping communities in need.",
        thumbnailUrl: "https://yt3.googleusercontent.com/ytc/APkrFKY455xp_gvuLt0o2-5I0-tZKWurbrtCgkbBp0Mq=s176-c-k-c0x00ffffff-no-rj",
        bannerUrl: "https://i.ytimg.com/vi/ylD6sQHfRwI/maxresdefault.jpg",
        category: "Humanitarian",
        isVerified: true
      },
      {
        channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
        name: "MrBeast",
        description: "Known for massive philanthropy projects and charitable giveaways to help those in need.",
        thumbnailUrl: "https://yt3.googleusercontent.com/ytc/APkrFKZWeMCsx4Q9e_Hm6T4hpOUoPhFR7UfxBFxBPwxJ=s176-c-k-c0x00ffffff-no-rj",
        bannerUrl: "https://i.ytimg.com/vi/n2RUGifq7bE/maxresdefault.jpg",
        category: "Humanitarian",
        isVerified: true
      },
      {
        channelId: "UCRijo3ddMTht_IHyNSNXpNQ",
        name: "TeamTrees",
        description: "Environmental initiative to plant 20 million trees around the globe to combat deforestation.",
        thumbnailUrl: "https://yt3.googleusercontent.com/ytc/APkrFKafTTV3Qc9MfAxSWuGVh_Ud5LK-uIrK1ozgrLZU=s176-c-k-c0x00ffffff-no-rj",
        bannerUrl: "https://i.ytimg.com/vi/U7nJBFjKqAY/maxresdefault.jpg",
        category: "Environmental",
        isVerified: true
      },
      {
        channelId: "UCfALHWisCfxbD0CRxTUYYGQ",
        name: "World Food Programme",
        description: "The world's largest humanitarian organization saving lives in emergencies and building prosperity.",
        thumbnailUrl: "https://yt3.googleusercontent.com/ytc/APkrFKbwAjMWw-NCDNO8kUkq8S8mH64VJvlTKDYwHMcq=s176-c-k-c0x00ffffff-no-rj",
        bannerUrl: "https://i.ytimg.com/vi/BcbgaW1RZQQ/maxresdefault.jpg",
        category: "Humanitarian",
        isVerified: true
      }
    ];

    defaultChannels.forEach(channel => this.createChannel(channel));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.googleId === googleId);
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...userData, 
      id, 
      createdAt: new Date(),
      avatarUrl: userData.avatarUrl || null 
    };
    this.users.set(id, user);
    return user;
  }
  
  // Channel methods
  async getChannel(id: number): Promise<Channel | undefined> {
    return this.channels.get(id);
  }
  
  async getChannelByYoutubeId(channelId: string): Promise<Channel | undefined> {
    return Array.from(this.channels.values()).find(channel => channel.channelId === channelId);
  }
  
  async getVerifiedChannels(): Promise<Channel[]> {
    return Array.from(this.channels.values()).filter(channel => channel.isVerified);
  }
  
  async createChannel(channelData: InsertChannel): Promise<Channel> {
    const id = this.channelIdCounter++;
    const channel: Channel = { 
      ...channelData, 
      id, 
      createdAt: new Date(),
      description: channelData.description || null,
      thumbnailUrl: channelData.thumbnailUrl || null,
      bannerUrl: channelData.bannerUrl || null,
      category: channelData.category || null,
      isVerified: channelData.isVerified ?? true
    };
    this.channels.set(id, channel);
    return channel;
  }
  
  // View stats methods
  async createViewStat(viewStatData: InsertViewStat): Promise<ViewStat> {
    const id = this.viewStatIdCounter++;
    const viewStat: ViewStat = { ...viewStatData, id, createdAt: new Date() };
    this.viewStats.push(viewStat);
    return viewStat;
  }
  
  async getUserStats(userId: number): Promise<UserStats> {
    const userViewStats = this.viewStats.filter(stat => stat.userId === userId);
    
    const totalViews = userViewStats.length;
    
    // Calculate total view time in seconds
    const sessionTime = userViewStats.reduce((total, stat) => total + stat.viewDuration, 0);
    
    // Get unique channels viewed
    const channelIds = new Set(userViewStats.map(stat => stat.channelId));
    const channelsSupported = channelIds.size;
    
    // Calculate views by channel
    const viewsByChannelMap = new Map<string, { views: number, channelName: string }>();
    
    for (const stat of userViewStats) {
      const channel = await this.getChannelByYoutubeId(stat.channelId);
      if (!viewsByChannelMap.has(stat.channelId)) {
        viewsByChannelMap.set(stat.channelId, { 
          views: 1, 
          channelName: channel?.name || stat.channelId 
        });
      } else {
        const current = viewsByChannelMap.get(stat.channelId)!;
        viewsByChannelMap.set(stat.channelId, { 
          ...current, 
          views: current.views + 1 
        });
      }
    }
    
    // Convert to array and calculate percentages
    const viewsByChannel = Array.from(viewsByChannelMap.entries()).map(([channelId, data]) => ({
      channelId,
      channelName: data.channelName,
      views: data.views,
      percentage: Math.round((data.views / totalViews) * 100)
    }));
    
    // Sort by views (descending)
    viewsByChannel.sort((a, b) => b.views - a.views);
    
    return {
      totalViews,
      channelsSupported,
      sessionTime,
      viewsByChannel
    };
  }
  
  // Current boosting methods
  async getCurrentBoosting(userId: number): Promise<CurrentBoosting | undefined> {
    return this.currentBoosting.get(userId);
  }
  
  async startBoosting(boostingData: InsertCurrentBoosting): Promise<CurrentBoosting> {
    // Check if user is already boosting, if so, stop it first
    if (this.currentBoosting.has(boostingData.userId)) {
      await this.stopBoosting(boostingData.userId);
    }
    
    const id = this.boostingIdCounter++;
    const now = new Date();
    const boosting: CurrentBoosting = {
      ...boostingData,
      id,
      startTime: now,
      lastUpdated: now,
      videosWatched: 0,
      activeVideoId: boostingData.activeVideoId || null
    };
    
    this.currentBoosting.set(boostingData.userId, boosting);
    return boosting;
  }
  
  async stopBoosting(userId: number): Promise<void> {
    this.currentBoosting.delete(userId);
  }
  
  async updateBoostingProgress(userId: number, videoId: string, videosWatched: number): Promise<CurrentBoosting> {
    const boosting = this.currentBoosting.get(userId);
    
    if (!boosting) {
      throw new Error("No active boosting session found for this user");
    }
    
    const updated: CurrentBoosting = {
      ...boosting,
      activeVideoId: videoId,
      videosWatched,
      lastUpdated: new Date()
    };
    
    this.currentBoosting.set(userId, updated);
    return updated;
  }

  // Content Calendar methods
  async getContentCalendarEvents(userId: number): Promise<CalendarEvent[]> {
    const events = Array.from(this.contentCalendars.values())
      .filter(event => event.userId === userId)
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    
    const result: CalendarEvent[] = [];
    
    for (const event of events) {
      const channel = await this.getChannelByYoutubeId(event.channelId);
      
      result.push({
        id: event.id,
        title: event.title,
        description: event.description || undefined,
        scheduledDate: event.scheduledDate,
        channelName: channel?.name || event.channelId,
        channelId: event.channelId,
        thumbnailUrl: channel?.thumbnailUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.channelId)}&background=random`,
        videoCount: event.videoIds?.length || 0,
        status: event.status as 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
      });
    }
    
    return result;
  }
  
  async getContentCalendarEvent(id: number): Promise<ContentCalendar | undefined> {
    return this.contentCalendars.get(id);
  }
  
  async createContentCalendarEvent(calendarEvent: InsertContentCalendar): Promise<ContentCalendar> {
    const id = this.calendarIdCounter++;
    const now = new Date();
    
    const event: ContentCalendar = {
      ...calendarEvent,
      id,
      description: calendarEvent.description || null,
      status: calendarEvent.status || 'scheduled',
      videoIds: calendarEvent.videoIds || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.contentCalendars.set(id, event);
    return event;
  }
  
  async updateContentCalendarEvent(id: number, calendarEvent: Partial<InsertContentCalendar>): Promise<ContentCalendar> {
    const existing = this.contentCalendars.get(id);
    
    if (!existing) {
      throw new Error("Calendar event not found");
    }
    
    const updated: ContentCalendar = {
      ...existing,
      ...calendarEvent,
      description: calendarEvent.description !== undefined ? (calendarEvent.description || null) : existing.description,
      status: calendarEvent.status || existing.status,
      updatedAt: new Date()
    };
    
    this.contentCalendars.set(id, updated);
    return updated;
  }
  
  async deleteContentCalendarEvent(id: number): Promise<void> {
    this.contentCalendars.delete(id);
  }
  
  // Channel Recommendation methods
  async getChannelRecommendations(userId: number): Promise<ChannelImpactScore[]> {
    const recommendations = Array.from(this.channelRecs.values())
      .filter(rec => rec.userId === userId)
      .sort((a, b) => Number(b.impactScore) - Number(a.impactScore));
    
    const result: ChannelImpactScore[] = [];
    
    for (const rec of recommendations) {
      const channel = await this.getChannelByYoutubeId(rec.channelId);
      
      result.push({
        channelId: rec.channelId,
        name: channel?.name || rec.channelId,
        thumbnailUrl: channel?.thumbnailUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(rec.channelId)}&background=random`,
        impactScore: Number(rec.impactScore),
        viewsPotential: rec.viewsPotential,
        viewsGenerated: rec.viewsActual,
        category: rec.category || channel?.category || 'Unknown',
        description: channel?.description,
        bannerUrl: channel?.bannerUrl
      });
    }
    
    return result;
  }
  
  async createChannelRecommendation(recommendation: InsertChannelRecommendation): Promise<ChannelRecommendation> {
    const id = this.recIdCounter++;
    
    const rec: ChannelRecommendation = {
      ...recommendation,
      id,
      category: recommendation.category || null,
      lastEngaged: recommendation.lastEngaged || null,
      recommendationDate: new Date()
    };
    
    this.channelRecs.set(id, rec);
    return rec;
  }
  
  async updateChannelRecommendationEngagement(id: number, viewsActual: number): Promise<ChannelRecommendation> {
    const existing = this.channelRecs.get(id);
    
    if (!existing) {
      throw new Error("Recommendation not found");
    }
    
    const updated: ChannelRecommendation = {
      ...existing,
      viewsActual,
      lastEngaged: new Date()
    };
    
    this.channelRecs.set(id, updated);
    return updated;
  }
  
  // Geographic Analytics methods
  async createGeoViewStat(geoViewStat: InsertGeoViewStat): Promise<GeoViewStat> {
    const id = this.geoViewStatIdCounter++;
    
    const stat: GeoViewStat = {
      ...geoViewStat,
      id,
      country: geoViewStat.country || null,
      region: geoViewStat.region || null,
      city: geoViewStat.city || null,
      ipAddress: geoViewStat.ipAddress || null,
      deviceType: geoViewStat.deviceType || null,
      browser: geoViewStat.browser || null,
      createdAt: new Date()
    };
    
    this.geoViewStats.push(stat);
    return stat;
  }
  
  async getGeoViewMetrics(userId: number): Promise<GeoViewMetrics[]> {
    const userGeoStats = this.geoViewStats.filter(stat => stat.userId === userId);
    
    const totalViews = userGeoStats.length;
    
    // Group by country
    const countryMap = new Map<string, number>();
    
    for (const stat of userGeoStats) {
      const country = stat.country || 'Unknown';
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    }
    
    return Array.from(countryMap.entries()).map(([country, count]) => ({
      country,
      count,
      percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0
    }));
  }
  
  async getDeviceViewMetrics(userId: number): Promise<DeviceViewMetrics[]> {
    const userGeoStats = this.geoViewStats.filter(stat => stat.userId === userId);
    
    const totalViews = userGeoStats.length;
    
    // Group by device type and browser
    const deviceMap = new Map<string, { count: number, browser?: string }>();
    
    for (const stat of userGeoStats) {
      const deviceType = stat.deviceType || 'Unknown';
      const key = `${deviceType}:${stat.browser || ''}`;
      
      if (!deviceMap.has(key)) {
        deviceMap.set(key, { count: 1, browser: stat.browser || undefined });
      } else {
        const current = deviceMap.get(key)!;
        deviceMap.set(key, { ...current, count: current.count + 1 });
      }
    }
    
    return Array.from(deviceMap.entries()).map(([key, data]) => {
      const [deviceType] = key.split(':');
      return {
        deviceType,
        browser: data.browser,
        count: data.count,
        percentage: totalViews > 0 ? Math.round((data.count / totalViews) * 100) : 0
      };
    });
  }
}

// Database implementation
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...userData,
      avatarUrl: userData.avatarUrl || null
    }).returning();
    return user;
  }
  
  // Channel methods
  async getChannel(id: number): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.id, id));
    return channel;
  }
  
  async getChannelByYoutubeId(channelId: string): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.channelId, channelId));
    return channel;
  }
  
  async getVerifiedChannels(): Promise<Channel[]> {
    return await db.select().from(channels).where(eq(channels.isVerified, true));
  }
  
  async createChannel(channelData: InsertChannel): Promise<Channel> {
    // Check if channel already exists
    const existing = await this.getChannelByYoutubeId(channelData.channelId);
    if (existing) {
      return existing;
    }
    
    const [channel] = await db.insert(channels).values({
      ...channelData,
      description: channelData.description || null,
      thumbnailUrl: channelData.thumbnailUrl || null,
      bannerUrl: channelData.bannerUrl || null,
      category: channelData.category || null,
      isVerified: channelData.isVerified ?? true
    }).returning();
    return channel;
  }
  
  // View stats methods
  async createViewStat(viewStatData: InsertViewStat): Promise<ViewStat> {
    const [viewStat] = await db.insert(viewStats).values(viewStatData).returning();
    return viewStat;
  }
  
  async getUserStats(userId: number): Promise<UserStats> {
    // Get total views
    const [viewCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(viewStats)
      .where(eq(viewStats.userId, userId));
    
    const totalViews = viewCountResult?.count || 0;
    
    // Calculate session time
    const [sessionTimeResult] = await db
      .select({ total: sql<number>`sum(${viewStats.viewDuration})` })
      .from(viewStats)
      .where(eq(viewStats.userId, userId));
    
    const sessionTime = sessionTimeResult?.total || 0;
    
    // Get unique channels viewed
    const [channelsResult] = await db
      .select({ count: sql<number>`count(distinct ${viewStats.channelId})` })
      .from(viewStats)
      .where(eq(viewStats.userId, userId));
    
    const channelsSupported = channelsResult?.count || 0;
    
    // Get views by channel with channel name
    const viewsByChannelQuery = await db
      .select({
        channelId: viewStats.channelId,
        views: sql<number>`count(*)`,
      })
      .from(viewStats)
      .where(eq(viewStats.userId, userId))
      .groupBy(viewStats.channelId);
    
    // Create a map of channelId to views
    const viewsByChannelMap = new Map<string, number>();
    for (const row of viewsByChannelQuery) {
      viewsByChannelMap.set(row.channelId, row.views);
    }
    
    // Get channel names for each channelId
    const viewsByChannel = [];
    // Convert Map entries to array to avoid TypeScript issues
    const entriesArray = Array.from(viewsByChannelMap.entries());
    for (let i = 0; i < entriesArray.length; i++) {
      const [channelId, views] = entriesArray[i];
      const [channel] = await db
        .select({ name: channels.name })
        .from(channels)
        .where(eq(channels.channelId, channelId));
      
      viewsByChannel.push({
        channelId,
        channelName: channel?.name || channelId,
        views,
        percentage: totalViews > 0 ? Math.round((views / totalViews) * 100) : 0
      });
    }
    
    // Sort by views (descending)
    viewsByChannel.sort((a, b) => b.views - a.views);
    
    return {
      totalViews,
      channelsSupported,
      sessionTime,
      viewsByChannel
    };
  }
  
  // Current boosting methods
  async getCurrentBoosting(userId: number): Promise<CurrentBoosting | undefined> {
    const [boosting] = await db
      .select()
      .from(currentBoosting)
      .where(eq(currentBoosting.userId, userId));
    
    return boosting;
  }
  
  async startBoosting(boostingData: InsertCurrentBoosting): Promise<CurrentBoosting> {
    // Check if user is already boosting, if so, stop it first
    const existing = await this.getCurrentBoosting(boostingData.userId);
    if (existing) {
      await this.stopBoosting(boostingData.userId);
    }
    
    const [boosting] = await db
      .insert(currentBoosting)
      .values({
        userId: boostingData.userId,
        channelId: boostingData.channelId,
        activeVideoId: boostingData.activeVideoId || null,
        startTime: new Date(),
        lastUpdated: new Date(),
        videosWatched: 0
      })
      .returning();
    
    return boosting;
  }
  
  async stopBoosting(userId: number): Promise<void> {
    await db
      .delete(currentBoosting)
      .where(eq(currentBoosting.userId, userId));
  }
  
  async updateBoostingProgress(userId: number, videoId: string, videosWatched: number): Promise<CurrentBoosting> {
    const [updated] = await db
      .update(currentBoosting)
      .set({
        activeVideoId: videoId,
        videosWatched,
        lastUpdated: new Date()
      })
      .where(eq(currentBoosting.userId, userId))
      .returning();
    
    if (!updated) {
      throw new Error("No active boosting session found for this user");
    }
    
    return updated;
  }

  // Content Calendar methods
  async getContentCalendarEvents(userId: number): Promise<CalendarEvent[]> {
    const events = await db
      .select()
      .from(contentCalendar)
      .where(eq(contentCalendar.userId, userId))
      .orderBy(contentCalendar.scheduledDate);
    
    const result: CalendarEvent[] = [];
    
    for (const event of events) {
      const channel = await this.getChannelByYoutubeId(event.channelId);
      
      result.push({
        id: event.id,
        title: event.title,
        description: event.description || undefined,
        scheduledDate: event.scheduledDate,
        channelName: channel?.name || event.channelId,
        channelId: event.channelId,
        thumbnailUrl: channel?.thumbnailUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.channelId)}&background=random`,
        videoCount: event.videoIds?.length || 0,
        status: event.status as 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
      });
    }
    
    return result;
  }
  
  async getContentCalendarEvent(id: number): Promise<ContentCalendar | undefined> {
    const [event] = await db
      .select()
      .from(contentCalendar)
      .where(eq(contentCalendar.id, id));
    
    return event;
  }
  
  async createContentCalendarEvent(calendarEvent: InsertContentCalendar): Promise<ContentCalendar> {
    const [event] = await db
      .insert(contentCalendar)
      .values({
        ...calendarEvent,
        description: calendarEvent.description || null,
        status: calendarEvent.status || 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return event;
  }
  
  async updateContentCalendarEvent(id: number, calendarEvent: Partial<InsertContentCalendar>): Promise<ContentCalendar> {
    const [updated] = await db
      .update(contentCalendar)
      .set({
        ...calendarEvent,
        updatedAt: new Date()
      })
      .where(eq(contentCalendar.id, id))
      .returning();
    
    if (!updated) {
      throw new Error("Calendar event not found");
    }
    
    return updated;
  }
  
  async deleteContentCalendarEvent(id: number): Promise<void> {
    await db
      .delete(contentCalendar)
      .where(eq(contentCalendar.id, id));
  }
  
  // Channel Recommendation methods
  async getChannelRecommendations(userId: number): Promise<ChannelImpactScore[]> {
    const recommendations = await db
      .select()
      .from(channelRecommendations)
      .where(eq(channelRecommendations.userId, userId))
      .orderBy(desc(channelRecommendations.impactScore));
    
    const result: ChannelImpactScore[] = [];
    
    for (const rec of recommendations) {
      const channel = await this.getChannelByYoutubeId(rec.channelId);
      
      result.push({
        channelId: rec.channelId,
        name: channel?.name || rec.channelId,
        thumbnailUrl: channel?.thumbnailUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(rec.channelId)}&background=random`,
        impactScore: Number(rec.impactScore),
        viewsPotential: rec.viewsPotential,
        viewsGenerated: rec.viewsActual,
        category: rec.category || channel?.category || 'Unknown',
        description: channel?.description,
        bannerUrl: channel?.bannerUrl
      });
    }
    
    return result;
  }
  
  async createChannelRecommendation(recommendation: InsertChannelRecommendation): Promise<ChannelRecommendation> {
    const [rec] = await db
      .insert(channelRecommendations)
      .values({
        ...recommendation,
        category: recommendation.category || null,
        lastEngaged: recommendation.lastEngaged || null,
        recommendationDate: new Date()
      })
      .returning();
    
    return rec;
  }
  
  async updateChannelRecommendationEngagement(id: number, viewsActual: number): Promise<ChannelRecommendation> {
    const [updated] = await db
      .update(channelRecommendations)
      .set({
        viewsActual,
        lastEngaged: new Date()
      })
      .where(eq(channelRecommendations.id, id))
      .returning();
    
    if (!updated) {
      throw new Error("Recommendation not found");
    }
    
    return updated;
  }
  
  // Geographic Analytics methods
  async createGeoViewStat(geoViewStat: InsertGeoViewStat): Promise<GeoViewStat> {
    const [stat] = await db
      .insert(geoViewStats)
      .values({
        ...geoViewStat,
        country: geoViewStat.country || null,
        region: geoViewStat.region || null,
        city: geoViewStat.city || null,
        ipAddress: geoViewStat.ipAddress || null,
        deviceType: geoViewStat.deviceType || null,
        browser: geoViewStat.browser || null
      })
      .returning();
    
    return stat;
  }
  
  async getGeoViewMetrics(userId: number): Promise<GeoViewMetrics[]> {
    // Get total views for percentage calculation
    const [viewCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(geoViewStats)
      .where(eq(geoViewStats.userId, userId));
    
    const totalViews = viewCountResult?.count || 0;
    
    // Get views by country
    const countryCounts = await db
      .select({
        country: geoViewStats.country,
        count: sql<number>`count(*)`
      })
      .from(geoViewStats)
      .where(eq(geoViewStats.userId, userId))
      .groupBy(geoViewStats.country);
    
    return countryCounts.map(row => ({
      country: row.country || 'Unknown',
      count: row.count,
      percentage: totalViews > 0 ? Math.round((row.count / totalViews) * 100) : 0
    }));
  }
  
  async getDeviceViewMetrics(userId: number): Promise<DeviceViewMetrics[]> {
    // Get total views for percentage calculation
    const [viewCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(geoViewStats)
      .where(eq(geoViewStats.userId, userId));
    
    const totalViews = viewCountResult?.count || 0;
    
    // Get views by device
    const deviceCounts = await db
      .select({
        deviceType: geoViewStats.deviceType,
        browser: geoViewStats.browser,
        count: sql<number>`count(*)`
      })
      .from(geoViewStats)
      .where(eq(geoViewStats.userId, userId))
      .groupBy(geoViewStats.deviceType, geoViewStats.browser);
    
    return deviceCounts.map(row => ({
      deviceType: row.deviceType || 'Unknown',
      browser: row.browser || undefined,
      count: row.count,
      percentage: totalViews > 0 ? Math.round((row.count / totalViews) * 100) : 0
    }));
  }
}

// Initialize default channels
async function initializeDefaultChannels(storage: DatabaseStorage) {
  const defaultChannels: InsertChannel[] = [
    {
      channelId: "UC6Bkb7sGltQ8BNgwxw9B2ow",
      name: "Beast Philanthropy",
      description: "MrBeast's charity focused on alleviating hunger and helping communities in need.",
      thumbnailUrl: "https://yt3.googleusercontent.com/ytc/APkrFKY455xp_gvuLt0o2-5I0-tZKWurbrtCgkbBp0Mq=s176-c-k-c0x00ffffff-no-rj",
      bannerUrl: "https://i.ytimg.com/vi/ylD6sQHfRwI/maxresdefault.jpg",
      category: "Humanitarian",
      isVerified: true
    },
    {
      channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
      name: "MrBeast",
      description: "Known for massive philanthropy projects and charitable giveaways to help those in need.",
      thumbnailUrl: "https://yt3.googleusercontent.com/ytc/APkrFKZWeMCsx4Q9e_Hm6T4hpOUoPhFR7UfxBFxBPwxJ=s176-c-k-c0x00ffffff-no-rj",
      bannerUrl: "https://i.ytimg.com/vi/n2RUGifq7bE/maxresdefault.jpg",
      category: "Humanitarian",
      isVerified: true
    },
    {
      channelId: "UCRijo3ddMTht_IHyNSNXpNQ",
      name: "TeamTrees",
      description: "Environmental initiative to plant 20 million trees around the globe to combat deforestation.",
      thumbnailUrl: "https://yt3.googleusercontent.com/ytc/APkrFKafTTV3Qc9MfAxSWuGVh_Ud5LK-uIrK1ozgrLZU=s176-c-k-c0x00ffffff-no-rj",
      bannerUrl: "https://i.ytimg.com/vi/U7nJBFjKqAY/maxresdefault.jpg",
      category: "Environmental",
      isVerified: true
    },
    {
      channelId: "UCfALHWisCfxbD0CRxTUYYGQ",
      name: "World Food Programme",
      description: "The world's largest humanitarian organization saving lives in emergencies and building prosperity.",
      thumbnailUrl: "https://yt3.googleusercontent.com/ytc/APkrFKbwAjMWw-NCDNO8kUkq8S8mH64VJvlTKDYwHMcq=s176-c-k-c0x00ffffff-no-rj",
      bannerUrl: "https://i.ytimg.com/vi/BcbgaW1RZQQ/maxresdefault.jpg",
      category: "Humanitarian",
      isVerified: true
    }
  ];

  for (const channel of defaultChannels) {
    await storage.createChannel(channel);
  }
}

// Export a singleton instance
export const storage = new DatabaseStorage();

// Initialize default channels
(async () => {
  try {
    await initializeDefaultChannels(storage as DatabaseStorage);
    console.log("Default channels initialized");
  } catch (error) {
    console.error("Failed to initialize default channels:", error);
  }
})();
