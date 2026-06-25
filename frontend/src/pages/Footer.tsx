import { Mail, Phone, MapPin, ArrowRight, Instagram, Facebook } from "lucide-react";
import { motion } from "motion/react";

export default function Footer() {
  return (
    <footer className="bg-accent text-white pt-24 pb-12 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 transform origin-top-right" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-16 mb-20">
          <div className="flex flex-col gap-6 sm:gap-8">
            <div>
              <img
                src="https://res.cloudinary.com/dk7ynv44a/image/upload/f_auto,q_auto,w_200/v1781528506/nhs57yiyhe8axow2bchy.png"
                alt="GutMantra"
                className="h-14 w-auto object-contain"
              />
            </div>
            <p className="text-white/50 text-xs sm:text-sm leading-relaxed font-medium max-w-xs">
              Gut Mantra is Pune's leading artisanal flour mill, dedicated to reviving traditional stone-grinding and wood-pressing techniques. We believe in food that is as honest as it is healthy.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <a
                href="https://www.facebook.com/profile.php?id=100079247775593"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all"
                aria-label="Facebook"
              >
                <Facebook size={16} className="sm:hidden" />
                <Facebook size={18} className="hidden sm:block" />
              </a>
              <a
                href="https://www.instagram.com/gutmantra.in?igsh=ZWtlMXRlM2VmbDRt"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all"
                aria-label="Instagram"
              >
                <Instagram size={16} className="sm:hidden" />
                <Instagram size={18} className="hidden sm:block" />
              </a>
              <a
                href="https://wa.me/919028107111?text=Hello%20GutMantra!%20I%27d%20like%20to%20know%20more%20about%20your%20products."
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all"
                aria-label="WhatsApp"
              >
                {/* WhatsApp icon */}
                <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-[18px] sm:h-[18px] fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Quick Links</h3>
            <ul className="flex flex-col gap-4 text-sm font-medium text-white/60">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#categories" className="hover:text-white transition-colors">Shop All</a></li>
              <li><a href="/our-story" className="hover:text-white transition-colors">Our Story</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</a></li>
            </ul>
          </div>

          <div className="flex flex-col gap-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-secondary">Contact Pune</h3>
            <ul className="flex flex-col gap-6 text-sm font-medium text-white/60">
              <li className="flex items-start gap-4">
                <MapPin size={20} className="text-secondary shrink-0" />
                <span>Shop No. 8, Pride World City, <br />Charholi Budruk, Pimpri-Chinchwad, Maharashtra 412105</span>
              </li>
              <li className="flex items-center gap-4">
                <Phone size={20} className="text-secondary shrink-0" />
                <span>+91 90281 07111</span>
              </li>
              <li className="flex items-center gap-4">
                <Mail size={20} className="text-secondary shrink-0" />
                <span>support@gutmantra.in</span>
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
          
        </div>
      </div>
    </footer>
  );
}
