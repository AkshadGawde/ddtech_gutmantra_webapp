# 📸 Instagram Reels Integration - Complete Guide

## Overview

Automatically sync Instagram reels from your store account to your website's "See us in Action" section using Meta's Instagram Graph API.

---

## Step 1: Get Instagram API Credentials

### 1.1 Create Meta App (if not already done)

1. Go to https://developers.facebook.com/
2. Create new app → Choose "Business" type
3. Add product → Instagram Graph API
4. Go to Settings → Basic
5. Copy: **App ID** and **App Secret**

### 1.2 Connect Your Instagram Business Account

1. Go to your Meta Business Account: https://business.facebook.com/
2. Settings → Instagram Accounts
3. Connect your `gutmantra_store` Instagram business account
4. Get your **Instagram Business Account ID** (16 digits)

### 1.3 Generate Access Token

**Long-lived Token (recommended for production)**:

```bash
# Step 1: Get short-lived token
curl -X GET "https://graph.instagram.com/v20.0/me/ig_hashtag_search?user_id=YOUR_BUSINESS_ACCOUNT_ID&fields=id,name" \
  -H "Authorization: Bearer YOUR_APP_TOKEN"

# Step 2: Convert to long-lived token
curl -X GET "https://graph.instagram.com/v20.0/oauth/access_token?grant_type=ig_refresh_token&access_token=SHORT_LIVED_TOKEN" \
  -H "Authorization: Bearer YOUR_APP_SECRET"
```

**OR use Facebook App Dashboard**:
1. Go to https://developers.facebook.com/
2. Tools → Access Token Tool
3. Select your Instagram app
4. Generate token
5. Copy the access token

---

## Step 2: Add to Backend .env

```env
# Instagram API Configuration
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841400000000000
INSTAGRAM_ACCESS_TOKEN=your_long_lived_token_here
INSTAGRAM_API_VERSION=v20.0
INSTAGRAM_GRAPH_API_URL=https://graph.instagram.com
```

---

## Step 3: Create Backend Route

### Create `src/routes/instagramRoutes.ts`

