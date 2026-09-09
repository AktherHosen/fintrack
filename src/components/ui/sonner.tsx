import React from 'react';
import { Toaster as Sonner, toast } from 'sonner';
import { useUIStore } from '../../stores/useUIStore';

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  const theme = useUIStore((state) => state.theme);

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group font-sans"
      richColors
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-zinc-950 group-[.toaster]:text-zinc-950 dark:group-[.toaster]:text-zinc-50 group-[.toaster]:border-zinc-200 dark:group-[.toaster]:border-zinc-800 group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl text-xs sm:text-sm font-medium',
          description: 'group-[.toast]:text-zinc-500 dark:group-[.toast]:text-zinc-400 text-xs mt-0.5',
          actionButton:
            'group-[.toast]:bg-zinc-900 dark:group-[.toast]:bg-zinc-100 group-[.toast]:text-zinc-50 dark:group-[.toast]:text-zinc-900 text-xs font-semibold rounded-lg',
          cancelButton:
            'group-[.toast]:bg-zinc-100 dark:group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-500 dark:group-[.toast]:text-zinc-400 text-xs rounded-lg',
        },
      }}
      {...props}
    />
  );
}

export { toast };
