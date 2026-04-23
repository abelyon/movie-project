export const floatingActionButtonBaseClass =
  "flex items-center justify-center rounded-4xl border-t border-neutral-600 bg-neutral-800/80 p-3 text-neutral-300 backdrop-blur-md transition-colors hover:text-white";

export const floatingActionButtonClass = `fixed bottom-4 right-4 z-50 ${floatingActionButtonBaseClass} sm:bottom-5 sm:[right:max(1.25rem,calc((100vw-56rem)/2+1.25rem))]`;
