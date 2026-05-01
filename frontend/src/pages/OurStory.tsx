import { motion } from "motion/react";
import { Leaf, Waypoints, Droplet, Truck, Star, Play } from "lucide-react";
import { useState } from "react";

export default function OurStory() {
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);

  const storeVideos = [
    { id: 1, title: "Behind the Scenes", thumbnail: "https://via.placeholder.com/400x300?text=Store+Tour" },
    { id: 2, title: "Grain Selection", thumbnail: "https://via.placeholder.com/400x300?text=Grain+Selection" },
    { id: 3, title: "Stone Grinding Process", thumbnail: "https://via.placeholder.com/400x300?text=Stone+Grinding" },
    { id: 4, title: "Customer Stories", thumbnail: "https://via.placeholder.com/400x300?text=Customer+Stories" },
  ];

  return (
    <div className="min-h-screen bg-white pt-28 pb-12">
      {/* Hero Section - About Us */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto px-4 sm:px-6 mb-20"
      >
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold tracking-tighter mb-6 text-primary"
          >
            About <span className="italic font-serif font-normal text-secondary">US</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            What is the driving force behind our existence?
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Do you miss the great taste of roti and chappatis which your mom used to prepare for you? She always ensures that she feeds you with the best possible grains available, they should be neatly clean and are ground using the traditional stone chakkis before it makes its way into the kitchen.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Understanding this missing link and limitation of time and authenticity with busy urban lives, we established to bring back the nutrition and taste that each of us relish for.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl overflow-hidden h-80 flex items-center justify-center"
          >
            <img 
              src="https://via.placeholder.com/500x400?text=About+GutMantra" 
              alt="Our Story" 
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Why Choose GutMantra Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-6xl mx-auto px-4 sm:px-6 mb-20"
      >
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 text-center">
          Why Choose <span className="text-primary">GutMantra?</span>
        </h2>
        <p className="text-center text-gray-700 text-lg leading-relaxed max-w-3xl mx-auto mb-12">
          We embrace the philosophy that healthy living begins with wholesome eating. Rooted in the belief that what you put into your body matters, we are dedicated to providing you with the purest and most nourishing flour and organic grain products.
        </p>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden shadow-lg"
          >
            <img 
              src="https://via.placeholder.com/500x400?text=Why+GutMantra" 
              alt="Why Choose GutMantra" 
              className="w-full h-full object-cover"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6">
              <p className="text-gray-700 leading-relaxed">
                In a world where shortcuts are often taken, we prioritise hygiene, purity and being free from artificial preserving to bring food that aligns with your journey towards healthier living.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border-2 border-primary/20 rounded-xl p-4">
                <p className="text-sm font-bold text-primary mb-2">100% Pure</p>
                <p className="text-xs text-gray-600">No preservatives, no additives</p>
              </div>
              <div className="bg-white border-2 border-secondary/20 rounded-xl p-4">
                <p className="text-sm font-bold text-secondary mb-2">Authentic</p>
                <p className="text-xs text-gray-600">Traditional methods only</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Core Values Section - 5 Pillars */}
      <motion.section className="max-w-6xl mx-auto px-4 sm:px-6 mb-20">
        <h2 className="text-4xl font-bold tracking-tighter text-center mb-16 text-primary">
          What Makes Us Different
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Pillar 1: Grain Quality */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border-2 border-orange-100 hover:shadow-lg transition-shadow"
          >
            <div className="mb-4">
              <div className="w-14 h-14 bg-orange-200 rounded-xl flex items-center justify-center mb-4">
                <Leaf size={28} className="text-orange-700" fill="currentColor" />
              </div>
              <h3 className="font-bold text-lg text-orange-900">No Compromise In Grain Quality</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              When it comes to grain quality, there's simply no comparison. Our flour stands out for its exceptional texture, consistent freshness, and superior nutritional value. Sourced from the finest grains, meticulously milled, and rigorously tested.
            </p>
          </motion.div>

          {/* Pillar 2: Stone Grinding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-8 border-2 border-amber-100 hover:shadow-lg transition-shadow"
          >
            <div className="mb-4">
              <div className="w-14 h-14 bg-amber-200 rounded-xl flex items-center justify-center mb-4">
                <Waypoints size={28} className="text-amber-700" />
              </div>
              <h3 className="font-bold text-lg text-amber-900">Traditional Stone Grinding</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              By using age-old techniques with natural stones, we ensure that our grains are ground slowly and at low temperatures, preserving the essential nutrients and flavors. Our commitment to this time-honored method reflects our dedication to quality.
            </p>
          </motion.div>

          {/* Pillar 3: Doorstep Delivery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-100 hover:shadow-lg transition-shadow"
          >
            <div className="mb-4">
              <div className="w-14 h-14 bg-green-200 rounded-xl flex items-center justify-center mb-4">
                <Truck size={28} className="text-green-700" />
              </div>
              <h3 className="font-bold text-lg text-green-900">Doorstep Delivery</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              We understand the importance of convenience and quality for our customers. Our doorstep delivery service ensures that you receive our premium, health-focused flours directly to your home, saving you time and effort.
            </p>
          </motion.div>

          {/* Pillar 4: Freshness */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border-2 border-blue-100 hover:shadow-lg transition-shadow"
          >
            <div className="mb-4">
              <div className="w-14 h-14 bg-blue-200 rounded-xl flex items-center justify-center mb-4">
                <Star size={28} className="text-blue-700" fill="currentColor" />
              </div>
              <h3 className="font-bold text-lg text-blue-900">Committed to Freshness</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Our commitment to freshness is at the heart of everything we do. From the moment it's milled to the time it reaches your kitchen, we guarantee unparalleled freshness, making every cooking a delightful experience.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Detailed Features Section */}
      <motion.section className="max-w-6xl mx-auto px-4 sm:px-6 mb-20 space-y-16">
        {/* Feature 1: No Compromise in Quality with Image */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden shadow-lg"
          >
            <img 
              src="https://via.placeholder.com/500x400?text=Grain+Quality" 
              alt="No Compromise In Grain Quality" 
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div>
            <h3 className="text-3xl font-bold text-primary mb-4">No Compromise In Grain Quality</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When it comes to grain quality, there's simply no comparison. Our flour stands out for its exceptional texture, consistent freshness, and superior nutritional value. Sourced from the finest grains, meticulously milled, and rigorously tested, our products ensure the highest standards of quality in every batch.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Whether you're making Fulka, Chapati, Rotis, or crafting gourmet dishes, trust our flour to deliver unmatched results every time. Choose the best; choose our premium grain flour.
            </p>
          </div>
        </motion.div>

        {/* Feature 2: Traditional Stone Grinding with Image */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h3 className="text-3xl font-bold text-secondary mb-4">Traditional Stone Grinding</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Traditional stone grinding holds a special place in our flour milling process. By using age-old techniques with natural stones, we ensure that our grains are ground slowly and at low temperatures, preserving the essential nutrients and flavors.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Unlike modern, high-speed mills, stone grinding prevents the loss of vitamins and minerals, providing our customers with flour that is not only healthier but also richer in taste and texture. Our commitment to this time-honored method reflects our dedication to quality and authenticity, delivering the finest flour just as nature intended.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden shadow-lg"
          >
            <img 
              src="https://via.placeholder.com/500x400?text=Stone+Grinding" 
              alt="Traditional Stone Grinding" 
              className="w-full h-full object-cover"
            />
          </motion.div>
        </motion.div>

        {/* Feature 3: Doorstep Delivery with Image */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden shadow-lg"
          >
            <img 
              src="https://via.placeholder.com/500x400?text=Doorstep+Delivery" 
              alt="Doorstep Delivery" 
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div>
            <h3 className="text-3xl font-bold text-primary mb-4">Doorstep Delivery</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We understand the importance of convenience and quality for our customers. Our doorstep delivery service ensures that you receive our premium, health-focused flours directly to your home, saving you time and effort.
            </p>
            <p className="text-gray-700 leading-relaxed">
              With just a few clicks, you can have our nutrient-rich, gluten-free flours delivered right to your doorstep, allowing you to enjoy the benefits of our carefully sourced grains without any hassle. Your health and satisfaction are our top priorities, and our delivery service is designed to make your life easier and healthier.
            </p>
          </div>
        </motion.div>

        {/* Feature 4: Committed to Freshness with Image */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h3 className="text-3xl font-bold text-secondary mb-4">Committed to Freshness</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our commitment to freshness is at the heart of everything we do. We carefully select the finest grains and utilise traditional stone-grinding processes to ensure our flour retains its natural goodness.
            </p>
            <p className="text-gray-700 leading-relaxed">
              From the moment it's milled to the time it reaches your kitchen, we guarantee unparalleled freshness, so you can cook with confidence, knowing you're using the highest quality ingredients. Our promise is to deliver flour that not only meets but exceeds your expectations, making every cooking a delightful experience.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden shadow-lg"
          >
            <img 
              src="https://via.placeholder.com/500x400?text=Freshness+Guaranteed" 
              alt="Committed to Freshness" 
              className="w-full h-full object-cover"
            />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Store Videos Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-6xl mx-auto px-4 sm:px-6 mb-20"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            Visit Our <span className="text-primary">Store</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Experience the authentic process behind our premium grain products through our collection of store videos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {storeVideos.map((video, idx) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative rounded-2xl overflow-hidden aspect-video cursor-pointer"
              onClick={() => setPlayingVideo(video.id)}
            >
              <img 
                src={video.thumbnail} 
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1.2 }}
                  className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center"
                >
                  <Play size={28} className="text-primary fill-primary" />
                </motion.div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-white font-semibold text-sm">{video.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto px-4 sm:px-6 bg-gradient-to-r from-primary to-secondary rounded-3xl p-12 text-center text-white"
      >
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">
          Join Our Growing Community
        </h2>
        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
          Be part of 5,000+ families in Pune who have rediscovered the joy of authentic, stone-ground nutrition.
        </p>
        <button className="px-10 py-4 bg-white text-primary font-bold rounded-full hover:bg-gray-50 transition-colors shadow-lg">
          Start Your Journey Today
        </button>
      </motion.section>
    </div>
  );
}
