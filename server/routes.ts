import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertViewStatSchema, 
  insertContentCalendarSchema, 
  insertChannelRecommendationSchema, 
  insertGeoViewStatSchema 
} from "@shared/schema";
import Stripe from "stripe";

const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  console.error('Missing YOUTUBE_API_KEY environment variable');
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any,
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
      } catch (error) {
        console.error('Invalid message format:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
  
  // Broadcast to all connected clients
  function broadcastUpdate(type: string, data: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({ type, data }));
      }
    });
  }
  
  // API Routes
  
  // User routes
  app.post('/api/auth/google', async (req, res) => {
    try {
      const { googleId, email, name, avatar } = req.body;
      
      if (!googleId || !email || !name) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Check if user exists
      let user = await storage.getUserByGoogleId(googleId);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          googleId,
          email,
          username: name,
          avatarUrl: avatar
        });
      }
      
      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/user/stats', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Channel routes
  app.get('/api/channels', async (req, res) => {
    try {
      const channels = await storage.getVerifiedChannels();
      res.json(channels);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/channel/:channelId', async (req, res) => {
    try {
      const { channelId } = req.params;
      const channel = await storage.getChannelByYoutubeId(channelId);
      
      if (!channel) {
        return res.status(404).json({ message: 'Channel not found' });
      }
      
      res.json(channel);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // YouTube proxy routes
  app.get('/api/youtube/channel/:channelId/videos', async (req, res) => {
    try {
      const { channelId } = req.params;
      
      // Fetch channel info to get uploads playlist ID
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`
      );
      
      if (!channelResponse.ok) {
        return res.status(channelResponse.status).json({ 
          message: `YouTube API error: ${channelResponse.statusText}` 
        });
      }
      
      const channelData = await channelResponse.json();
      
      if (!channelData.items || channelData.items.length === 0) {
        return res.status(404).json({ message: 'Channel not found on YouTube' });
      }
      
      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
      
      // Fetch videos from uploads playlist
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${API_KEY}`
      );
      
      if (!videosResponse.ok) {
        return res.status(videosResponse.status).json({ 
          message: `YouTube API error: ${videosResponse.statusText}` 
        });
      }
      
      const videosData = await videosResponse.json();
      
      if (!videosData.items || videosData.items.length === 0) {
        return res.status(404).json({ message: 'No videos found for this channel' });
      }
      
      // Get video durations
      const videoIds = videosData.items.map((item: any) => item.contentDetails.videoId).join(',');
      
      const durationsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${API_KEY}`
      );
      
      if (!durationsResponse.ok) {
        return res.status(durationsResponse.status).json({ 
          message: `YouTube API error: ${durationsResponse.statusText}` 
        });
      }
      
      const durationsData = await durationsResponse.json();
      
      // Combine data
      const videos = videosData.items.map((item: any, index: number) => {
        const durationItem = durationsData.items.find((d: any) => d.id === item.contentDetails.videoId);
        const duration = durationItem ? parseDuration(durationItem.contentDetails.duration) : 300;
        
        return {
          videoId: item.contentDetails.videoId,
          title: item.snippet.title,
          thumbnailUrl: item.snippet.thumbnails.medium.url,
          duration: duration,
          status: 'queued'
        };
      });
      
      res.json(videos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Boosting routes
  app.post('/api/boosting/start', async (req, res) => {
    try {
      const { userId, channelId } = req.body;
      
      if (!userId || !channelId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const boosting = await storage.startBoosting({
        userId,
        channelId,
        activeVideoId: null
      });
      
      broadcastUpdate('boostingStarted', { userId, channelId });
      
      res.json(boosting);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/boosting/stop', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'Missing userId' });
      }
      
      await storage.stopBoosting(userId);
      
      broadcastUpdate('boostingStopped', { userId });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/boosting/current', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const boosting = await storage.getCurrentBoosting(userId);
      
      if (!boosting) {
        return res.status(404).json({ message: 'No active boosting session' });
      }
      
      res.json(boosting);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/view/count', async (req, res) => {
    try {
      const validationResult = insertViewStatSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid data', errors: validationResult.error });
      }
      
      const viewStat = await storage.createViewStat(validationResult.data);
      
      // Get the current boosting session and update it
      const boosting = await storage.getCurrentBoosting(viewStat.userId);
      
      if (boosting) {
        const updated = await storage.updateBoostingProgress(
          viewStat.userId,
          viewStat.videoId,
          (boosting.videosWatched || 0) + 1
        );
        
        broadcastUpdate('viewCounted', { 
          userId: viewStat.userId,
          channelId: viewStat.channelId,
          videoId: viewStat.videoId,
          boosting: updated
        });
      }
      
      res.json(viewStat);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Stripe payment routes for donations
  app.post('/api/create-payment-intent', async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not configured' });
      }
      
      const { amount, channelId, userId } = req.body;
      
      if (!amount || amount < 100) { // Minimum $1.00 donation
        return res.status(400).json({ message: 'Minimum donation amount is $1.00' });
      }
      
      // Get channel details for the payment description
      const channel = await storage.getChannelByYoutubeId(channelId);
      
      if (!channel) {
        return res.status(404).json({ message: 'Channel not found' });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          channelId,
          userId: userId ? userId.toString() : 'anonymous',
          channelName: channel.name
        },
        description: `Donation to ${channel.name}`,
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Stripe webhook handler for successful payments
  app.post('/api/stripe-webhook', async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not configured' });
      }
      
      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!sig || !webhookSecret) {
        return res.status(400).json({ message: 'Missing Stripe signature or webhook secret' });
      }
      
      let event;
      
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
      }
      
      // Handle the event
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        console.log(`Payment for ${paymentIntent.amount / 100} succeeded:`, paymentIntent.id);
        
        // Record the donation in your database if needed
        // Update analytics
        
        broadcastUpdate('donationReceived', {
          channelId: paymentIntent.metadata.channelId,
          amount: paymentIntent.amount / 100,
          userId: paymentIntent.metadata.userId
        });
      }
      
      res.json({ received: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Content Calendar routes
  app.get('/api/calendar/events', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const events = await storage.getContentCalendarEvents(userId);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/calendar/event/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }
      
      const event = await storage.getContentCalendarEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/calendar/event', async (req, res) => {
    try {
      const validationResult = insertContentCalendarSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid data', errors: validationResult.error });
      }
      
      const event = await storage.createContentCalendarEvent(validationResult.data);
      
      broadcastUpdate('calendarEventCreated', event);
      
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.patch('/api/calendar/event/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }
      
      // First, get the existing event
      const existingEvent = await storage.getContentCalendarEvent(id);
      
      if (!existingEvent) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      // Then update it
      const updated = await storage.updateContentCalendarEvent(id, req.body);
      
      broadcastUpdate('calendarEventUpdated', updated);
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete('/api/calendar/event/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }
      
      await storage.deleteContentCalendarEvent(id);
      
      broadcastUpdate('calendarEventDeleted', { id });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Channel Recommendation routes
  app.get('/api/recommendations', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const recommendations = await storage.getChannelRecommendations(userId);
      res.json(recommendations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/recommendation', async (req, res) => {
    try {
      const validationResult = insertChannelRecommendationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid data', errors: validationResult.error });
      }
      
      const recommendation = await storage.createChannelRecommendation(validationResult.data);
      
      broadcastUpdate('recommendationCreated', recommendation);
      
      res.json(recommendation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.patch('/api/recommendation/:id/engagement', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { viewsActual } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid recommendation ID' });
      }
      
      if (viewsActual === undefined || typeof viewsActual !== 'number') {
        return res.status(400).json({ message: 'viewsActual must be a number' });
      }
      
      const updated = await storage.updateChannelRecommendationEngagement(id, viewsActual);
      
      broadcastUpdate('recommendationEngagementUpdated', updated);
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Geographic Analytics routes
  app.post('/api/geo-stat', async (req, res) => {
    try {
      const validationResult = insertGeoViewStatSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid data', errors: validationResult.error });
      }
      
      const geoStat = await storage.createGeoViewStat(validationResult.data);
      
      res.json(geoStat);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/geo-metrics', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const metrics = await storage.getGeoViewMetrics(userId);
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/device-metrics', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const metrics = await storage.getDeviceViewMetrics(userId);
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  return httpServer;
}

// Helper function to parse YouTube duration format
function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = parseInt(match?.[1] || '0');
  const minutes = parseInt(match?.[2] || '0');
  const seconds = parseInt(match?.[3] || '0');
  return (hours * 3600) + (minutes * 60) + seconds;
}
