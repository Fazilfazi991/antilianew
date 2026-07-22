import { motion, useInView } from "motion/react";
import { useRef, createElement } from "react";

type Props = {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  startDelay?: number;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
};

export function BlurText({
  text,
  className = "",
  style,
  delay = 0.07,
  startDelay = 0,
  as = "h2",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true, amount: 0.3 });
  const words = text.split(" ");

  const children: React.ReactNode[] = [];
  words.forEach((w, i) => {
    children.push(
      <motion.span
        key={i}
        className="inline-block will-change-[filter,transform,opacity]"
        initial={{ filter: "blur(10px)", opacity: 0, y: 24 }}
        animate={inView ? { filter: "blur(0px)", opacity: 1, y: 0 } : undefined}
        transition={{
          duration: 0.7,
          ease: [0.22, 1, 0.36, 1],
          delay: startDelay + i * delay,
        }}
      >
        {w}
      </motion.span>
    );
    if (i < words.length - 1) children.push(" ");
  });

  return createElement(as, { ref, className, style }, ...children);
}
