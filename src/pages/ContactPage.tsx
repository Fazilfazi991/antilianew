import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getWhatsAppURL } from '@/lib/utils';

export function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { error: err } = await supabase.from('inquiries').insert({
        type: 'general',
        name: form.name,
        phone: form.phone,
        message: form.message,
        status: 'new',
      });
      if (err) throw err;
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed. Please try WhatsApp instead.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full bg-transparent border-0 border-b border-outline-variant focus:border-secondary focus:ring-0 focus:outline-none pb-3 font-body-md text-body-md text-primary placeholder:text-outline-variant transition-colors duration-300';

  return (
    <div className="min-h-screen pt-20">

      {/* Hero */}
      <section className="w-full bg-[#121212] pt-24 pb-20 px-margin-edge border-b border-white/10">
        <div className="max-w-container-max mx-auto">
          <span className="font-label-caps text-label-caps text-[#A68966] uppercase tracking-[0.2em] block mb-4">
            Get in Touch
          </span>
          <div className="w-8 h-px bg-[#A68966] mb-8" />
          <h1 className="font-display-xl text-display-xl text-[#F9F8F6] mb-6 max-w-2xl">
            Begin Your Journey
          </h1>
          <p className="font-body-lg text-body-lg text-white/50 max-w-xl">
            Our team in Dubai and Doha is available seven days a week.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-container-max mx-auto px-margin-edge py-section-gap">
        <div className="grid grid-cols-12 gap-gutter">

          {/* WhatsApp CTA — primary */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-12">
            <div>
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.2em] block mb-6">
                Fastest Response
              </span>
              <h2 className="font-headline-md text-headline-md text-primary mb-6">
                WhatsApp Us Directly
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-8">
                Our team typically replies within minutes during business hours.
                Send us a message and we'll get back to you right away.
              </p>
              <a
                href={getWhatsAppURL()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chat</span>
                Open WhatsApp
              </a>
            </div>

            {/* Office info */}
            <div className="border-t border-surface-variant pt-12 space-y-8">
              <div>
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] block mb-2">
                  Dubai Office
                </span>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Business Bay, Dubai, UAE
                </p>
              </div>
              <div>
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] block mb-2">
                  Doha Office
                </span>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  West Bay, Doha, Qatar
                </p>
              </div>
              <div>
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] block mb-2">
                  Hours
                </span>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Sun – Thu: 9:00 am – 6:00 pm<br />
                  Sat: 10:00 am – 3:00 pm<br />
                  Fri: Closed
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            {done ? (
              <div className="py-24 border-t border-surface-variant">
                <span className="material-symbols-outlined text-4xl text-secondary block mb-6">check_circle</span>
                <h2 className="font-headline-md text-headline-md text-primary mb-4">
                  Message Received
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Thank you, {form.name}. We'll be in touch within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="border-t border-surface-variant pt-12">
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.2em] block mb-8">
                    Send a Message
                  </span>
                </div>

                <div>
                  <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
                    Name *
                  </label>
                  <input
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    required
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
                    Phone
                  </label>
                  <input
                    className={inputClass}
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+971 50 123 4567"
                  />
                </div>

                <div>
                  <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
                    Message *
                  </label>
                  <textarea
                    className={inputClass + ' resize-none h-32'}
                    value={form.message}
                    onChange={(e) => set('message', e.target.value)}
                    required
                    placeholder="Tell us what you're looking for…"
                  />
                </div>

                {error && (
                  <p className="font-body-md text-body-md text-error border-b border-error pb-3">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-8 py-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending…' : 'Send Message'}
                  {!submitting && (
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
