import React from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../src/contexts/UserContext";
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  MessageSquare,
  Zap,
  Shield,
  Users,
  ArrowRight,
  Play,
} from "lucide-react";
import Lottie from "lottie-react";
import spaceKidTyping from "../animations/space_kid_typing.json";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useUser();

  const features = [
    {
      icon: <MessageSquare className="w-6 h-6 text-emerald-400" />,
      title: "AI Text Generation",
      description:
        "Create engaging captions, tweets, and posts in seconds with advanced language models.",
    },
    {
      icon: <ImageIcon className="w-6 h-6 text-blue-400" />,
      title: "AI Image Creation",
      description:
        "Turn your ideas into stunning visuals with our integrated image generation engine.",
    },
    {
      icon: <Video className="w-6 h-6 text-purple-400" />,
      title: "AI Video & Stories",
      description:
        "Generate cinematic videos and narrated stories from simple text prompts or images.",
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      title: "Instant Workflow",
      description:
        "Streamline your content creation process and post directly to your favorite platforms.",
    },
  ];

  const stats = [
    { label: "Active Creators", value: "12,000+" },
    { label: "Posts Generated", value: "1.5M+" },
    { label: "Time Saved", value: "85%" },
    { label: "User Rating", value: "4.9/5" },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6">
              <Sparkles className="w-3 h-3 mr-2" />
              Next-Gen Content Creation
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
              <Lottie
                animationData={spaceKidTyping}
                loop={true}
                className="w-16 h-16 inline-block mr-4"
              />
              Create Viral Content <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
                Powered by AI
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              The all-in-one platform to generate text, images, and videos for
              your social media. Stop staring at a blank screen and start
              creating with PostAI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all flex items-center justify-center group"
                >
                  Explore Dashboard
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <>
                  <button
                    onClick={login}
                    className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all flex items-center justify-center group"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all flex items-center justify-center"
                  >
                    <Play className="mr-2 w-5 h-5 fill-current" />
                    Watch Demo
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-black/20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 uppercase tracking-widest font-semibold">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Everything you need to grow
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              We&apos;ve built the most powerful AI tools into a single,
              seamless experience. Create, edit, and publish without ever
              leaving the app.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-emerald-500/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-32 px-4 bg-emerald-500/5">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">
                Why creators choose <br />
                <span className="text-emerald-400">PostAI</span>
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">
                      Privacy First
                    </h4>
                    <p className="text-slate-400">
                      Your data and content are yours. We never use your private
                      creations to train models.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">
                      Collaborative
                    </h4>
                    <p className="text-slate-400">
                      Share your drafts with your team or clients for instant
                      feedback and approval.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">
                      Always Improving
                    </h4>
                    <p className="text-slate-400">
                      We update our models weekly to ensure you always have
                      access to the latest AI tech.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-white/10 p-8 flex items-center justify-center">
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="https://picsum.photos/seed/ai-dashboard/800/800"
                    alt="Dashboard Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                    <div className="text-white">
                      <p className="text-sm font-medium opacity-80 mb-1">
                        Featured Creator
                      </p>
                      <p className="text-xl font-bold">
                        &quot;PostAI changed my workflow forever.&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-500/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Companion Glance Section */}
      <section className="relative py-16 px-4 mt-12">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex flex-col items-center justify-center mb-4">
            <Lottie
              animationData={spaceKidTyping}
              style={{ width: 180, height: 180 }}
              loop={true}
            />
          </div>
          <h2 className="text-3xl font-bold text-brand-text mb-2">
            Meet Your AI Companion
          </h2>
          <p className="text-lg text-brand-text-secondary mb-4">
            Your friendly AI Companion sits at the bottom left of your
            dashboard.
            <br />
            <span className="text-brand-primary font-semibold">Click</span> the
            companion for smart suggestions, creative ideas, and tips based on
            your recent activity.
            <br />
            Use it to get unstuck, try new content types, or simply for
            inspiration!
          </p>
          <div className="flex flex-row justify-center items-center gap-2">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
              Personalized Suggestions
            </span>
            <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold">
              Instant Prompt Ideas
            </span>
            <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold">
              Fun & Interactive
            </span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="p-12 md:p-20 rounded-[3rem] bg-gradient-to-br from-emerald-500 to-blue-600 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
                Ready to supercharge your content?
              </h2>
              <p className="text-white/80 text-lg mb-12 max-w-xl mx-auto">
                Join thousands of creators who are already using PostAI to build
                their brands. Start for free today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={login}
                  className="w-full sm:w-auto px-10 py-4 bg-white text-emerald-600 font-bold rounded-xl hover:bg-slate-100 transition-all"
                >
                  Create Account
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full sm:w-auto px-10 py-4 bg-black/20 text-white font-bold rounded-xl hover:bg-black/30 transition-all border border-white/20"
                >
                  Explore Dashboard
                </button>
              </div>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            {/* <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center"> */}
            <img
              src="/favicon.svg"
              alt="POSTAI"
              width={30}
              height={30}
              style={{
                marginLeft: 16,
                borderRadius: 12,
                animation: "pulse 1.2s infinite 0.3s",
                background: "#fff",
              }}
            />
            {/* </div> */}
            <span className="text-xl font-bold text-white tracking-tight">
              PostAI
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            &copy; 2026 PostAI. All rights reserved. Powered by Bitforz.
          </p>
        </div>
      </footer>
    </div>
  );
};
