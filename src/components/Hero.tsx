import { useState } from 'react';
import { AnimatePresence, useReducedMotion, motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";

const HEADLINE = "Curated Excellence";
const TRANSACTION_TABS = ['Buy', 'Rent'] as const;
const SEGMENT_TABS = ['Commercial', 'Residential', 'Industrial'] as const;
type TransactionTab = typeof TRANSACTION_TABS[number];
type SegmentTab = typeof SEGMENT_TABS[number];

export function Hero() {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const words = HEADLINE.split(" ");
  const [transaction, setTransaction] = useState<TransactionTab | null>(null);
  const [segment, setSegment] = useState<SegmentTab | null>(null);
  const [searchArea, setSearchArea] = useState('');

  const wordVariants = {
    hidden: reduced
      ? { opacity: 0 }
      : { opacity: 0, filter: "blur(12px)", y: 28 },
    visible: (i: number) => ({
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      },
    }),
  };

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!transaction || !segment) return;
    const params = new URLSearchParams();
    params.set('transactionType', transaction.toLowerCase());
    params.set('category', segment.toLowerCase());
    if (searchArea.trim()) params.set('location', searchArea.trim());
    navigate(`/properties?${params.toString()}`);
  }

  function selectTransaction(nextTransaction: TransactionTab) {
    setTransaction(nextTransaction);
    setSegment(null);
  }

  const canSearch = transaction !== null && segment !== null;

  return (
    <section className="relative min-h-[86dvh] w-full overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/hero-aerial.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[86dvh] px-5 md:px-12 text-center pb-12 pt-28">
        <motion.span
          className="font-label-caps text-label-caps text-[#A68966] uppercase tracking-[0.25em] block mb-4"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Qatar
        </motion.span>

        <h1 className="font-display-xl text-display-xl text-white flex flex-wrap justify-center gap-x-4 mb-5">
          {words.map((word, i) => (
            <motion.span
              key={word + i}
              className="inline-block"
              custom={i}
              initial="hidden"
              animate="visible"
              variants={wordVariants}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="font-body-md text-body-md text-white/75 mb-8 max-w-xl"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: words.length * 0.1 + 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Discover a meticulously selected portfolio of architectural masterpieces across Qatar.
        </motion.p>

        <motion.form
          onSubmit={handleSearch}
          className="w-full max-w-[760px] mb-7"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: words.length * 0.1 + 0.2, duration: 0.6 }}
        >
          <div className="overflow-hidden rounded-md border border-white/20 bg-[#f9f8f6] shadow-2xl shadow-black/30">
            <div className="grid gap-1 bg-[#d7d1c8]">
              <div className="grid grid-cols-2 gap-px bg-[#d7d1c8]">
                {TRANSACTION_TABS.map(tab => {
                  const active = transaction === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => selectTransaction(tab)}
                      aria-pressed={active}
                      className={`h-10 px-4 font-body-md text-[16px] font-semibold transition-colors sm:h-11 sm:text-[18px] ${
                        active
                          ? 'bg-[#A68966] text-white'
                          : 'bg-[#eee9e2] text-[#1b1c1c] hover:bg-[#e4ddd4]'
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence initial={false}>
                {transaction && (
                  <motion.div
                    className="grid grid-cols-3 gap-px overflow-hidden bg-[#d7d1c8]"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: reduced ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {SEGMENT_TABS.map(tab => {
                      const active = segment === tab;
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setSegment(tab)}
                          aria-pressed={active}
                          className={`h-10 px-3 font-body-md text-[14px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#A68966] sm:h-11 sm:text-[17px] ${
                            active
                              ? 'bg-[#1b1c1c] text-white'
                              : 'bg-[#f4f0ea] text-[#1b1c1c] hover:bg-[#e7dfd5]'
                          }`}
                        >
                          {tab}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid gap-px bg-[#d7d1c8] sm:grid-cols-[1fr_180px]">
              <input
                type="text"
                value={searchArea}
                onChange={e => setSearchArea(e.target.value)}
                placeholder="Select location(s)"
                className="h-12 w-full rounded-none border-0 bg-white px-5 font-body-md text-[15px] font-semibold text-[#1b1c1c] placeholder:text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#A68966] sm:h-[52px] sm:text-[16px]"
              />
              <button
                type="submit"
                disabled={!canSearch}
                aria-describedby={!canSearch ? 'search-requirements' : undefined}
                className="h-12 bg-[#A68966] px-7 font-body-md text-[16px] font-semibold text-white transition-colors hover:bg-[#8a6e4e] disabled:cursor-not-allowed disabled:bg-[#b7aa9b] disabled:text-white/75 sm:h-[52px]"
              >
                Search
              </button>
            </div>
            {!canSearch && <p id="search-requirements" className="bg-white px-5 py-2 text-left font-body-md text-[13px] text-[#655b50]">Select Buy or Rent, then choose a property category to search.</p>}
          </div>
        </motion.form>

        <motion.div
          className="flex flex-col sm:flex-row gap-3"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: words.length * 0.1 + 0.35, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        >
          <motion.div whileHover={reduced ? {} : { scale: 1.03 }} whileTap={reduced ? {} : { scale: 0.97 }}>
            <Link
              to="/properties"
              className="inline-block border border-white/50 text-white px-6 py-3.5 font-label-caps text-label-caps tracking-[0.1em] uppercase hover:border-white hover:bg-white/10 transition-all duration-300"
            >
              Explore Properties
            </Link>
          </motion.div>
          <motion.div whileHover={reduced ? {} : { scale: 1.03 }} whileTap={reduced ? {} : { scale: 0.97 }}>
            <Link
              to="/portal/login"
              className="inline-block bg-[#A68966] text-white px-6 py-3.5 font-label-caps text-label-caps tracking-[0.1em] uppercase hover:bg-[#8a6e4e] transition-colors duration-300"
            >
              List Your Property
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
