import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  googleId: text("google_id").notNull().unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  bannerUrl: text("banner_url"),
  category: text("category"),
  isVerified: boolean("is_verified").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const viewStats = pgTable("view_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  channelId: text("channel_id").notNull(),
  videoId: text("video_id").notNull(),
  viewDuration: integer("view_duration").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const currentBoosting = pgTable("current_boosting", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  channelId: text("channel_id").notNull(),
  startTime: timestamp("start_time").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  activeVideoId: text("active_video_id"),
  videosWatched: integer("videos_watched").default(0),
});

// New table for content calendar
export const contentCalendar = pgTable("content_calendar", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  channelId: text("channel_id").notNull(),
  videoIds: text("video_ids").array(),
  status: text("status").default("scheduled"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// New table for channel recommendations with impact scores
export const channelRecommendations = pgTable("channel_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  channelId: text("channel_id").notNull(),
  impactScore: real("impact_score").notNull(),
  viewsPotential: integer("views_potential").notNull(),
  viewsActual: integer("views_actual").default(0),
  category: text("category"),
  recommendationDate: timestamp("recommendation_date").defaultNow(),
  lastEngaged: timestamp("last_engaged"),
});

// New table for geographic analytics
export const geoViewStats = pgTable("geo_view_stats", {
  id: serial("id").primaryKey(),
  viewStatId: integer("view_stat_id").notNull(),
  userId: integer("user_id").notNull(),
  channelId: text("channel_id").notNull(),
  country: text("country"),
  region: text("region"),
  city: text("city"),
  ipAddress: text("ip_address"),
  deviceType: text("device_type"),
  browser: text("browser"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  googleId: true,
  avatarUrl: true,
});

export const insertChannelSchema = createInsertSchema(channels).pick({
  channelId: true,
  name: true,
  description: true,
  thumbnailUrl: true,
  bannerUrl: true,
  category: true,
  isVerified: true,
});

export const insertViewStatSchema = createInsertSchema(viewStats).pick({
  userId: true,
  channelId: true,
  videoId: true,
  viewDuration: true,
});

export const insertCurrentBoostingSchema = createInsertSchema(currentBoosting).pick({
  userId: true,
  channelId: true,
  activeVideoId: true,
});

export const insertContentCalendarSchema = createInsertSchema(contentCalendar).pick({
  userId: true,
  title: true,
  description: true,
  scheduledDate: true,
  channelId: true,
  videoIds: true,
  status: true,
});

export const insertChannelRecommendationSchema = createInsertSchema(channelRecommendations).pick({
  userId: true,
  channelId: true,
  impactScore: true,
  viewsPotential: true,
  viewsActual: true,
  category: true,
  lastEngaged: true,
});

export const insertGeoViewStatSchema = createInsertSchema(geoViewStats).pick({
  viewStatId: true,
  userId: true,
  channelId: true,
  country: true,
  region: true,
  city: true,
  ipAddress: true,
  deviceType: true,
  browser: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;

export type ViewStat = typeof viewStats.$inferSelect;
export type InsertViewStat = z.infer<typeof insertViewStatSchema>;

export type CurrentBoosting = typeof currentBoosting.$inferSelect;
export type InsertCurrentBoosting = z.infer<typeof insertCurrentBoostingSchema>;

export type ContentCalendar = typeof contentCalendar.$inferSelect;
export type InsertContentCalendar = z.infer<typeof insertContentCalendarSchema>;

export type ChannelRecommendation = typeof channelRecommendations.$inferSelect;
export type InsertChannelRecommendation = z.infer<typeof insertChannelRecommendationSchema>;

export type GeoViewStat = typeof geoViewStats.$inferSelect;
export type InsertGeoViewStat = z.infer<typeof insertGeoViewStatSchema>;

// Custom types
export interface UserStats {
  totalViews: number;
  channelsSupported: number;
  sessionTime: number;
  viewsByChannel: {
    channelId: string;
    channelName: string;
    views: number;
    percentage: number;
  }[];
}

export interface Video {
  videoId: string;
  title: string;
  duration: number;
  thumbnailUrl: string;
  status: 'queued' | 'playing' | 'completed';
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  scheduledDate: Date;
  channelName: string;
  channelId: string;
  thumbnailUrl: string;
  videoCount: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

export interface ChannelImpactScore {
  channelId: string;
  name: string;
  thumbnailUrl: string;
  impactScore: number;
  viewsPotential: number;
  viewsGenerated: number;
  category: string;
  description?: string;
  bannerUrl?: string;
}

export interface GeoViewMetrics {
  country: string;
  region?: string;
  city?: string;
  count: number;
  percentage: number;
}

export interface DeviceViewMetrics {
  deviceType: string;
  browser?: string;
  count: number;
  percentage: number;
}
