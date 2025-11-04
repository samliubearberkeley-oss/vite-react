import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

/**
 * CanvasBoard - Drawing canvas using native Canvas API
 * Completely manual to ensure paths persist
 */
const CanvasBoard = forwardRef(function CanvasBoard({ onScoreChange }, ref) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const isDrawingRef = useRef(false);
  const pathsRef = useRef([]);

  // Function to redraw all paths
  const redrawAllPaths = (ctx) => {
    pathsRef.current.forEach((path) => {
      if (path.points.length === 0) return;
      
      // Draw first point
      const firstPoint = path.points[0];
      ctx.beginPath();
      ctx.arc(firstPoint.x, firstPoint.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      
      // Draw lines between points
      if (path.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(firstPoint.x, firstPoint.y);
        
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
      }
    });
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Canvas size - optimized for no-scroll layout (rectangular)
    const isMobile = window.innerWidth < 768;
    const canvasWidth = isMobile ? Math.min(window.innerWidth - 80, 252) : 392;
    const canvasHeight = isMobile ? Math.min(window.innerWidth - 80, 168) : 252;
    
    // Set canvas size (both display and internal)
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    
    // Configure drawing context
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    
    contextRef.current = ctx;

    // Redraw existing paths after setting up canvas
    redrawAllPaths(ctx);

    // Resize handler
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      const newWidth = newIsMobile ? Math.min(window.innerWidth - 80, 252) : 392;
      const newHeight = newIsMobile ? Math.min(window.innerWidth - 80, 168) : 252;
      
      // Save current drawing as image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);
      
      // Resize
      canvas.width = newWidth;
      canvas.height = newHeight;
      canvas.style.width = `${newWidth}px`;
      canvas.style.height = `${newHeight}px`;
      
      // Reconfigure context
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      
      // Restore drawing (scaled)
      const scaleX = newWidth / tempCanvas.width;
      const scaleY = newHeight / tempCanvas.height;
      ctx.scale(scaleX, scaleY);
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    };
    
    window.addEventListener('resize', handleResize);

    // Score calculation
    const calculateScore = () => {
      const pathCount = pathsRef.current.length;
      
      let mockScore = 0.3;
      
      if (pathCount > 0) {
        // Simple scoring based on number of strokes
        mockScore = Math.min(0.3 + (pathCount * 0.08), 0.95);
        mockScore += (Math.random() - 0.5) * 0.1;
        mockScore = Math.max(0.1, Math.min(0.95, mockScore));
      }
      
      if (onScoreChange) {
        onScoreChange(mockScore);
      }
    };

    // Get mouse/touch position
    const getPosition = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      let clientX, clientY;
      
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    // Last position for drawing
    let lastPos = null;
    
    // Start drawing
    const startDrawing = (e) => {
      e.preventDefault();
      isDrawingRef.current = true;
      
      const pos = getPosition(e);
      lastPos = pos;
      
      // Draw starting point
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      
      // Store path start
      pathsRef.current.push({
        points: [pos],
        complete: false,
      });
      
    };

    // Continue drawing
    const draw = (e) => {
      if (!isDrawingRef.current || !lastPos) return;
      e.preventDefault();
      
      const pos = getPosition(e);
      
      // Draw line from last position to current position
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      
      // Update last position
      lastPos = pos;
      
      // Store point
      const currentPath = pathsRef.current[pathsRef.current.length - 1];
      if (currentPath) {
        currentPath.points.push(pos);
      }
    };

    // Stop drawing
    const stopDrawing = (e) => {
      if (!isDrawingRef.current) return;
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      
      isDrawingRef.current = false;
      lastPos = null;
      
      // Mark path as complete
      const currentPath = pathsRef.current[pathsRef.current.length - 1];
      if (currentPath) {
        currentPath.complete = true;
      }
      
      // Calculate score
      calculateScore();
    };

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    // Touch events
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
      canvas.removeEventListener('touchcancel', stopDrawing);
    };
  }, [onScoreChange]);

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pathsRef.current = [];
      if (onScoreChange) {
        onScoreChange(0);
      }
    }
  };

  // Export canvas
  const exportCanvas = () => {
    return new Promise((resolve) => {
      if (canvasRef.current) {
        canvasRef.current.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      } else {
        resolve(null);
      }
    });
  };

  useImperativeHandle(ref, () => ({
    exportCanvas,
    clearCanvas,
  }));

  return (
    <div className="relative bg-white rounded-2xl shadow-2xl p-4 md:p-5 lg:p-6 paper-texture w-full mx-auto">
      <div className="flex justify-end mb-4 md:mb-5 mt-1 md:mt-2">
        <button
          onClick={clearCanvas}
          className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg crayon-text shadow-lg text-xs md:text-sm font-bold transition-all"
        >
          🗑️ Clear Canvas
        </button>
      </div>
      
      <div className="relative flex flex-col items-center">
        <canvas 
          ref={canvasRef} 
          className="border-4 border-gray-800 rounded-xl hand-drawn-border w-full"
          style={{ 
            maxWidth: '100%', 
            height: 'auto', 
            touchAction: 'none',
            cursor: 'crosshair',
          }}
        />
      </div>
      
      <p className="mt-3 md:mt-4 text-sm md:text-base lg:text-lg text-gray-600 text-center px-2 md:px-4">
        🎨 Draw your dog here! Each stroke stays on the canvas.
      </p>
    </div>
  );
});

export default CanvasBoard;
