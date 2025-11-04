/**
 * InsforgeCredit - Credit link with logo in bottom-right corner
 */
export default function InsforgeCredit() {
  return (
    <div className="fixed bottom-3 right-3 md:bottom-4 md:right-4 z-40">
      <a
        href="https://insforge.dev/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        title="Powered by Insforge"
      >
        <span className="text-xs md:text-sm text-gray-900 font-medium">
          Powered by
        </span>
        <img 
          src="/insforge-logo.jpeg" 
          alt="Insforge" 
          className="h-4 md:h-5 w-auto"
        />
      </a>
    </div>
  );
}