```typescript
import express, { Request, Response } from 'express';
import axios from 'axios';
import { db } from '../config/firebase';

const router = express.Router();

const INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_API_VERSION = process.env.INSTAGRAM_API_VERSION || 'v20.0';
const INSTAGRAM_GRAPH_API_URL = process.env.INSTAGRAM_GRAPH_API_URL || 'https://graph.instagram.com';

interface InstagramReel {
  id: string;
  caption: string;
  media_type: string;
  media_url: string;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
}

/**
 * GET /api/instagram/reels
 * Fetches latest Instagram reels from business account
 */
router.get('/reels', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit || 10;

    const response = await axios.get(
      `${INSTAGRAM_GRAPH_API_URL}/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/ig_hashtag_search`,
      {
        params: {
          fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
          limit,
          access_token: INSTAGRAM_ACCESS_TOKEN,
        },
      }
    );

    // Alternative: Get posts directly
    const postsResponse = await axios.get(
      `${INSTAGRAM_GRAPH_API_URL}/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`,
      {
        params: {
          fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
          limit,
          access_token: INSTAGRAM_ACCESS_TOKEN,
        },
      }
    );

    const reels: InstagramReel[] = postsResponse.data.data
      .filter((item: any) => item.media_type === 'VIDEO' || item.media_type === 'CAROUSEL')
      .map((item: any) => ({
        id: item.id,
        caption: item.caption || '',
        media_type: item.media_type,
        media_url: item.media_url,
        permalink: item.permalink,
        timestamp: item.timestamp,
        like_count: item.like_count || 0,
        comments_count: item.comments_count || 0,
      }));

    return res.status(200).json({
      success: true,
      data: reels,
      count: reels.length,
    });
  } catch (error: any) {
    console.error('Instagram API Error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Instagram reels',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/instagram/reels/:reelId
 * Fetch single reel details
 */
router.get('/reels/:reelId', async (req: Request, res: Response) => {
  try {
    const { reelId } = req.params;

    const response = await axios.get(
      `${INSTAGRAM_GRAPH_API_URL}/${reelId}`,
      {
        params: {
          fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,insights.metric(engagement,impressions,reach)',
          access_token: INSTAGRAM_ACCESS_TOKEN,
        },
      }
    );

    const reel: InstagramReel = {
      id: response.data.id,
      caption: response.data.caption || '',
      media_type: response.data.media_type,
      media_url: response.data.media_url,
      permalink: response.data.permalink,
      timestamp: response.data.timestamp,
      like_count: response.data.like_count || 0,
      comments_count: response.data.comments_count || 0,
    };

    return res.status(200).json({
      success: true,
      data: reel,
    });
  } catch (error: any) {
    console.error('Instagram API Error:', error.response?.data || error.message);
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
    });
  }
});

/**
 * POST /api/instagram/sync-reels
 * Manually sync Instagram reels to Firestore cache
 */
router.post('/sync-reels', async (req: Request, res: Response) => {
  try {
    const postsResponse = await axios.get(
      `${INSTAGRAM_GRAPH_API_URL}/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`,
      {
        params: {
          fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
          limit: 20,
          access_token: INSTAGRAM_ACCESS_TOKEN,
        },
      }
    );

    const reels: InstagramReel[] = postsResponse.data.data
      .filter((item: any) => item.media_type === 'VIDEO' || item.media_type === 'CAROUSEL')
      .slice(0, 10)
      .map((item: any) => ({
        id: item.id,
        caption: item.caption || '',
        media_type: item.media_type,
        media_url: item.media_url,
        permalink: item.permalink,
        timestamp: item.timestamp,
        like_count: item.like_count || 0,
        comments_count: item.comments_count || 0,
      }));

    // Cache in Firestore
    const cacheRef = db.collection('cache').doc('instagram_reels');
    await cacheRef.set({
      reels,
      lastUpdated: new Date(),
      count: reels.length,
    });

    return res.status(200).json({
      success: true,
      message: 'Reels synced successfully',
      count: reels.length,
    });
  } catch (error: any) {
    console.error('Sync Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync reels',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/instagram/reels/cached
 * Get cached reels from Firestore
 */
router.get('/reels/cached', async (req: Request, res: Response) => {
  try {
    const cacheRef = db.collection('cache').doc('instagram_reels');
    const doc = await cacheRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'No cached reels found. Run sync first.',
      });
    }

    const data = doc.data();
    return res.status(200).json({
      success: true,
      data: data?.reels || [],
      lastUpdated: data?.lastUpdated,
      count: data?.count || 0,
    });
  } catch (error: any) {
    console.error('Cache Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch cached reels',
    });
  }
});

export default router;
```

---

## Step 4: Update Backend Server

Add to `src/server.ts`:

```typescript
import instagramRoutes from './routes/instagramRoutes';

// Register route
app.use('/api/instagram', instagramRoutes);
```

---

## Step 5: Frontend Component

Create `src/components/InstagramReelsSection.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import './InstagramReelsSection.css';

interface Reel {
  id: string;
  caption: string;
  media_url: string;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
}

const InstagramReelsSection: React.FC = () => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/instagram/reels?limit=10`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch reels');
      }

      const data = await response.json();
      setReels(data.data || []);
    } catch (err) {
      console.error('Error fetching reels:', err);
      setError('Unable to load reels. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="instagram-section">
        <h2>See us in <span className="highlight">Action</span></h2>
        <div className="loading">Loading Instagram reels...</div>
      </section>
    );
  }

  return (
    <section className="instagram-section">
      <h2>See us in <span className="highlight">Action</span></h2>
      
      {error && <p className="error">{error}</p>}
      
      <div className="reels-grid">
        {reels.length > 0 ? (
          reels.map((reel) => (
            <a
              key={reel.id}
              href={reel.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="reel-card"
            >
              <div className="reel-media">
                <img
                  src={reel.media_url}
                  alt={reel.caption}
                  className="reel-image"
                />
                <div className="reel-overlay">
                  <div className="play-icon">▶</div>
                </div>
              </div>
              
              <div className="reel-info">
                <p className="caption">{reel.caption.substring(0, 100)}...</p>
                <div className="stats">
                  <span className="likes">❤️ {reel.like_count}</span>
                  <span className="comments">💬 {reel.comments_count}</span>
                </div>
              </div>
            </a>
          ))
        ) : (
          <p className="no-reels">No reels found</p>
        )}
      </div>

      <div className="instagram-cta">
        <a
          href="https://instagram.com/gutmantra_store"
          target="_blank"
          rel="noopener noreferrer"
          className="follow-button"
        >
          Follow on Instagram →
        </a>
      </div>
    </section>
  );
};

