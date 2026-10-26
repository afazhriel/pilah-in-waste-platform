"use client";

import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

export interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  badge?: string | number;
  active?: boolean;
  onClick?: () => void;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-3.5 py-4 hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-900 w-[268px] flex-shrink-0",
        className
      )}
      animate={{
        width: animate ? (open ? "268px" : "68px") : "268px",
      }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-12 px-4 py-3 flex flex-row md:hidden items-center justify-between bg-neutral-100 dark:bg-neutral-900 w-full border-b border-neutral-200/80"
        )}
        {...props}
      >
        <div className="flex items-center justify-between z-20 w-full">
          <span className="text-xs font-semibold tracking-tight text-slate-900">
            Pilah.in · Dalam Naungan Hafi Digital
          </span>
          <button
            type="button"
            aria-label="Toggle Menu Navigasi"
            onClick={() => setOpen(!open)}
            className="p-1.5 rounded-lg text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200/60 cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.28,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-6 z-[100] flex flex-col justify-between overflow-y-auto",
                className
              )}
            >
              <button
                type="button"
                aria-label="Tutup Menu Navigasi"
                className="absolute right-6 top-6 z-50 p-2 rounded-lg text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <X className="h-5 w-5" />
              </button>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
} & Omit<React.ComponentProps<"a">, "href">) => {
  const { open, animate } = useSidebar();
  return (
    <a
      href={link.href}
      onClick={(e) => {
        if (link.onClick) {
          e.preventDefault();
          link.onClick();
        }
        props.onClick?.(e);
      }}
      className={cn(
        "flex items-center justify-between gap-2 group/sidebar py-2 px-2.5 rounded-xl transition-colors cursor-pointer",
        link.active
          ? "bg-slate-900 text-white font-semibold shadow-xs"
          : "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/70 dark:hover:bg-neutral-800",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-start gap-2.5 min-w-0">
        {link.icon}
        <motion.span
          animate={{
            display: animate ? (open ? "inline-block" : "none") : "inline-block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className={cn(
            "text-xs group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0",
            link.active
              ? "text-white font-semibold"
              : "text-neutral-700 dark:text-neutral-200"
          )}
        >
          {link.label}
        </motion.span>
      </div>
      {link.badge !== undefined && Number(link.badge) > 0 && open && (
        <span
          className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0",
            link.active
              ? "bg-[#009CAC] text-white"
              : "bg-teal-500/15 text-[#009CAC]"
          )}
        >
          {link.badge}
        </span>
      )}
    </a>
  );
};
