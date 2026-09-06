import { useState } from "react";
import { X, ShoppingCart, Search, ExternalLink, Truck, Tag, Package } from "lucide-react";

const MEDICINES = [
  { name: "Ashwagandha Tablets", brand: "Baidyanath", desc: "Stress relief, energy & vitality boost", price: 180, img: "🌿", pack: "60 tablets" },
  { name: "Triphala Churna", brand: "Dabur", desc: "Ayurvedic digestive support & detox", price: 145, img: "🌱", pack: "500g powder" },
  { name: "Brahmi Ghritham", brand: "Kottakkal AVS", desc: "Memory, concentration & brain health", price: 240, img: "🧠", pack: "200g ghee" },
  { name: "Liv.52 DS Tablets", brand: "Himalaya", desc: "Liver protection & appetite stimulant", price: 175, img: "💊", pack: "60 tablets" },
  { name: "Giloy Ghanvati", brand: "Patanjali", desc: "Immunity booster, anti-fever & anti-viral", price: 110, img: "🍃", pack: "60 tablets" },
  { name: "Chyawanprash", brand: "Dabur", desc: "Complete immunity & strength formula", price: 395, img: "🍯", pack: "1 kg jar" },
  { name: "Shatavari Churna", brand: "Baidyanath", desc: "Women's hormonal balance & vitality", price: 155, img: "🌸", pack: "100g powder" },
  { name: "Trikatu Churna", brand: "Organic India", desc: "Metabolism booster & respiratory support", price: 195, img: "🌶️", pack: "100g powder" },
];

