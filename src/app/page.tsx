"use client"

import { Hero } from "@/components/landing/hero"
import { ArticlesSection } from "@/components/landing/articles-section"
import { motion } from "framer-motion"

const testimonials = [
  { name: "Arya Sharma", role: "Art Student, NID", quote: "SketchOverFlow transformed my daily practice. The timed references pushed me to draw faster and more confidently." },
  { name: "Rahul Verma", role: "Freelance Illustrator", quote: "The variety of categories and timed sessions helped me improve my gesture drawing significantly in just weeks." },
  { name: "Priya Patel", role: "Design Intern", quote: "I love the challenges and community aspect. Getting feedback from other artists keeps me motivated." },
]

const faqs = [
  { q: "Is SketchOverFlow free?", a: "Yes! SketchOverFlow is completely free to use with unlimited practice sessions." },
  { q: "How does the timed practice work?", a: "Choose a category and time duration. Images are shown one at a time with an auto-advancing timer. You can sketch along or just observe." },
  { q: "Can I upload my own reference images?", a: "Reference images are curated and provided by our team to ensure quality across all categories." },
  { q: "How is XP calculated?", a: "You earn XP for completing sessions, maintaining streaks, and rating your practice. Leveling up unlocks new features." },
]

export default function HomePage() {
  return (
    <div>
      <Hero />
      <ArticlesSection />

      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold">What Artists Say</h2>
            <p className="text-muted-foreground mt-2">Join thousands of artists improving every day</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <p className="text-muted-foreground italic">"{t.quote}"</p>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20 bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </motion.div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="rounded-xl border border-border bg-card p-4 group">
                <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <svg className="h-4 w-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-muted-foreground text-sm">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
