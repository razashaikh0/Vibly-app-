import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { UserIdentity } from "@supabase/supabase-js";
import { ArrowLeft, Loader2, Mail, Phone, ShieldCheck, Unlink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { useOtpCooldown } from "@/hooks/useOtpCooldown";
import { checkOtpAllowed, normalizePhone } from "@/lib/otpGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account & login methods — WeVoice" },
      {
        name: "description",
        content:
          "Manage your WeVoice login methods: change your phone number with SMS verification and link email, Google, Apple or Microsoft to one profile.",
      },
      { property: "og:title", content: "Account & login methods — WeVoice" },
      {
        property: "og:description",
        content:
          "Change your verified phone number and link email, Google, Apple or Microsoft sign-in to a single WeVoice profile.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

const SOCIALS = [
  { id: "google", label: "Google" },
  { id: "apple", label: "Apple" },
  { id: "azure", label: "Microsoft" },
] as const;

function AccountPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const [newPhone, setNewPhone] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpFails, setOtpFails] = useState(0);
  const { seconds: cooldown, sendsLeft, markSent } = useOtpCooldown(
    pendingPhone || (newPhone ? normalizePhone(newPhone) : ""),
  );

  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const refreshIdentities = async () => {
    const { data } = await supabase.auth.getUserIdentities();
    setIdentities(data?.identities ?? []);
  };

  useEffect(() => {
    if (user) void refreshIdentities();
  }, [user]);

  const startPhoneChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizePhone(newPhone);
    if (normalized.length < 8) {
      toast.error("Sahi phone number likhein (country code ke saath).");
      return;
    }
    if (normalized === user?.phone) {
      toast.error("This is already your current number.");
      return;
    }
    const allowed = checkOtpAllowed(normalized);
    if (!allowed.ok) {
      toast.error(
        allowed.reason === "cooldown"
          ? `Try again in ${allowed.secondsLeft}s.`
          : `OTP limit reached — try again in ${allowed.minutesLeft} min.`,
      );
      return;
    }
    setBusy("phone");
    const { error } = await supabase.auth.updateUser({ phone: normalized });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    markSent();
    setPendingPhone(normalized);
    setOtp("");
    setOtpFails(0);
    toast.success(`Verification OTP sent to ${normalized}`);
  };

  const resendPhoneOtp = async () => {
    const allowed = checkOtpAllowed(pendingPhone);
    if (!allowed.ok) {
      toast.error(
        allowed.reason === "cooldown"
          ? `Resend in ${allowed.secondsLeft}s.`
          : `OTP limit reached — try again in ${allowed.minutesLeft} min.`,
      );
      return;
    }
    setBusy("phone");
    const { error } = await supabase.auth.updateUser({ phone: pendingPhone });
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      markSent();
      toast.success("New OTP sent");
    }
  };

  const verifyPhoneChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.trim();
    if (!/^\d{4,8}$/.test(code)) {
      toast.error("Sahi OTP code likhein");
      return;
    }
    setBusy("verify");
    const { error } = await supabase.auth.verifyOtp({
      phone: pendingPhone,
      token: code,
      type: "phone_change",
    });
    setBusy(null);
    if (error) {
      const attempts = otpFails + 1;
      setOtpFails(attempts);
      if (attempts >= 5) {
        toast.error("Too many wrong attempts — please start over.");
        setPendingPhone("");
        setOtp("");
        setOtpFails(0);
      } else {
        toast.error(`${error.message} (${5 - attempts} attempts bache)`);
      }
      return;
    }
    setPendingPhone("");
    setNewPhone("");
    setOtp("");
    setOtpFails(0);
    await refreshIdentities();
    toast.success("Phone number verified!");
  };

  const linkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("email");
    const { error } = await supabase.auth.updateUser(
      { email: newEmail.trim() },
      { emailRedirectTo: `${window.location.origin}/account` },
    );
    setBusy(null);
    if (error) toast.error(error.message);
    else toast.success("Confirmation link sent to your email");
  };

  const linkSocial = async (provider: (typeof SOCIALS)[number]["id"]) => {
    setBusy(provider);
    if (provider === "google") {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/account`,
      });
      if (result.error) toast.error("Google link fail hua");
      if (!result.redirected) setBusy(null);
      return;
    }
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo: `${window.location.origin}/account` },
    });
    if (error) {
      setBusy(null);
      toast.error(error.message);
    }
  };

  const unlink = async (identity: UserIdentity) => {
    if (identities.length <= 1) {
      toast.error("At least one login method is required.");
      return;
    }
    setBusy(identity.identity_id);
    const { error } = await supabase.auth.unlinkIdentity(identity);
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      await refreshIdentities();
      toast.success(`${identity.provider} unlinked`);
    }
  };

  if (loading || !user) {
    return (
      <main className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const linkedProviders = new Set(identities.map((i) => i.provider));

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Wapas
      </Link>

      <h1 className="text-2xl font-black tracking-tight">Account &amp; login methods</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ek hi profile me phone, email aur social logins jodo ya hatao.
      </p>

      {/* Linked identities */}
      <section className="glass mt-6 rounded-3xl p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" /> Linked accounts
        </h2>
        <div className="mt-4 space-y-2">
          {identities.map((identity) => (
            <div
              key={identity.identity_id}
              className="flex items-center justify-between rounded-2xl border border-border/60 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium capitalize">
                  {identity.provider === "azure" ? "Microsoft" : identity.provider}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {(identity.identity_data?.["email"] as string | undefined) ??
                    (identity.identity_data?.["phone"] as string | undefined) ??
                    user.id.slice(0, 8)}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy === identity.identity_id || identities.length <= 1}
                onClick={() => void unlink(identity)}
              >
                <Unlink className="mr-1.5 h-3.5 w-3.5" /> Unlink
              </Button>
            </div>
          ))}
          {identities.length === 0 && (
            <p className="text-sm text-muted-foreground">No linked identities found.</p>
          )}
        </div>

        <Separator className="my-4" />
        <p className="mb-3 text-sm font-medium">Naya method jodo</p>
        <div className="flex flex-wrap gap-2">
          {SOCIALS.map((s) => (
            <Button
              key={s.id}
              variant="secondary"
              size="sm"
              disabled={busy === s.id || linkedProviders.has(s.id)}
              onClick={() => void linkSocial(s.id)}
            >
              {linkedProviders.has(s.id) ? `${s.label} linked` : `Link ${s.label}`}
            </Button>
          ))}
        </div>
      </section>

      {/* Phone change */}
      <section className="glass mt-5 rounded-3xl p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <Phone className="h-4 w-4 text-primary" /> Phone number
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Current: {user.phone ? `+${user.phone.replace(/^\+/, "")}` : "no number linked"}
          {user.phone && (
            <Badge variant="secondary" className="ml-2">
              verified
            </Badge>
          )}
        </p>

        {!pendingPhone ? (
          <form className="mt-4 space-y-3" onSubmit={startPhoneChange}>
            <div className="space-y-1.5">
              <Label htmlFor="newPhone">Naya number</Label>
              <Input
                id="newPhone"
                type="tel"
                placeholder="+91 98765 43210"
                value={newPhone}
                required
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </div>
            <Button disabled={busy === "phone" || cooldown > 0 || sendsLeft === 0}>
              {busy === "phone" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : cooldown > 0 ? (
                `Wait ${cooldown}s`
              ) : sendsLeft === 0 ? (
                "OTP limit reached"
              ) : (
                "Send OTP & verify"
              )}
            </Button>
          </form>
        ) : (
          <form className="mt-4 space-y-3" onSubmit={verifyPhoneChange}>
            <div className="space-y-1.5">
              <Label htmlFor="changeOtp">OTP ({pendingPhone})</Label>
              <Input
                id="changeOtp"
                inputMode="numeric"
                placeholder="6-digit code"
                value={otp}
                required
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy === "verify"}>
                {busy === "verify" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy === "phone" || cooldown > 0 || sendsLeft === 0}
                onClick={() => void resendPhoneOtp()}
              >
                {cooldown > 0 ? `Resend (${cooldown}s)` : `Resend (${sendsLeft} bache)`}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPendingPhone("");
                  setOtp("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* Email */}
      <section className="glass mt-5 mb-10 rounded-3xl p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <Mail className="h-4 w-4 text-primary" /> Email
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Current: {user.email ?? "no email linked"}
        </p>
        <form className="mt-4 space-y-3" onSubmit={linkEmail}>
          <div className="space-y-1.5">
            <Label htmlFor="newEmail">{user.email ? "Naya email" : "Email jodo"}</Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              required
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <Button disabled={busy === "email"}>
            {busy === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send confirmation"}
          </Button>
        </form>
      </section>
    </main>
  );
}