const PHARMACIES = [
  { name: "1mg", logo: "💊", color: "bg-red-50 text-red-600 border-red-200" },
  { name: "PharmEasy", logo: "💙", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { name: "Netmeds", logo: "🟢", color: "bg-green-50 text-green-700 border-green-200" },
  { name: "Apollo Pharmacy", logo: "⚕️", color: "bg-purple-50 text-purple-600 border-purple-200" },
];

export default function MedicineOrderModal({ open, onClose, prefillName = "" }) {
  const [search, setSearch] = useState(prefillName);
  const [cart, setCart] = useState({});
  const [step, setStep] = useState("browse");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("cod");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [ordered, setOrdered] = useState(false);

  const filtered = MEDICINES.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.brand.toLowerCase().includes(search.toLowerCase()) ||
    m.desc.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (med) => setCart((c) => ({ ...c, [med.name]: (c[med.name] || 0) + 1 }));
  const removeFromCart = (med) => setCart((c) => { const n = { ...c }; if (n[med.name] > 1) n[med.name]--; else delete n[med.name]; return n; });
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = Object.entries(cart).reduce((acc, [name, qty]) => {
    const med = MEDICINES.find((m) => m.name === name);
    return acc + (med ? med.price * qty : 0);
  }, 0);
  const discount = couponApplied ? Math.round(subtotal * 0.2) : 0;
  const total = subtotal - discount;

  const applyCoupon = () => {
    if (coupon.toUpperCase() === "VEDICCARE20") { setCouponApplied(true); }
  };

  const placeOrder = () => {
    if (!address.trim()) { alert("Please enter your delivery address."); return; }
    setOrdered(true);
  };

  const handleClose = () => { setSearch(prefillName); setCart({}); setStep("browse"); setOrdered(false); setCouponApplied(false); setCoupon(""); setAddress(""); onClose(); };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={handleClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-herb to-green-600 p-5 rounded-t-3xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">💊</div>
            <div>
              <h2 className="text-white font-bold text-lg leading-none">Ayurvedic Pharmacy</h2>
              <p className="text-green-100 text-xs mt-0.5">Genuine brands · Express delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalItems > 0 && step === "browse" && (
              <button onClick={() => setStep("checkout")} className="flex items-center gap-1.5 bg-white text-herb font-semibold text-sm px-3 py-2 rounded-xl">
                <ShoppingCart className="w-4 h-4" /> {totalItems}
              </button>
            )}
            <button onClick={handleClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-5 space-y-4">

          {/* SUCCESS STATE */}
          {ordered && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="font-serif text-2xl text-ink">Order Placed!</h3>
              <p className="text-ink/60 mt-2 text-sm">Your medicines will arrive within <strong>2 hours (Express)</strong>.</p>
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-2xl text-left">
                <div className="text-xs text-green-600 font-medium mb-2">Order Summary</div>
                {Object.entries(cart).map(([name, qty]) => (
                  <div key={name} className="flex justify-between text-sm text-ink py-1">
                    <span>{name} × {qty}</span>
                    <span className="font-medium">₹{(MEDICINES.find(m=>m.name===name)?.price || 0) * qty}</span>
                  </div>
                ))}
                {couponApplied && <div className="flex justify-between text-sm text-green-600 py-1"><span>Coupon (VEDICCARE20)</span><span>-₹{discount}</span></div>}
                <div className="flex justify-between font-bold text-ink border-t border-green-200 pt-2 mt-1"><span>Total Paid</span><span>₹{total}</span></div>
              </div>
              <p className="text-xs text-ink/40 mt-3">Tracking ID: VDC-{Math.floor(Math.random()*900000+100000)}</p>
              <button onClick={handleClose} className="mt-4 w-full py-3 bg-herb text-white rounded-2xl font-semibold hover:bg-herb/90 transition">Done 🙏</button>
            </div>
          )}

          {/* BROWSE */}
          {!ordered && step === "browse" && (
            <>
              {/* Trusted Partners */}
              <div>
                <p className="text-xs uppercase tracking-widest text-ink/40 mb-2">Fulfilled via trusted partners</p>
                <div className="flex gap-2 flex-wrap">
                  {PHARMACIES.map((p) => (
                    <div key={p.name} className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${p.color} flex items-center gap-1`}>
                      <span>{p.logo}</span> {p.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-ink/30" />
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search medicines, brands…"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8E1D5] bg-[#F7F3EE] text-sm focus:outline-none focus:border-herb"
                />
              </div>

              {/* Products */}
              <div className="space-y-3">
                {filtered.map((med) => {
                  const qty = cart[med.name] || 0;
                  return (
                    <div key={med.name} className="p-4 rounded-2xl border border-[#E8E1D5] hover:border-herb/40 transition">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-2xl shrink-0">{med.img}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-ink text-sm">{med.name}</div>
                          <div className="text-xs text-herb font-medium">{med.brand}</div>
                          <div className="text-xs text-ink/50 mt-0.5">{med.desc}</div>
                          <div className="text-xs text-ink/40 mt-0.5"><Package className="w-3 h-3 inline mr-0.5" />{med.pack}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-ink">₹{med.price}</div>
                          <div className="flex items-center gap-1 mt-2">
                            {qty > 0 && (
                              <>
                                <button onClick={() => removeFromCart(med)} className="w-7 h-7 bg-gray-100 rounded-lg text-ink font-bold text-lg flex items-center justify-center hover:bg-gray-200">-</button>
                                <span className="w-5 text-center font-semibold text-sm">{qty}</span>
                              </>
                            )}
                            <button onClick={() => addToCart(med)} className="w-7 h-7 bg-herb text-white rounded-lg font-bold text-lg flex items-center justify-center hover:bg-herb/90">+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalItems > 0 && (
                <button onClick={() => setStep("checkout")} className="w-full py-3.5 bg-herb text-white rounded-2xl font-semibold hover:bg-herb/90 transition flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Checkout · ₹{subtotal} ({totalItems} item{totalItems > 1 ? "s" : ""})
                </button>
              )}
            </>
          )}

          {/* CHECKOUT */}
          {!ordered && step === "checkout" && (
            <>
              <button onClick={() => setStep("browse")} className="flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition mb-1">← Back to medicines</button>
              <h3 className="font-serif text-xl text-ink">Your Cart</h3>
              <div className="space-y-2">
                {Object.entries(cart).map(([name, qty]) => {
                  const med = MEDICINES.find((m) => m.name === name);
                  return (
                    <div key={name} className="flex items-center justify-between p-3 bg-[#F7F3EE] rounded-xl">
                      <div>
                        <div className="text-sm font-semibold text-ink">{name}</div>
                        <div className="text-xs text-ink/50">{med?.brand} · ×{qty}</div>
                      </div>
                      <div className="font-bold text-ink">₹{(med?.price || 0) * qty}</div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-3.5 w-4 h-4 text-ink/30" />
                  <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code (try VEDICCARE20)"
                    className="w-full pl-9 pr-3 py-3 rounded-xl border border-[#E8E1D5] text-sm focus:outline-none focus:border-herb" />
                </div>
                <button onClick={applyCoupon} className="px-4 py-3 bg-herb text-white rounded-xl font-medium text-sm hover:bg-herb/90">Apply</button>
              </div>
              {couponApplied && <div className="text-green-600 text-sm font-medium">✅ 20% off applied! You save ₹{discount}</div>}

              {/* Totals */}
              <div className="bg-[#F7F3EE] rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-ink/60"><span>Subtotal</span><span>₹{subtotal}</span></div>
                {couponApplied && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-₹{discount}</span></div>}
                <div className="flex justify-between text-sm text-herb"><span>Delivery</span><span>Free · 2hr express</span></div>
                <div className="flex justify-between font-bold text-ink text-base border-t border-[#E8E1D5] pt-2"><span>Total</span><span>₹{total}</span></div>
              </div>

              {/* Address */}
              <div>
                <label className="text-xs text-ink/60 font-medium">Delivery Address</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Enter your full delivery address…"
                  className="w-full mt-1 px-4 py-3 rounded-xl border border-[#E8E1D5] text-sm focus:outline-none focus:border-herb" />
              </div>

              {/* Payment */}
              <div>
                <label className="text-xs text-ink/60 font-medium">Payment Method</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[["cod","Cash on Delivery 💵"],["upi","UPI / GPay 📱"],["card","Card 💳"]].map(([id, label]) => (
                    <button key={id} onClick={() => setPayment(id)}
                      className={`p-3 rounded-xl border text-xs font-medium transition ${payment===id ? "border-herb bg-green-50 text-herb" : "border-[#E8E1D5] text-ink/60"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={placeOrder} className="w-full py-3.5 bg-herb text-white rounded-2xl font-semibold hover:bg-herb/90 transition flex items-center justify-center gap-2">
                <Truck className="w-4 h-4" /> Place Order · ₹{total}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
