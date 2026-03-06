import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { TwitterApi } from 'twitter-api-v2';
import { OAuth2Client } from 'google-auth-library';
import session from 'express-session';
import axios from 'axios';
import Stripe from 'stripe';
import { getUserByEmail, upsertUser, updateUserByEmail } from './services/userService.js';
import { getProcessedSessionsFromDb, markSessionProcessedInDb } from './services/processedSessionService.js';
import { prisma } from './prisma/prismaClient.js';
import { uploadToGCPStorage } from './services/gcpStorageService.js';
import { Request } from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// --- Stripe Payment Methods API Route ---
import { getStripePaymentInfo } from './services/stripePaymentServices.js';

let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

async function startServer() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const app = express();
  const upload = multer({ limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB limit
  const PORT = Number(process.env.PORT) || 8080;

  app.set('trust proxy', 1);
  app.use(compression());

  // Health check endpoint for Cloud Run
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  // Serve static files from Vite build in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'dist'), { maxAge: '1y' }));
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
    });
  }

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

    console.log(event);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const sessionId = session.id;
      const email = session.metadata?.email;
      const planName = session.metadata?.planName;
      const creditsToAdd = parseInt(session.metadata?.credits || '0');
      const subscriptionId = session.subscription as string;
      const stripeCustomerId = typeof session.customer === 'string' ? session.customer : undefined;

      console.log('--- Stripe Webhook Debug ---');
      console.log('Event:', event.type);
      console.log('Session ID:', sessionId);
      console.log('Email:', email);
      console.log('Plan Name:', planName);
      console.log('Credits To Add:', creditsToAdd);
      console.log('Subscription ID:', subscriptionId);
      console.log('Stripe Customer ID:', stripeCustomerId);

      const processedSessions = await getProcessedSessionsFromDb();
      if (processedSessions.includes(sessionId)) {
        console.log(`Webhook: Session ${sessionId} already processed. Skipping.`);
        return res.json({ received: true });
      }

      if (email && planName && creditsToAdd > 0) {
        const user = await getUserByEmail(email);
        console.log('User found in Supabase:', user);
        if (user && user.id) {
          const updated = await updateUserByEmail(email, {
            credits: creditsToAdd,
            plan: planName,
            subscription_id: subscriptionId,
            subscription_status: 'active',
            ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
          });
          console.log('Update result:', updated);
          // Insert payment history record
          try {
            const amount = typeof session.amount_total === 'number' ? session.amount_total / 100 : undefined;
            await prisma.payment_history.create({
              data: {
                user_id: user.id,
                amount: amount ?? null,
                plan: planName,
                credits: creditsToAdd,
                stripe_session_id: sessionId,
                // created_at is handled by Prisma default
              },
            });
            console.log('Payment history recorded');
          } catch (err) {
            console.error('Failed to record payment history:', err);
          }
          await markSessionProcessedInDb(sessionId);
          console.log(`Webhook: Updated subscription for ${email}. Plan: ${planName}`);
        } else {
          console.error('No user found for email:', email);
        }
      }
    }

    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const email = subscription.metadata?.email;
      let userEmail = email;
      if (!userEmail && subscription.id) {
        // Fallback: find user by subscriptionId
        // This is a workaround; ideally, you should always have email in metadata
        // You may want to add a Supabase function to find by subscriptionId
      }
      if (userEmail) {
        await updateUserByEmail(userEmail, { subscription_status: subscription.status });
        if (subscription.status !== 'active') {
          console.log(`Webhook: Subscription ${subscription.id} for ${userEmail} is now ${subscription.status}`);
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      // You may want to add a Supabase function to find user by subscriptionId
      // For now, this is a placeholder
      // const userEmail = ...
      // if (userEmail) {
      //   await updateUserByEmail(userEmail, { subscription_status: 'past_due' });
      //   console.log(`Webhook: Payment failed for ${userEmail}. Status set to past_due.`);
      // }
    }

    res.json({ received: true });
  });

  app.use(express.json());
  app.use(session({
    secret: 'postai-secret-key',
    resave: false,
    saveUninitialized: false,
    proxy: true,
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
    const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 8080}`;
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
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/drive.file'
      ],
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
      let user = await getUserByEmail(profile.email);
      if (!user) {
        user = await upsertUser({
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          credits: 5, // Default free credits
          plan: 'Free',
          created_at: new Date().toISOString(),
        });
      }

      (req.session as any).userEmail = profile.email;

      // Force session save before sending response
      req.session.save((err) => {
        if (err) console.error('Session save error:', err);
        console.log('User logged in and session saved:', profile.email);

        // Send access token to frontend for Google Drive API usage
        res.send(`
          <html>
            <body>
              <script>
                console.log('Auth success, sending message to opener');
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'OAUTH_AUTH_SUCCESS', 
                    email: '${profile.email}',
                    accessToken: '${tokens.access_token}'
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

  app.get('/api/auth/me', async (req, res) => {
    // Fallback to header if session cookie is blocked by iframe restrictions
    const email = (req.session as any).userEmail || req.headers['x-user-email'];

    console.log('Checking auth for /api/auth/me. Session Email:', (req.session as any).userEmail, 'Header Email:', req.headers['x-user-email']);

    if (!email) return res.json({ user: null });
    const user = await getUserByEmail(email as string);
    console.log('User found in DB:', !!user);
    res.json({ user });
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) console.error('Logout error:', err);
      res.json({ success: true });
    });
  });

  app.post('/api/user/deduct-credits', async (req, res) => {
    const email = (req.session as any).userEmail || req.headers['x-user-email'];
    if (!email) return res.status(401).json({ error: 'Unauthorized' });

    const { amount } = req.body;
    const user = await getUserByEmail(email as string);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.credits < amount) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }
    const updated = await updateUserByEmail(email as string, { credits: user.credits - amount });
    res.json({ success: true, credits: updated?.credits });
  });

  app.get('/api/stripe/payment-methods', async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string;
    if (!userEmail) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const result = await getStripePaymentInfo(userEmail);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    res.status(200).json({ card: result.card, lastPayment: result.lastPayment });
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

    const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 8080}`;
    console.log('Creating Stripe session for:', email, 'Plan:', planName, 'App URL:', appUrl);

    try {
      const user = await getUserByEmail(email as string);

      // --- ENFORCE ONE ACTIVE SUBSCRIPTION PER USER ---
      if (user?.stripe_customer_id) {
        // List all active subscriptions for this customer
        const activeSubs = await stripeInstance.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'active',
          expand: ['data.items.data.price.product'],
        });
        // Cancel only subscriptions for the same app/product (by product name)
        for (const sub of activeSubs.data) {
          // Check if any item in the subscription matches this app's product name
          const hasMatchingProduct = sub.items.data.some(item => {
            // Product name is set as `PostAI ${planName} Plan` in sessionParams
            const product = item.price.product as any;
            return product && product.name && product.name.startsWith('PostAI ');
          });
          if (hasMatchingProduct) {
            await stripeInstance.subscriptions.cancel(sub.id, { invoice_now: true, prorate: true });
          }
        }
      }
      // --- END ENFORCE ---

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
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
      };

      if (user?.stripe_customer_id) {
        sessionParams.customer = user.stripe_customer_id;
      } else {
        sessionParams.customer_email = email as string;
      }

      const session = await stripeInstance.checkout.sessions.create(sessionParams);

      // If user didn't have a customer_id, save it after session creation
      console.log('Stripe session created. Session ID:', session.id, 'Customer:', session.customer);
      console.log('User before update:', user);

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
      const processedSessions = await getProcessedSessionsFromDb();
      if (processedSessions.includes(sessionId)) {
        const user = await getUserByEmail(email as string);
        return res.json({ success: true, user });
      }

      const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
      if (session && session.payment_status === 'paid' && session.metadata?.email === email) {
        const planName = session?.metadata?.planName;
        const creditsToSet = parseInt(session?.metadata?.credits || '0');
        const updated = await updateUserByEmail(email as string, {
          credits: creditsToSet,
          plan: planName,
          subscription_id: session?.subscription as string,
          subscription_status: 'active',
        });
        await markSessionProcessedInDb(sessionId);
        res.json({ success: true, user: updated });
      } else {
        res.status(400).json({ error: 'Payment not verified' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create SetupIntent for updating card
  app.post('/api/stripe/create-setup-intent', async (req, res) => {
    const email = (req.session as any).userEmail || req.headers['x-user-email'];
    if (!email) return res.status(401).json({ error: 'Unauthorized' });
    const user = await getUserByEmail(email as string);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const stripeInstance = getStripe();
    if (!stripeInstance) return res.status(500).json({ error: 'Stripe not configured' });
    if (!user.stripe_customer_id) return res.status(400).json({ error: 'No Stripe customer ID' });
    try {
      const setupIntent = await stripeInstance.setupIntents.create({
        customer: user.stripe_customer_id,
        usage: 'off_session',
      });
      res.json({ clientSecret: setupIntent.client_secret });
    } catch (err: any) {
      console.error('SetupIntent error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Create Stripe Customer Portal session for updating card
  app.post('/api/stripe/create-portal-session', async (req, res) => {
    const email = (req.session as any).userEmail || req.body.email || req.headers['x-user-email'];
    const { stripeCustomerId } = req.body;
    if (!email && !stripeCustomerId) {
      return res.status(400).json({ error: 'Missing user email or stripeCustomerId' });
    }
    const stripeInstance = getStripe();
    if (!stripeInstance) return res.status(500).json({ error: 'Stripe not configured' });
    let customerId = stripeCustomerId;
    if (!customerId) {
      // Try to get from DB if not provided
      const user = await getUserByEmail(email);
      customerId = user?.stripe_customer_id;
    }
    if (!customerId) {
      return res.status(400).json({ error: 'No Stripe customer ID found' });
    }
    try {
      const session = await stripeInstance.billingPortal.sessions.create({
        customer: customerId,
        return_url: process.env.PORTAL_RETURN_URL || `http://localhost:${process.env.PORT || 8080}/profile`,
      });
      return res.status(200).json({ url: session.url });
    } catch (err) {
      console.error('Stripe portal session error:', err);
      return res.status(500).json({ error: 'Failed to create portal session' });
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
  // --- End Stripe Payment Methods API Route ---

  // --- Post Creation API Route ---
  app.post('/api/posts/create', upload.single('file'), async (req, res) => {
    const mreq = req as MulterRequest;
    try {
      const { userId, prompt, type, storyText } = mreq.body;
      if (!userId || !prompt) {
        return res.status(400).json({ error: 'Missing required fields: userId, prompt' });
      }
      let url = '';
      if (mreq.file) {
        const fileBuffer = mreq.file.buffer;
        const fileName = mreq.file.originalname;
        const mimeType = mreq.file.mimetype;
        url = await uploadToGCPStorage(fileBuffer, fileName, mimeType, type);
      }
      const postData: any = {
        user_id: userId,
        prompt,
        type,
        url,
      };
      if ((type === 'text' || type === 'story') && storyText) {
        postData.storyText = storyText;
      }
      const post = await prisma.post.create({
        data: postData,
      });
      res.json({ success: true, post });
    } catch (err) {
      console.error('Post creation error:', err);
      res.status(500).json({ error: 'Failed to create post' });
    }
  });
  // --- End Post Creation API Route ---

  app.get('/api/posts', async (req, res) => {
    try {
      const userIdRaw = req.headers["x-user-id"] || req.query.userId;
      const userId = Array.isArray(userIdRaw) ? userIdRaw[0] : userIdRaw;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId in request" });
      }
      const posts = await prisma.post.findMany({
        where: { user_id: userId as string },
        orderBy: { created_at: 'desc' },
      });
      res.json({ posts });
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  // Delete all posts for a user
  app.delete('/api/posts', async (req, res) => {
    try {
      const userIdRaw = req.headers["x-user-id"] || req.query.userId;
      const userId = Array.isArray(userIdRaw) ? userIdRaw[0] : userIdRaw;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId in request" });
      }
      await prisma.post.deleteMany({ where: { user_id: userId as string } });
      res.json({ success: true });
    } catch (err) {
      console.error('Failed to delete posts:', err);
      res.status(500).json({ error: 'Failed to delete posts' });
    }
  });
  // --- End Stripe Payment Methods API Route ---

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