export default InstagramReelsSection;
```

---

## Step 6: Styling

Create `src/components/InstagramReelsSection.css`:

```css
.instagram-section {
  padding: 60px 40px;
  background: #f9f9f9;
  border-radius: 12px;
  margin: 40px 0;
}

.instagram-section h2 {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 40px;
  text-align: center;
}

.instagram-section h2 .highlight {
  color: #ff6b35;
}

.reels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.reel-card {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: white;
  transition: transform 0.3s ease;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.reel-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.reel-media {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  overflow: hidden;
  background: #000;
}

.reel-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reel-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.reel-card:hover .reel-overlay {
  opacity: 1;
}

.play-icon {
  font-size: 48px;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.reel-info {
  padding: 16px;
}

.caption {
  margin: 0 0 8px;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}

.stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
}

.instagram-cta {
  text-align: center;
}

.follow-button {
  display: inline-block;
  padding: 12px 32px;
  background: linear-gradient(45deg, #f58529, #dd2a7b, #8134af);
  color: white;
  text-decoration: none;
  border-radius: 24px;
  font-weight: 600;
  transition: transform 0.3s ease;
}

.follow-button:hover {
  transform: scale(1.05);
}

.loading,
.error,
.no-reels {
  text-align: center;
  padding: 40px;
  font-size: 16px;
  color: #666;
}

.error {
  color: #e74c3c;
}

@media (max-width: 768px) {
  .instagram-section {
    padding: 40px 20px;
  }

  .instagram-section h2 {
    font-size: 32px;
  }

  .reels-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
}
```

---

## Step 7: Auto-Sync Setup

### Option A: Manual Trigger Button

Add to component:
```typescript
<button onClick={() => fetch('/api/instagram/sync-reels', {method: 'POST'})}>
  Sync Reels
</button>
```

### Option B: Scheduled Sync (Using Scheduled Tasks)

Create a scheduled task to sync every day:

```typescript
// This would run daily via scheduled task
const syncInstagramReels = async () => {
  const response = await fetch('http://localhost:5000/api/instagram/sync-reels', {
    method: 'POST'
  });
  return response.json();
};
```

### Option C: Webhook (When You Post)

Use Instagram Webhooks to auto-sync when you post:

1. Go to Meta App Dashboard
2. Messenger → Webhooks
3. Subscribe to `instagram_post_creation` event
4. Backend receives webhook → Auto-syncs reels

---

## Environment Variables

Add to `.env`:

```env
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841400000000000
INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token_here
INSTAGRAM_API_VERSION=v20.0
INSTAGRAM_GRAPH_API_URL=https://graph.instagram.com
```

---

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/instagram/reels` | GET | Get latest reels from Instagram |
| `/api/instagram/reels/:reelId` | GET | Get single reel details |
| `/api/instagram/reels/cached` | GET | Get cached reels from Firestore |
| `/api/instagram/sync-reels` | POST | Manually sync reels to cache |

---

## Test the Integration

```bash
# 1. Test backend endpoint
curl http://localhost:5000/api/instagram/reels?limit=10

# 2. Test manual sync
curl -X POST http://localhost:5000/api/instagram/sync-reels

# 3. Check cached reels
curl http://localhost:5000/api/instagram/reels/cached
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check access token is valid and long-lived |
| No reels found | Ensure account has video posts. Check account ID |
| API rate limit | Wait before making more requests or upgrade app |
| Missing fields | Ensure token has required permissions |
| Webhook not working | Verify webhook URL and token in Meta dashboard |

---

## Notes

✅ Works with Instagram Business Accounts only
✅ Displays videos and carousel posts
✅ Shows likes, comments, captions
✅ Links directly to Instagram posts
✅ Auto-refreshable
✅ Firestore caching for performance
✅ Responsive mobile design

---

**Done! Your website will now pull reels automatically from Instagram!** 📸
