import { motion } from "motion/react";
import { ArrowUp } from "lucide-react";
import { useState } from "react";

export default function PrivacyPolicy() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const sections = [
    {
      id: "interpretation",
      title: "Interpretation and Definitions",
      content: [
        {
          subtitle: "Interpretation",
          text: "The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.",
        },
        {
          subtitle: "Key Definitions",
          items: [
            "Account: A unique account created for You to access our Service or parts of our Service.",
            "Company: Kanak Enterprises, Shop No. 8, Town Plaza, Pride World City, Charoli Budruk, near DY Patil University Road, Lohegaon, Pune, Maharashtra 412105.",
            "Cookies: Small files that are placed on Your computer, mobile device by a website.",
            "Device: Any device that can access the Service such as a computer, cellphone or digital tablet.",
            "Personal Data: Any information that relates to an identified or identifiable individual.",
            "Service: The Website (GutMantra - www.gutmantra.in)",
            "You: The individual accessing or using the Service.",
          ],
        },
      ],
    },
    {
      id: "collecting",
      title: "Collecting and Using Your Personal Data",
      content: [
        {
          subtitle: "Types of Data Collected - Personal Data",
          text: "While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. This may include:",
          items: [
            "Email address",
            "First name and last name",
            "Phone number",
            "Address, State, Province, ZIP/Postal code, City",
          ],
        },
        {
          subtitle: "Usage Data",
          text: "Usage Data is collected automatically when using the Service. This may include information such as Your Device's Internet Protocol address (IP address), browser type, browser version, pages visited, time and date of visits, and unique device identifiers.",
        },
      ],
    },
    {
      id: "cookies",
      title: "Tracking Technologies and Cookies",
      content: [
        {
          subtitle: "About Cookies",
          text: "We use Cookies and similar tracking technologies to track the activity on Our Service. Cookies can be 'Persistent' or 'Session' Cookies. Persistent Cookies remain on Your personal computer when You go offline, while Session Cookies are deleted as soon as You close Your web browser.",
        },
        {
          subtitle: "Types of Cookies We Use",
          items: [
            "Necessary/Essential Cookies (Session) - Essential for services and user authentication",
            "Cookies Policy/Notice Acceptance Cookies (Persistent) - Identify if users have accepted cookies",
            "Functionality Cookies (Persistent) - Remember choices made when using the Website",
          ],
        },
      ],
    },
    {
      id: "usage",
      title: "Use of Your Personal Data",
      content: [
        {
          subtitle: "Purposes",
          items: [
            "To provide and maintain our Service, including monitoring usage",
            "To manage Your Account and registration",
            "For performance of purchase contracts and orders",
            "To contact You regarding updates and important communications",
            "To provide special offers and information about similar products/services",
            "For business transfers and company restructuring",
            "For data analysis and improving the Service",
          ],
        },
      ],
    },
    {
      id: "retention",
      title: "Retention of Your Personal Data",
      content: [
        {
          subtitle: "Data Retention Policy",
          text: "The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our legal agreements and policies.",
        },
      ],
    },
    {
      id: "security",
      title: "Security of Your Personal Data",
      content: [
        {
          subtitle: "Our Commitment",
          text: "The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.",
        },
      ],
    },
  ];

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
            Privacy Policy
          </h1>
          <p className="text-gray-600 text-lg">
            This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service.
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 mb-12 border-l-4 border-primary"
        >
          <p className="text-gray-700 leading-relaxed">
            We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-4 mb-12">
          {sections.map((section, idx) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary/30 transition-colors"
            >
              <button
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-lg font-bold text-primary text-left">{section.title}</h2>
                <ArrowUp
                  className={`transition-transform ${expandedSection === section.id ? "rotate-180" : ""}`}
                  size={20}
                />
              </button>

              <motion.div
                initial={{ height: 0 }}
                animate={{ height: expandedSection === section.id ? "auto" : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden bg-gray-50"
              >
                <div className="px-6 py-4 space-y-6 border-t border-gray-200">
                  {section.content.map((part, idx) => (
                    <div key={idx} className="space-y-3">
                      {part.subtitle && (
                        <h3 className="font-bold text-primary text-md">{part.subtitle}</h3>
                      )}
                      {part.text && <p className="text-gray-700 leading-relaxed">{part.text}</p>}
                      {part.items && (
                        <ul className="space-y-2 ml-4">
                          {part.items.map((item, idx) => (
                            <li key={idx} className="text-gray-700 leading-relaxed flex gap-3">
                              <span className="text-primary font-bold flex-shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 border-l-4 border-secondary"
        >
          <h2 className="text-2xl font-bold text-primary mb-6">Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about this Privacy Policy, You can contact us:
          </p>
          <div className="space-y-3">
            <p className="text-gray-700">
              <span className="font-semibold">Email:</span> GutMantra24@gmail.com
            </p>
            <p className="text-gray-700">
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
