
import React, { useState, useEffect, useRef } from 'react';

// Custom drag hook using native mouse events
const useDrag = (initialPos, onUpdate, zoom) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Keep a ref to the initial position to have the latest value inside callbacks
  const initialPosRef = useRef(initialPos);
  useEffect(() => {
    initialPosRef.current = initialPos;
  }, [initialPos]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.resize-handle') || e.target.closest('.connection-point')) return; // Don't drag if resizing or connecting
    e.stopPropagation();

    // Calculate where the mouse is relative to the shape's top-left corner
    const mouseX = e.clientX / zoom;
    const mouseY = e.clientY / zoom;
    const shapeX = initialPosRef.current.x;
    const shapeY = initialPosRef.current.y;

    dragOffset.current = {
      x: mouseX - shapeX,
      y: mouseY - shapeY,
    };

    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const mouseX = e.clientX / zoom;
      const mouseY = e.clientY / zoom;

      // New position is the mouse position minus the initial offset
      const newX = mouseX - dragOffset.current.x;
      const newY = mouseY - dragOffset.current.y;

      onUpdate({
        x: Math.max(0, newX),
        y: Math.max(0, newY),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onUpdate, zoom]);

  return handleMouseDown;
};

// Custom resize hook
const useResize = (initialSize, onUpdate, zoom) => {
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef(initialSize); // Ref to hold dimensions at resize start

  const handleMouseDown = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    // Store the starting mouse position
    resizeStartPos.current = { x: e.clientX / zoom, y: e.clientY / zoom };
    // Store the dimensions of the shape when resizing begins
    resizeStartSize.current = initialSize;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      e.preventDefault();
      
      const dx = (e.clientX / zoom) - resizeStartPos.current.x;
      const dy = (e.clientY / zoom) - resizeStartPos.current.y;
      
      // Calculate new size based on the size when the drag started
      onUpdate({ 
        width: Math.max(50, resizeStartSize.current.width + dx), 
        height: Math.max(30, resizeStartSize.current.height + dy) 
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onUpdate, zoom]);

  return handleMouseDown;
};

const ShapeComponent = ({ shape, children, isSelected, isEditing }) => {
  const baseStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    textAlign: 'center',
    fontSize: '14px',
    wordBreak: 'break-word',
    userSelect: 'none',
    boxSizing: 'border-box',
    position: 'relative',
    color: shape.textColor,
  };

  // Special handling for diamond shape using SVG for reliable border and shadow
  if (shape.type === 'diamond') {
    return (
      <div style={baseStyle}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 102 102"
          preserveAspectRatio="none"
          style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
        >
          <defs>
            <filter id={`shadow-${shape.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow 
                dx="0" 
                dy="2" 
                stdDeviation="2" 
                floodColor="rgba(0,0,0,0.1)"
              />
              {isSelected && (
                <feDropShadow 
                  dx="0" 
                  dy="0" 
                  stdDeviation="3" 
                  floodColor="rgba(59, 130, 246, 0.3)"
                />
              )}
            </filter>
          </defs>
          <polygon
            points="51,1 101,51 51,101 1,51"
            style={{
              fill: shape.fill,
              stroke: isSelected ? '#3b82f6' : shape.stroke,
              strokeWidth: 2,
              filter: `url(#shadow-${shape.id})`,
            }}
          />
        </svg>
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </div>
    );
  }

  // Add selection glow and shadow for other shapes (non-diamond)
  if (isSelected) {
    baseStyle.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.3), 0 4px 6px rgba(0,0,0,0.1)';
  } else {
    baseStyle.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  }

  // Apply shape-specific styles for other shapes (non-diamond)
  baseStyle.border = `2px solid ${isSelected ? '#3b82f6' : shape.stroke}`;
  baseStyle.backgroundColor = shape.fill;

  switch (shape.type) {
    case 'oval':
      baseStyle.borderRadius = '50%';
      break;
    case 'parallelogram':
      baseStyle.clipPath = 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)';
      break;
    case 'document':
      baseStyle.clipPath = 'polygon(0 0, 100% 0, 100% 80%, 85% 90%, 70% 100%, 0 100%)';
      break;
    case 'textbox':
      baseStyle.border = `1px dashed ${isSelected ? '#3b82f6' : '#9ca3af'}`;
      baseStyle.backgroundColor = 'transparent';
      break;
    default: // rectangle
      baseStyle.borderRadius = '4px';
  }

  return (
    <div style={baseStyle}>
      {children}
    </div>
  );
};

