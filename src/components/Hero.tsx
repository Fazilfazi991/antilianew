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
          <div className="overflow-hidden rounded-[22px] border border-white/30 bg-[#17191f]/80 p-4 text-left shadow-[0_24px_70px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-5">
            <p className="mb-3 flex items-center gap-2 font-body-md text-[15px] font-medium text-[#d9b780] sm:text-[16px]">
              <span className="material-symbols-outlined text-[#d9b780]" style={{ fontSize: 22 }}>flare</span>
              Start with Buy or Rent
            </p>
            <div className="space-y-3">
              <div className="grid max-w-[430px] grid-cols-2 rounded-full border border-white/30 bg-black/20 p-1">
                {TRANSACTION_TABS.map(tab => {
                  const active = transaction === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => selectTransaction(tab)}
                      aria-pressed={active}
                      className={`flex h-12 items-center justify-center gap-2 rounded-full px-4 font-body-md text-[16px] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#d9b780] sm:text-[18px] ${
                        active
                          ? 'bg-gradient-to-br from-[#ddc08e] to-[#a98451] text-white shadow-[0_8px_20px_rgba(191,151,92,0.3)]'
                          : 'text-white/90 hover:bg-white/10'
                      }`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{tab === 'Buy' ? 'business_center' : 'key'}</span>
                      {tab}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence initial={false}>
                {transaction && (
                  <motion.div
                    className="grid grid-cols-1 gap-2 overflow-hidden sm:grid-cols-3"
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
                          className={`h-11 rounded-xl border px-3 font-body-md text-[14px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#d9b780] sm:text-[16px] ${
                            active
                              ? 'border-[#d9b780] bg-[#d9b780]/20 text-white'
                              : 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10'
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

            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <label className="flex h-[54px] items-center gap-3 rounded-xl border border-white/30 bg-black/15 px-4 text-white/65 transition-colors focus-within:border-[#d9b780]">
                <span className="material-symbols-outlined text-[#d9b780]" style={{ fontSize: 22 }}>location_on</span>
                <input
                  type="text"
                  value={searchArea}
                  onChange={e => setSearchArea(e.target.value)}
                  placeholder="Select location(s)"
                  className="h-full min-w-0 flex-1 border-0 bg-transparent font-body-md text-[16px] font-medium text-white placeholder:text-white/60 focus:outline-none"
                />
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>keyboard_arrow_down</span>
              </label>
              <button
                type="submit"
                disabled={!canSearch}
                aria-describedby={!canSearch ? 'search-requirements' : undefined}
                className="flex h-[54px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#ddc08e] to-[#a98451] px-7 font-body-md text-[17px] font-semibold text-white shadow-[0_8px_20px_rgba(191,151,92,0.25)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-none disabled:bg-white/15 disabled:text-white/45 disabled:shadow-none sm:text-[18px]"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 23 }}>search</span>
                Search
              </button>
            </div>
            {!canSearch && <p id="search-requirements" className="pt-3 font-body-md text-[13px] text-white/55">Choose Buy or Rent, then select a property category to continue.</p>}
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
