import express from 'express';
import { createServer as createViteServer } from 'vite';
import { TwitterApi } from 'twitter-api-v2';
import { OAuth2Client } from 'google-auth-library';
import session from 'express-session';
import axios from 'axios';
import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve('users.json');
const SESSIONS_FILE = path.resolve('processed_sessions.json');

// Simple file-based database
function getUsers() {
    if (!fs.existsSync(DB_FILE)) return {};
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function saveUsers(users: any) {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

function getProcessedSessions(): string[] {
    if (!fs.existsSync(SESSIONS_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
    } catch {
        return [];
    }
}

function markSessionProcessed(sessionId: string) {
    const sessions = getProcessedSessions();
    if (!sessions.includes(sessionId)) {
        sessions.push(sessionId);
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    }
}

let stripe: Stripe | null = null;
const getStripe = () => {
    if (!stripe && process.env.STRIPE_SECRET_KEY) {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripe;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', 1);

  // Stripe Webhook needs raw body for signature verification
  app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const stripeInstance = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeInstance || !webhookSecret || !sig) {
        console.log('Webhook skipped: Missing stripe instance, secret, or signature');
        return res.status(400).send('Webhook Error');
    }

    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionId = session.id;
        const email = session.metadata?.email;
        const planName = session.metadata?.planName;
        const creditsToAdd = parseInt(session.metadata?.credits || '0');
        const subscriptionId = session.subscription as string;

        const processedSessions = getProcessedSessions();
        if (processedSessions.includes(sessionId)) {
            console.log(`Webhook: Session ${sessionId} already processed. Skipping.`);
            return res.json({ received: true });
        }

        if (email && planName && creditsToAdd > 0) {
            const users = getUsers();
            if (users[email]) {
                users[email].credits = creditsToAdd;
                users[email].plan = planName;
                users[email].subscriptionId = subscriptionId;
                users[email].subscriptionStatus = 'active';
                saveUsers(users);
                markSessionProcessed(sessionId);
                console.log(`Webhook: Updated subscription for ${email}. Plan: ${planName}`);
            }
        }
    }

    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;
        const users = getUsers();
        const email = subscription.metadata?.email;
        
        // Find user by subscription ID if metadata email is missing
        const userEmail = email || Object.keys(users).find(key => users[key].subscriptionId === subscription.id);

        if (userEmail && users[userEmail]) {
            users[userEmail].subscriptionStatus = subscription.status;
            if (subscription.status !== 'active') {
                console.log(`Webhook: Subscription ${subscription.id} for ${userEmail} is now ${subscription.status}`);
            }
            saveUsers(users);
        }
    }

    if (event.type === 'invoice.payment_failed') {
        const invoice = event.data.object as Stripe.Invoice;
        const users = getUsers();
        const userEmail = Object.keys(users).find(key => users[key].subscriptionId === invoice.subscription);

        if (userEmail && users[userEmail]) {
            users[userEmail].subscriptionStatus = 'past_due';
            saveUsers(users);
            console.log(`Webhook: Payment failed for ${userEmail}. Status set to past_due.`);
        }
    }

    res.json({ received: true });
  });

  app.use(express.json());
  app.use(session({
    secret: 'postai-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      sameSite: 'none',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  const getRedirectUri = () => {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const uri = `${appUrl.replace(/\/$/, '')}/auth/google/callback`;
    console.log('Using Redirect URI:', uri);
    return uri;
  };

  app.get('/api/auth/google/url', (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
        return res.status(500).json({ error: 'Google OAuth not configured' });
    }
    const url = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
      redirect_uri: getRedirectUri()
    });
    res.json({ url });
  });

  app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await googleClient.getToken({
        code: code as string,
        redirect_uri: getRedirectUri()
      });
      
      const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });

      const profile = userInfoResponse.data;
      const users = getUsers();
      
      if (!users[profile.email]) {
        users[profile.email] = {
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          credits: 5, // Default free credits
          plan: 'Free',
          createdAt: new Date().toISOString()
        };
        saveUsers(users);
      }

      (req.session as any).userEmail = profile.email;
      
      // Force session save before sending response
      req.session.save((err) => {
        if (err) console.error('Session save error:', err);
        console.log('User logged in and session saved:', profile.email);

        res.send(`
          <html>
            <body>
              <script>
                console.log('Auth success, sending message to opener');
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'OAUTH_AUTH_SUCCESS', 
                    email: '${profile.email}' 
                  }, '*');
                  setTimeout(() => window.close(), 1000);
                } else {
                  window.location.href = '/';
                }
              </script>
              <div style="text-align: center; font-family: sans-serif; padding-top: 50px;">
                  <h2>Authentication Successful!</h2>
                  <p>Welcome, ${profile.name}!</p>
                  <p>This window will close automatically in a second.</p>
              </div>
            </body>
          </html>
        `);
      });
    } catch (error) {
      console.error('Google Auth Error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  app.get('/api/auth/me', (req, res) => {
    // Fallback to header if session cookie is blocked by iframe restrictions
    const email = (req.session as any).userEmail || req.headers['x-user-email'];
    
    console.log('Checking auth for /api/auth/me. Session Email:', (req.session as any).userEmail, 'Header Email:', req.headers['x-user-email']);
    
    if (!email) return res.json({ user: null });
    
    const users = getUsers();
    const user = users[email as string];
    console.log('User found in DB:', !!user);
    res.json({ user });
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Logout error:', err);
        res.json({ success: true });
    });
  });

  app.post('/api/user/deduct-credits', (req, res) => {
    const email = (req.session as any).userEmail || req.headers['x-user-email'];
    if (!email) return res.status(401).json({ error: 'Unauthorized' });
    
    const { amount } = req.body;
    const users = getUsers();
    const user = users[email as string];
    
    if (user.credits < amount) {
        return res.status(400).json({ error: 'Insufficient credits' });
    }
    
    user.credits -= amount;
    saveUsers(users);
    res.json({ success: true, credits: user.credits });
  });

  // Stripe Checkout
  app.post('/api/create-checkout-session', async (req, res) => {
    const email = (req.session as any).userEmail || req.headers['x-user-email'];
    if (!email) {
        console.error('Create Session Error: Unauthorized');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { planName, price, credits } = req.body;
    const stripeInstance = getStripe();
    
    if (!stripeInstance) {
        console.error('Create Session Error: Stripe not configured (Missing STRIPE_SECRET_KEY)');
        return res.status(500).json({ error: 'Stripe not configured' });
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    console.log('Creating Stripe session for:', email, 'Plan:', planName, 'App URL:', appUrl);

    try {
        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `PostAI ${planName} Plan`,
                            description: `${credits} Credits for AI Content Generation`,
                        },
                        unit_amount: price * 100,
                        recurring: { interval: 'month' },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${appUrl.replace(/\/$/, '')}/plans?session_id={CHECKOUT_SESSION_ID}&plan=${planName}&credits=${credits}`,
            cancel_url: `${appUrl.replace(/\/$/, '')}/plans`,
            customer_email: email as string,
            subscription_data: {
                metadata: {
                    email: email as string,
                    planName,
                    credits: credits.toString()
                }
            },
            metadata: {
                email: email as string,
                planName,
                credits: credits.toString()
            }
        });

        console.log('Stripe session created successfully:', session.id);
        res.json({ id: session.id, url: session.url });
    } catch (error: any) {
        console.error('Stripe Session Error Detail:', error);
        res.status(500).json({ error: error.message });
    }
  });

  // Handle successful payment (Simplified for demo, use webhooks for production)
  app.post('/api/payment/success', async (req, res) => {
    const email = (req.session as any).userEmail || req.headers['x-user-email'];
    const { sessionId } = req.body;

    if (!email) return res.status(401).json({ error: 'Unauthorized' });

    const stripeInstance = getStripe();
    if (!stripeInstance) return res.status(500).json({ error: 'Stripe not configured' });

    try {
        const processedSessions = getProcessedSessions();
        if (processedSessions.includes(sessionId)) {
            const users = getUsers();
            return res.json({ success: true, user: users[email as string] });
        }

        const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === 'paid' && session.metadata?.email === email) {
            const users = getUsers();
            const user = users[email as string];
            
            const planName = session.metadata.planName;
            const creditsToSet = parseInt(session.metadata.credits);

            user.credits = creditsToSet; // Set to plan credits, don't add
            user.plan = planName;
            user.subscriptionId = session.subscription as string;
            user.subscriptionStatus = 'active';
            saveUsers(users);
            markSessionProcessed(sessionId);

            res.json({ success: true, user });
        } else {
            res.status(400).json({ error: 'Payment not verified' });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/share/twitter', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        // You will need to add your Twitter API keys to your environment variables
        const client = new TwitterApi({
            appKey: process.env.TWITTER_API_KEY!,
            appSecret: process.env.TWITTER_API_KEY_SECRET!,
            accessToken: process.env.TWITTER_ACCESS_TOKEN!,
            accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
        });

        const { data: createdTweet } = await client.v2.tweet(text);
        res.json({ success: true, tweet: createdTweet });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to post to Twitter' });
    }
});

// API routes will go here

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
