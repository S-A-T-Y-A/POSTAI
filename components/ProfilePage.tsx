import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
  FaGoogleDrive,
  FaCheckCircle,
  FaSyncAlt,
} from "react-icons/fa";

import React, { useEffect, useState } from "react";
// Types for Stripe card and payment info
interface StripeCardInfo {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  name?: string;
}
interface StripeLastPayment {
  amount: string;
  currency: string;
  date: string;
}
import { useUser } from "../src/contexts/UserContext";
import {
  Mail,
  Calendar,
  CreditCard,
  LogOut,
  Shield,
  Pencil,
} from "lucide-react";
// ...existing code...

// Wrap modal in Elements provider in ProfilePage
export const ProfilePage: React.FC = () => {
  const { user, logout, loading, accessToken, login } = useUser();
  console.log("ProfilePage user:", user);
  // Google Drive connection status
  const isDriveConnected = Boolean(accessToken);
  const [driveLoading, setDriveLoading] = useState(false);
  const handleDriveReconnect = async () => {
    setDriveLoading(true);
    try {
      await login();
    } finally {
      setDriveLoading(false);
    }
  };
  const [card, setCard] = useState<StripeCardInfo | null>(null);
  const [lastPayment, setLastPayment] = useState<StripeLastPayment | null>(
    null,
  );
  const [cardLoading, setCardLoading] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setCardLoading(true);
    fetch("/api/stripe/payment-methods", {
      headers: {
        "X-User-Email": user.email,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setCard(data.card);
        setLastPayment(data.lastPayment);
      })
      .catch(() => {
        setCard(null);
        setLastPayment(null);
      })
      .finally(() => setCardLoading(false));
  }, [user]);

  if (loading || cardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-brand-bg/40 backdrop-blur-xl border border-brand-border rounded-3xl text-center">
        <Shield className="mx-auto h-12 w-12 text-brand-primary mb-4" />
        <h2 className="text-2xl font-bold text-brand-text mb-2">
          Access Denied
        </h2>
        <p className="text-brand-text-secondary mb-6">
          Please log in to view your profile and manage your account.
        </p>
      </div>
    );
  }

  // Handler to open Stripe Customer Portal
  const handleOpenPortal = async () => {
    if (!user) return;
    setPortalLoading(true);
    try {
      // You may need to fetch stripeCustomerId from your backend or user object
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          stripe_customer_id: user.stripe_customer_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to open portal");
      window.location.href = data.url;
    } catch (err: any) {
      alert(err.message || "Failed to open Stripe portal");
    } finally {
      setPortalLoading(false);
    }
  };

  // Handler stubs for social connect
  const handleConnectFacebook = () => {
    alert("Facebook connect coming soon!");
  };
  const handleConnectInstagram = () => {
    alert("Instagram connect coming soon!");
  };
  const handleConnectLinkedIn = () => {
    alert("LinkedIn connect coming soon!");
  };
  const handleConnectTwitter = () => {
    alert("Twitter connect coming soon!");
  };

  return (
    <div className="container mx-auto max-w-3xl py-8 px-2 md:px-0">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-brand-bg/40 backdrop-blur-xl border border-brand-border rounded-3xl overflow-hidden shadow-2xl">
          <div className="h-32 bg-gradient-to-r from-brand-primary to-brand-secondary"></div>
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-8">
              <img
                src={user.picture}
                alt={user.name}
                className="w-24 h-24 rounded-2xl border-4 border-brand-bg object-cover shadow-lg"
              />
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors text-sm font-semibold"
              >
                <LogOut size={16} className="mr-2" />
                Log Out
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-brand-text mb-1">
                    {user.name}
                  </h1>
                  <p className="text-brand-text-secondary flex items-center">
                    <Mail size={14} className="mr-2" />
                    {user.email}
                  </p>
                </div>

                <div className="p-4 bg-brand-bg/60 rounded-2xl border border-brand-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-brand-text-secondary uppercase tracking-widest">
                      Current Plan
                    </span>
                    <span className="px-2 py-1 bg-brand-primary/20 text-brand-primary text-[10px] font-bold rounded uppercase">
                      {user.plan}
                    </span>
                  </div>
                  <div className="flex items-center text-brand-text">
                    <CreditCard size={18} className="mr-3 text-brand-primary" />
                    <span className="text-xl font-bold">
                      {user.credits} Credits Remaining
                    </span>
                  </div>
                </div>

                <div className="flex items-center text-sm text-brand-text-secondary">
                  <Calendar size={14} className="mr-2" />
                  Member since {new Date(user.created_at).toLocaleDateString()}
                </div>

                {/* Google Drive Connection Status */}
                <h3 className="text-lg font-bold text-brand-text mt-8">
                  Apps Connected
                </h3>
                <div className="flex items-center p-4 bg-brand-bg/40 rounded-xl border border-brand-border mt-2">
                  <div
                    className={`p-2 rounded-lg mr-4 ${isDriveConnected ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
                  >
                    <FaGoogleDrive size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-brand-text flex items-center">
                      Google Drive
                      <button
                        className="ml-2 p-1 rounded-full hover:bg-brand-primary/10 transition-colors"
                        aria-label="Change Google Drive Account"
                        onClick={handleDriveReconnect}
                        disabled={driveLoading}
                      >
                        {/* <Pencil size={16} className="text-brand-primary" /> */}
                      </button>
                    </p>
                    {/* Status icon at top right */}
                    <div className="relative">
                      {isDriveConnected ? (
                        <FaCheckCircle
                          size={20}
                          className="absolute top-0 right-0 text-emerald-500"
                          title="Drive Connected"
                        />
                      ) : (
                        <FaSyncAlt
                          size={20}
                          className="absolute top-0 right-0 text-red-400"
                          title="Drive Not Connected"
                        />
                      )}
                    </div>
                    {isDriveConnected && user?.email && (
                      <p className="text-xs text-brand-text-secondary mt-1">
                        ({user.email})
                      </p>
                    )}
                  </div>
                  {driveLoading && (
                    <span className="ml-2 animate-spin h-5 w-5 border-2 border-brand-primary border-t-transparent rounded-full inline-block"></span>
                  )}
                </div>
                {/* Social Media Account Linking */}
                <h3 className="text-lg font-bold text-brand-text mt-8">
                  Social Accounts
                </h3>
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="relative flex flex-wrap gap-3 mb-6">
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow transition opacity-60 cursor-not-allowed"
                      disabled
                    >
                      <FaFacebook />
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-yellow-500 text-white rounded-lg shadow transition opacity-60 cursor-not-allowed"
                      disabled
                    >
                      <FaInstagram />
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg shadow transition opacity-60 cursor-not-allowed"
                      disabled
                    >
                      <FaLinkedin />
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-blue-400 text-white rounded-lg shadow transition opacity-60 cursor-not-allowed"
                      disabled
                    >
                      <FaTwitter />
                    </button>
                    <span className="absolute inset-0 flex items-center justify-center text-base font-semibold text-white bg-black/20 rounded-lg pointer-events-none z-10">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-brand-text">
                  Account Security
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-brand-bg/40 rounded-xl border border-brand-border">
                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg mr-4">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-text">
                        Google Authenticated
                      </p>
                      <p className="text-xs text-brand-text-secondary">
                        Your account is secured via Google OAuth.
                      </p>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-brand-text">
                  Payment Method
                </h3>
                <div className="flex flex-col gap-4">
                  {/* Card Display */}
                  {card ? (
                    <div className="relative w-full max-w-xs bg-gradient-to-tr from-brand-primary to-brand-secondary text-white rounded-2xl shadow-lg p-6 mx-auto">
                      {/* Edit Pen Icon */}
                      <button
                        className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                        aria-label="Edit Card"
                        onClick={handleOpenPortal}
                        disabled={portalLoading}
                      >
                        <Pencil size={20} className="text-white" />
                      </button>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-lg tracking-widest">
                          {card.brand?.toUpperCase()}
                        </span>
                        <span className="text-xs">
                          Exp: {card.exp_month.toString().padStart(2, "0")}/
                          {card.exp_year.toString().slice(-2)}
                        </span>
                      </div>
                      <div className="text-xl font-mono tracking-widest mb-6">
                        **** **** **** {card.last4}
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-xs uppercase">Cardholder</div>
                          <div className="font-semibold">
                            {card.name || user.name}
                          </div>
                        </div>
                        <div className="text-xs text-right">
                          <div>Last payment</div>
                          <div className="font-semibold">
                            {lastPayment
                              ? `$${lastPayment.amount} on ${new Date(lastPayment.date).toLocaleDateString()}`
                              : "No payments yet"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full max-w-xs mx-auto text-center text-brand-text-secondary py-8">
                      No card on file.
                      {/* Show pen icon for add card */}
                      <button
                        className="absolute top-3 right-3 p-1 rounded-full bg-brand-primary/80 hover:bg-brand-primary transition-colors"
                        aria-label="Add Card"
                        onClick={handleOpenPortal}
                        disabled={portalLoading}
                      >
                        <Pencil size={20} className="text-white" />
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 justify-center"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
