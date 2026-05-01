import { motion } from "motion/react";
import { AlertCircle, Clock, RotateCcw, CheckCircle, Wallet } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-white pt-28 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-primary mb-4">
            Refund Policy
          </h1>
          <p className="text-gray-600 text-lg">
            Understand our refund and return policies for all GutMantra products.
          </p>
        </motion.div>

        {/* Main Policy */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 mb-12 border-l-4 border-red-500"
        >
          <h2 className="text-3xl font-bold text-red-700 mb-4 flex items-center gap-3">
            <AlertCircle size={32} />
            Important Notice
          </h2>
          <p className="text-lg text-gray-800 font-semibold leading-relaxed">
            All transactions are considered final as we specialize in offering perishable goods, thus we do not entertain returns, refunds, or cancellations.
          </p>
        </motion.div>

        {/* Exception Policy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 20 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <CheckCircle size={32} fill="currentColor" />
            Exception Policy
          </h2>
          <div className="bg-white border-2 border-primary/20 rounded-xl p-8">
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              Nonetheless, in the rare instance of an <span className="font-semibold">incorrect or incomplete delivery</span>, we will gladly issue a refund for the specific items that were omitted from your order.
            </p>

            {/* Refund Methods */}
            <h3 className="text-xl font-bold text-secondary mb-6">Refund Methods</h3>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Cash on Delivery */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200"
              >
                <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <Wallet size={20} />
                  Cash on Delivery
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  For Cash on Delivery transactions, we will promptly contact you for the requisite bank account details to facilitate the refund process.
                </p>
              </motion.div>

              {/* Online Payments */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200"
              >
                <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                  <RotateCcw size={20} />
                  Online Payments
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  For payments made via Credit Card, Debit Card, Net Banking, or any other online payment method, the refund will be initiated through the same channel.
                </p>
              </motion.div>
            </div>

            {/* Timeline */}
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={20} className="text-primary" />
                Refund Timeline
              </h4>
              <p className="text-sm text-gray-700">
                The refund should reflect in your account within an estimated <span className="font-bold text-primary">3-4 days</span> after processing.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Fraud Policy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 border-l-4 border-amber-500 mb-12"
        >
          <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
            <AlertCircle size={28} />
            Fraud Prevention
          </h2>
          <p className="text-gray-800 leading-relaxed">
            Gut Mantra and its parent organization Kanak Enterprises retains the right to cancel any order if there are suspicions of fraudulent activity or if the terms and conditions of website usage are violated by the customer.
          </p>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-primary mb-8">Frequently Asked Questions</h2>

          <div className="space-y-6">
            {[
              {
                q: "Can I return my order if I changed my mind?",
                a: "Unfortunately, since we specialize in perishable goods, all transactions are considered final and returns are not entertained unless there is an issue with incorrect or incomplete delivery.",
              },
              {
                q: "What if I received incomplete items in my order?",
                a: "If you received an incomplete or incorrect delivery, please contact us immediately. We will issue a refund for the missing items. For COD orders, we'll contact you for bank details. For online payments, the refund will be processed to the original payment method.",
              },
              {
                q: "How long does it take to receive a refund?",
                a: "Refunds typically reflect in your account within 3-4 business days after we process your request, depending on your bank and payment method.",
              },
              {
                q: "Can I cancel my order?",
                a: "Since we deal with perishable goods, cancellations are generally not entertained. However, if you encounter any issues after placing your order, please contact us as soon as possible.",
              },
              {
                q: "What payment methods are accepted for refunds?",
                a: "Refunds are issued through the same payment method used for the original transaction. For online payments (Credit Card, Debit Card, Net Banking, etc.), the refund goes back to that method. For Cash on Delivery, we collect your bank account details.",
              },
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-primary text-lg mb-3">{faq.q}</h3>
                <p className="text-gray-700 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-3">Have More Questions?</h2>
          <p className="mb-6">Get in touch with our support team for assistance with refunds or any other queries.</p>
          <div className="space-y-2">
            <p>
              <span className="font-semibold">Email:</span> GutMantra24@gmail.com
            </p>
            <p>
              <span className="font-semibold">Phone:</span> +91 9028107111
            </p>
          </div>
        </motion.div>

        {/* Last Updated */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>Last updated: April 2026</p>
          <p className="mt-2">© 2026 Kanak Enterprises. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