export default function FlowchartShape({ shape, onUpdate, isSelected, onSelect, zoom, onStartConnection, onRightClick }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(shape.text);
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef(null);

  const handleDrag = useDrag({ x: shape.x, y: shape.y }, (pos) => onUpdate(shape.id, pos), zoom);
  const handleResize = useResize({ width: shape.width, height: shape.height }, (size) => onUpdate(shape.id, size), zoom);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);
  
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleTextChange = (e) => {
    setEditText(e.target.value);
  };

  const handleTextBlur = () => {
    setIsEditing(false);
    onUpdate(shape.id, { text: editText });
  };
  
  const handleKeyDown = (e) => {
     if(e.key === 'Enter' && !e.shiftKey) {
       e.preventDefault();
       handleTextBlur();
     } else if (e.key === 'Escape') {
       setIsEditing(false);
       setEditText(shape.text); // Reset to original text
     }
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRightClick(e, shape.id);
  };

  const handleClick = (e) => {
    if (isEditing) return;
    e.stopPropagation();
    onSelect(shape.id);
  };

  // Connection points based on shape type
  const getConnectionPoints = () => {
    const points = [];
    
    switch (shape.type) {
      case 'diamond':
        // Diamond connection points at the actual diamond points
        points.push(
          { top: '0%', left: '50%', transform: 'translate(-50%, -50%)', position: 'top' },
          { top: '50%', left: '100%', transform: 'translate(-50%, -50%)', position: 'right' },
          { top: '100%', left: '50%', transform: 'translate(-50%, -50%)', position: 'bottom' },
          { top: '50%', left: '0%', transform: 'translate(-50%, -50%)', position: 'left' }
        );
        break;
      case 'oval':
        // Oval connection points at the edges
        points.push(
          { top: '0%', left: '50%', transform: 'translate(-50%, -50%)', position: 'top' },
          { top: '50%', left: '100%', transform: 'translate(-50%, -50%)', position: 'right' },
          { top: '100%', left: '50%', transform: 'translate(-50%, -50%)', position: 'bottom' },
          { top: '50%', left: '0%', transform: 'translate(-50%, -50%)', position: 'left' }
        );
        break;
      default:
        // Rectangle and other shapes
        points.push(
          { top: '0%', left: '50%', transform: 'translate(-50%, -50%)', position: 'top' },
          { top: '50%', left: '100%', transform: 'translate(-50%, -50%)', position: 'right' },
          { top: '100%', left: '50%', transform: 'translate(-50%, -50%)', position: 'bottom' },
          { top: '50%', left: '0%', transform: 'translate(-50%, -50%)', position: 'left' }
        );
    }
    
    return points;
  };

  const handleConnectionStart = (e, position) => {
    e.stopPropagation();
    // const rect = e.currentTarget.getBoundingClientRect(); // Not used in current logic
    // const shapeRect = e.currentTarget.closest('.flowchart-shape').getBoundingClientRect(); // Not used in current logic
    
    // Calculate the actual connection point coordinates
    const connectionPoint = {
      x: shape.x + (shape.width * (position === 'left' ? 0 : position === 'right' ? 1 : 0.5)),
      y: shape.y + (shape.height * (position === 'top' ? 0 : position === 'bottom' ? 1 : 0.5))
    };
    
    onStartConnection(shape.id, position, connectionPoint);
  };

  return (
    <div 
      className="flowchart-shape"
      onMouseDown={(e) => { 
        if (!isEditing) {
          handleDrag(e);
        }
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleRightClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        left: shape.x,
        top: shape.y,
        width: shape.width,
        height: shape.height,
        cursor: isEditing ? 'text' : 'move',
        zIndex: isSelected ? 10 : 1,
      }}
    >
      <ShapeComponent shape={shape} isSelected={isSelected} isEditing={isEditing}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-full bg-transparent text-center border-none outline-none resize-none p-1 m-0"
            style={{ 
              color: shape.textColor,
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span style={{ pointerEvents: 'none' }}>{shape.text}</span>
        )}
      </ShapeComponent>

      {(isSelected || isHovered) && !isEditing && (
        <>
          {/* Resize Handle - positioned at actual bottom-right corner */}
          <div
            className="resize-handle absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-se-resize hover:bg-blue-50 transition-colors"
            style={{
              bottom: '-6px',
              right: '-6px',
              zIndex: 20,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleResize(e);
            }}
          />
          
          {/* Connection Points */}
          {getConnectionPoints().map((pointStyle, i) => (
            <div
              key={i}
              className="connection-point absolute w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-crosshair opacity-0 hover:opacity-100 transition-opacity"
              style={{
                ...pointStyle,
                zIndex: 15,
              }}
              onMouseDown={(e) => handleConnectionStart(e, pointStyle.position)}
              title={`Connect from ${pointStyle.position}`}
            />
          ))}
        </>
      )}
    </div>
  );
}
