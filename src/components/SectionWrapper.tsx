import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionWrapperProps {
  children: ReactNode;
  className?: string;
  theme?: "default" | "red" | "black" | "white";
}

const SectionWrapper = ({ children, className, theme = "default" }: SectionWrapperProps) => {
  const themeClasses = {
    default: "bg-background",
    red: "bg-red-team-light/30",
    black: "bg-black-team-light/50",
    white: "bg-white-team/80"
  };

  return (
    <section className={cn(
      "py-16 transition-colors duration-300",
      themeClasses[theme],
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
};

export default SectionWrapper;