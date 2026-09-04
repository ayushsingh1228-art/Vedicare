import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Leaf } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F3EE] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Leaf className="w-6 h-6 text-saffron" />
            <span className="font-serif text-2xl text-ink">Vediccare</span>
          </div>
          <h1 className="font-serif text-3xl text-ink mb-2">Reset Password</h1>
          <p className="text-ink/60 text-sm">We'll send a reset link to your email</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E1D5] p-8 shadow-sm">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink/70 mb-2">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-saffron/30 focus:border-saffron"
                  />
                </div>
              </div>
              <button type="submit" className="saffron-btn w-full py-3 rounded-xl font-semibold">
                Send Reset Link
              </button>
            </form>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-herb-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-herb" />
              </div>
              <h2 className="font-serif text-xl text-ink mb-2">Check your inbox</h2>
              <p className="text-ink/60 text-sm mb-6">
                We've sent a password reset link to <strong>{email}</strong>. Check your spam folder if you don't see it.
              </p>
              <button onClick={() => setSent(false)} className="text-sm text-saffron hover:underline">
                Try a different email
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-[#E8E1D5] text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-saffron transition">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
