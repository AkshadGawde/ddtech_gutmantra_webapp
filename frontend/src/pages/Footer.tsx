import { Leaf, Mail, Phone, MapPin, ArrowRight, Instagram, Facebook, Twitter } from "lucide-react";
import { motion } from "motion/react";

export default function Footer() {
  return (
    <footer className="bg-accent text-white pt-24 pb-12 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 transform origin-top-right" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-16 mb-20">
          <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center text-white">
                <Leaf size={18} className="sm:hidden" fill="currentColor" />
                <Leaf size={24} className="hidden sm:block" fill="currentColor" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg sm:text-xl font-bold tracking-tighter">
                  <span className="text-primary">Gut</span>
                  <span className="text-secondary">Mantra</span>
                </span>
                <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] font-medium opacity-60">Flour Mill Store</span>
              </div>
            </div>
            <p className="text-white/50 text-xs sm:text-sm leading-relaxed font-medium max-w-xs">
              GutMantra is Pune's leading artisanal flour mill, dedicated to reviving traditional stone-grinding and wood-pressing techniques. We believe in food that is as honest as it is healthy.
            </p>
            <div className="flex gap-3 sm:gap-4">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <button key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all">
                  <Icon size={16} className="sm:hidden" />
                  <Icon size={18} className="hidden sm:block" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Quick Links</h3>
            <ul className="flex flex-col gap-4 text-sm font-medium text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#categories" className="hover:text-white transition-colors">Shop All</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Our Story</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Bulk Orders</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div className="flex flex-col gap-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-secondary">Contact Pune</h3>
            <ul className="flex flex-col gap-6 text-sm font-medium text-white/60">
              <li className="flex items-start gap-4">
                <MapPin size={20} className="text-secondary shrink-0" />
                <span>Shop No. 4, Green Park, <br />Baner, Pune, Maharashtra 411045</span>
              </li>
              <li className="flex items-center gap-4">
                <Phone size={20} className="text-secondary shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-4">
                <Mail size={20} className="text-secondary shrink-0" />
                <span>hello@gutmantra.in</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Newsletter</h3>
            <p className="text-white/50 text-sm leading-relaxed font-medium">
              Subscribe to get special offers and healthy recipes.
            </p>
            <div className="relative group">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-sm focus:outline-none focus:border-primary transition-all"
              />
              <button className="absolute right-2 top-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-dark transition-all">
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-white/30">
          <p>© 2026 GutMantra Flour Mill Store. All Rights Reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Shipping Info</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
