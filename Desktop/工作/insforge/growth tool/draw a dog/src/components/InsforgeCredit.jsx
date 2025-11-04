/**
 * InsforgeCredit - Small credit link in bottom-right corner
 */
export default function InsforgeCredit() {
  return (
    <div className="fixed bottom-2 right-2 md:bottom-3 md:right-3 z-40">
      <a
        href="https://insforge.dev/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] md:text-xs text-white/70 hover:text-white transition-colors font-medium"
        title="Powered by Insforge"
      >
        Powered by <span className="font-bold">Insforge</span>
      </a>
    </div>
  );
}

