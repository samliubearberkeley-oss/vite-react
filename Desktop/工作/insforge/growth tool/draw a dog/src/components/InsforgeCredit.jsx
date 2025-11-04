/**
 * InsforgeCredit - Credit links in bottom-right corner
 */
export default function InsforgeCredit() {
  return (
    <div className="fixed bottom-3 right-3 md:bottom-4 md:right-4 z-40 flex flex-col items-end gap-1.5">
      {/* Made by Sam Liu */}
      <a
        href="https://www.linkedin.com/in/sam-liu-025b871a2/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs md:text-sm text-gray-900 font-medium hover:opacity-80 transition-opacity"
        title="Made by Sam Liu"
      >
        Made by Sam Liu
      </a>
      
      {/* Powered by Insforge */}
      <a
        href="https://insforge.dev/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        title="Powered by Insforge"
      >
        <img 
          src="/insforge-logo.jpeg" 
          alt="Insforge" 
          className="h-4 md:h-5 w-auto"
        />
        <span className="text-xs md:text-sm text-gray-900 font-medium">
          Powered by Insforge
        </span>
      </a>
    </div>
  );
}

