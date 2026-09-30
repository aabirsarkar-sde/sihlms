import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const base = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-touch [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-brand-700 text-white hover:bg-brand-800",
        accent: "bg-saffron-500 text-black hover:bg-saffron-400",
        outline: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-800",
        ghost: "text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800",
        destructive: "bg-red-700 text-white hover:bg-red-800",
        link: "text-brand-700 underline-offset-4 hover:underline dark:text-brand-300 min-h-0",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-11 px-3 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

/** cva + tailwind-merge so a passed className (e.g. bg-transparent) really overrides the variant. */
export const buttonVariants = (o?: Parameters<typeof base>[0]) => cn(base(o));

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof base> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = "Button";
