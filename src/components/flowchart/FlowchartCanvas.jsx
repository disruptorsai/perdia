
import React, { useRef, useState, useEffect, useCallback } from 'react'; // Added useCallback
import FlowchartShape from './FlowchartShape';

// Arrow Text Component
const ArrowText = ({ connection, onUpdate, isSelected, zoom }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(connection.text || '');
  const dragOffset = useRef({ x: 0, y: 0 });

  // Calculate position along the path based on percentage (0-1)
  const getTextPosition = () => {
    const { start, end, anchors = [], textPosition = 0.5 } = connection;
    
    if (!start || !end) { // Ensure start and end points exist
      return { x: 0, y: 0 };
    }

    if (anchors.length === 0) {
      // Simple linear interpolation for straight line
      return {
        x: start.x + (end.x - start.x) * textPosition,
        y: start.y + (end.y - start.y) * textPosition
      };
    } else {
      // For paths with anchors, find position along the path
      const points = [start, ...anchors, end];
      const totalSegments = points.length - 1;
      
      // Ensure textPosition is within bounds [0, 1]
      const clampedTextPosition = Math.max(0, Math.min(1, textPosition));

      const segmentIndex = Math.floor(clampedTextPosition * totalSegments);
      const segmentProgress = (clampedTextPosition * totalSegments) - segmentIndex;
      
      const segmentStart = points[Math.min(segmentIndex, points.length - 2)]; // Ensure not to go out of bounds
      const segmentEnd = points[Math.min(segmentIndex + 1, points.length - 1)]; // Ensure not to go out of bounds
      
      return {
        x: segmentStart.x + (segmentEnd.x - segmentStart.x) * segmentProgress,
        y: segmentStart.y + (segmentEnd.y - segmentStart.y) * segmentProgress
      };
    }
  };

  const textPos = getTextPosition();

  const handleMouseDown = (e) => {
    if (isEditing) return;
    e.stopPropagation(); // Prevent canvas click/drag
    setIsDragging(true);
    const rect = e.currentTarget.closest('svg').getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoom; // Adjusted for zoom
    const mouseY = (e.clientY - rect.top) / zoom;  // Adjusted for zoom
    dragOffset.current = {
      x: mouseX - textPos.x,
      y: mouseY - textPos.y,
    };
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditText(connection.text || '');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      onUpdate(connection.id, { text: editText });
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(connection.text || ''); // Revert to original text
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    onUpdate(connection.id, { text: editText });
  };

  // Calculate text position percentage along path
  const calculateTextPosition = useCallback((mouseX, mouseY) => { // Memoized with useCallback
    const { start, end, anchors = [] } = connection;
    
    if (!start || !end) return 0.5;

    if (anchors.length === 0) {
      // For straight line, calculate closest point
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const lengthSq = dx * dx + dy * dy;
      
      if (lengthSq === 0) return 0.5; // Avoid division by zero

      // Project mouse point onto the line segment
      const t = Math.max(0, Math.min(1, ((mouseX - start.x) * dx + (mouseY - start.y) * dy) / lengthSq));
      return t;
    } else {
      // For paths with anchors, find closest segment and position
      const points = [start, ...anchors, end];
      let closestDistance = Infinity;
      let bestPosition = 0.5;
      
      for (let i = 0; i < points.length - 1; i++) {
        const segStart = points[i];
        const segEnd = points[i + 1];
        
        const dx = segEnd.x - segStart.x;
        const dy = segEnd.y - segStart.y;
        const lengthSq = dx * dx + dy * dy;
        
        if (lengthSq === 0) continue; // Skip zero-length segments
        
        // Project mouse point onto the current segment
        const t = Math.max(0, Math.min(1, ((mouseX - segStart.x) * dx + (mouseY - segStart.y) * dy) / lengthSq));
        const closestX = segStart.x + t * dx;
        const closestY = segStart.y + t * dy;
        
        const distance = Math.sqrt((mouseX - closestX) ** 2 + (mouseY - closestY) ** 2);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          // Calculate overall path percentage for this segment point
          // This assumes segments contribute equally to the 'percentage' based on segment count
          bestPosition = (i + t) / (points.length - 1);
        }
      }
      
      return bestPosition;
    }
  }, [connection]); // Dependency on connection to re-calculate if connection changes

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      
      // Get the SVG's bounding client rect
      const svgElement = document.querySelector('.flowchart-canvas svg');
      if (!svgElement) return;

      const rect = svgElement.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoom; // Adjusted for zoom
      const mouseY = (e.clientY - rect.top) / zoom;  // Adjusted for zoom
      
      // Calculate new text position based on mouse coordinates relative to the path
      const newTextPosition = calculateTextPosition(mouseX, mouseY);
      onUpdate(connection.id, { textPosition: newTextPosition });
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
  }, [isDragging, connection.id, onUpdate, calculateTextPosition, zoom]); // Added zoom to dependencies

  // Only render if there's text or if actively editing
  if (!connection.text && !isEditing) return null;

  // Adjusted textWidth calculation for slightly larger text and padding
  const textWidth = connection.text ? connection.text.length * 7 + 15 : 60; 

  return (
    <g>
      {/* Background rectangle for better readability */}
      <rect
        x={textPos.x - (textWidth / 2)}
        y={textPos.y - 10} // Adjusted
        width={textWidth}
        height="20" // Adjusted
        fill="white"
        stroke={isSelected ? "#3b82f6" : "#e2e8f0"}
        strokeWidth="1"
        rx="2"
        style={{ cursor: isDragging ? 'grabbing' : 'grab', pointerEvents: isEditing ? 'none' : 'all' }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      />
      
      {isEditing ? (
        <foreignObject x={textPos.x - (textWidth / 2)} y={textPos.y - 10} width={textWidth} height="20"> {/* Adjusted */}
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            autoFocus
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: 'transparent',
              textAlign: 'center',
              fontSize: '13px', // Adjusted
              outline: 'none',
              position: 'relative',
              zIndex: 100 
            }}
          />
        </foreignObject>
      ) : (
        <text
          x={textPos.x}
          y={textPos.y + 4}
          textAnchor="middle"
          fontSize="13" // Adjusted
          fill="#374151"
          style={{ cursor: isDragging ? 'grabbing' : 'grab', pointerEvents: 'none' }}
        >
          {connection.text}
        </text>
      )}
    </g>
  );
};

// SVG Arrow Component with Straight Lines
const Arrow = ({ start, end, id, isSelected, onSelect, onRightClick, anchors = [] }) => {
  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRightClick(e, id);
  };

  // Create path string with straight line segments
  const createPath = () => {
    if (!start || !end) return ''; // Ensure start and end points exist
    let path = `M ${start.x} ${start.y}`;
    anchors.forEach(anchor => {
      path += ` L ${anchor.x} ${anchor.y}`;
    });
    path += ` L ${end.x} ${end.y}`;
    return path;
  };
  
  // No longer needed since ArrowText component handles text rendering
  // const getArrowAngle = () => { ... }; 

  return (
    <g 
      onClick={() => onSelect(id)} 
      onContextMenu={handleRightClick}
      className="cursor-pointer"
    >
      <defs>
        <marker
          id={`arrowhead-${id}${isSelected ? '-selected' : ''}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={isSelected ? "#3b82f6" : "#374151"} />
        </marker>
      </defs>
      
      <path
        d={createPath()}
        stroke={isSelected ? "#3b82f6" : "#374151"}
        strokeWidth={isSelected ? 3 : 2}
        fill="none"
        markerEnd={`url(#arrowhead-${id}${isSelected ? '-selected' : ''})`}
      />
      
      {/* Invisible wider path for easier clicking */}
      <path
        d={createPath()}
        stroke="transparent"
        strokeWidth={10}
        fill="none"
      />
    </g>
  );
};

// Anchor Point Component
const AnchorPoint = ({ anchor, onUpdate, isSelected, zoom }) => { // Added zoom
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    const rect = e.currentTarget.closest('svg').getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoom; // Adjusted for zoom
    const mouseY = (e.clientY - rect.top) / zoom;  // Adjusted for zoom
    dragOffset.current = {
      x: mouseX - anchor.x,
      y: mouseY - anchor.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const rect = document.querySelector('.flowchart-canvas svg').getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoom; // Adjusted for zoom
      const mouseY = (e.clientY - rect.top) / zoom;  // Adjusted for zoom
      
      onUpdate({
        ...anchor,
        x: mouseX - dragOffset.current.x,
        y: mouseY - dragOffset.current.y,
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
  }, [isDragging, anchor, onUpdate, zoom]); // Added zoom to dependencies

  return (
    <circle
      cx={anchor.x}
      cy={anchor.y}
      r="4"
      fill={isSelected ? "#3b82f6" : "#059669"}
      stroke="white"
      strokeWidth="2"
      className="cursor-move hover:r-5 transition-all"
      onMouseDown={handleMouseDown}
    />
  );
};

// Context Menu Component
const ContextMenu = ({ contextMenu, onClose, onDelete, onAddAnchor, onAddText, onDuplicate }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  if (!contextMenu) return null;

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate();
    }
    onClose();
  };

  const handleAddAnchor = () => {
    if (onAddAnchor) {
      onAddAnchor();
    }
    onClose();
  };

  const handleAddText = () => {
    if (onAddText) {
      onAddText();
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-50"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
    >
      {contextMenu.type === 'connection' && (
        <>
          <button
            onClick={handleAddAnchor}
            className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Anchor
          </button>
          <button
            onClick={handleAddText}
            className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Add Text
          </button>
        </>
      )}
      {contextMenu.type === 'shape' && (
        <button
          onClick={handleDuplicate}
          className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Duplicate Shape
        </button>
      )}
      <button
        onClick={handleDelete}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete {contextMenu.type === 'shape' ? 'Shape' : 'Connection'}
      </button>
    </div>
  );
};

// Helper function to find intersection with a shape's bounding box, pointing toward center
const getShapeEdgePoint = (fromPoint, targetShape) => {
    const { x, y, width, height } = targetShape;
    const cx = x + width / 2;
    const cy = y + height / 2;

    // Direction vector from fromPoint to the center
    const dx = cx - fromPoint.x;
    const dy = cy - fromPoint.y;

    // If fromPoint is the center, return it
    if (dx === 0 && dy === 0) return { x: cx, y: cy };

    let t = Infinity;

    // Check intersection with left edge (x = targetShape.x)
    if (dx !== 0) {
        const t_edge = (x - fromPoint.x) / dx;
        // Only consider intersections in the positive direction of the vector from fromPoint
        // and if it's not behind fromPoint
        if (t_edge > 0) { 
            const y_intersect = fromPoint.y + t_edge * dy;
            if (y_intersect >= y && y_intersect <= y + height) {
                t = Math.min(t, t_edge);
            }
        }
    }

    // Check intersection with right edge (x = targetShape.x + width)
    if (dx !== 0) {
        const t_edge = (x + width - fromPoint.x) / dx;
        if (t_edge > 0) {
            const y_intersect = fromPoint.y + t_edge * dy;
            if (y_intersect >= y && y_intersect <= y + height) {
                t = Math.min(t, t_edge);
            }
        }
    }

    // Check intersection with top edge (y = targetShape.y)
    if (dy !== 0) {
        const t_edge = (y - fromPoint.y) / dy;
        if (t_edge > 0) {
            const x_intersect = fromPoint.x + t_edge * dx;
            if (x_intersect >= x && x_intersect <= x + width) {
                t = Math.min(t, t_edge);
            }
        }
    }

    // Check intersection with bottom edge (y = targetShape.y + height)
    if (dy !== 0) {
        const t_edge = (y + height - fromPoint.y) / dy;
        if (t_edge > 0) {
            const x_intersect = fromPoint.x + t_edge * dx;
            if (x_intersect >= x && x_intersect <= x + width) {
                t = Math.min(t, t_edge);
            }
        }
    }

    // If a valid intersection was found (and it's before or at the center), calculate the point
    // Using a small epsilon for `t <= 1.0001` to account for floating point inaccuracies
    if (t !== Infinity && t <= 1.0001) { 
        return {
            x: fromPoint.x + t * dx,
            y: fromPoint.y + t * dy
        };
    }
    
    // Fallback: If no valid intersection is found (e.g., fromPoint is inside the targetShape
    // and no edge is intersected 'outwards' by the ray to the center), return the center.
    return { x: cx, y: cy };
};

export default function FlowchartCanvas({ shapes, updateShape, selectedShapeId, setSelectedShapeId, zoom, connections = [], updateConnections, selectedConnectionId, setSelectedConnectionId }) {
  const canvasRef = useRef(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [connectingFromPoint, setConnectingFromPoint] = useState(null);
  const [connectingFromCoords, setConnectingFromCoords] = useState(null);
  const [tempConnection, setTempConnection] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const handleCanvasClick = (e) => {
    // Check if the click target is the canvas itself or the direct SVG container
    // and not a child element (like a shape, arrow, or anchor)
    if (e.target === canvasRef.current || e.target === canvasRef.current.querySelector('svg')) {
      setSelectedShapeId(null);
      setSelectedConnectionId && setSelectedConnectionId(null);
      setContextMenu(null);
      
      if (isConnecting) {
        setIsConnecting(false);
        setConnectingFrom(null);
        setConnectingFromPoint(null);
        setConnectingFromCoords(null);
        setTempConnection(null);
      }
    }
  };

  const handleCanvasRightClick = (e) => {
    e.preventDefault();
    setContextMenu(null);
  };

  const handleStartConnection = (shapeId, position, coords) => {
    setIsConnecting(true);
    setConnectingFrom(shapeId);
    setConnectingFromPoint(position);
    setConnectingFromCoords(coords);
    setSelectedShapeId(null);
    setContextMenu(null);
  };

  const handleShapeClick = (shapeId) => {
    if (isConnecting && connectingFrom !== shapeId) {
      const newConnection = {
        id: Date.now().toString(),
        from: connectingFrom,
        to: shapeId,
        fromPoint: connectingFromPoint,
        anchors: [] // Initialize with no anchors
      };
      
      if (updateConnections) {
        updateConnections([...connections, newConnection]);
      }
      
      setIsConnecting(false);
      setConnectingFrom(null);
      setConnectingFromPoint(null);
      setConnectingFromCoords(null);
      setTempConnection(null);
    } else {
      setSelectedShapeId(shapeId);
      setSelectedConnectionId && setSelectedConnectionId(null);
    }
    setContextMenu(null);
  };

  const handleMouseMove = (e) => {
    if (isConnecting && connectingFromCoords) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoom;
      const mouseY = (e.clientY - rect.top) / zoom;
      
      setTempConnection({
        start: connectingFromCoords,
        end: { x: mouseX, y: mouseY }
      });
    }
  };

  const getUpdatedConnections = useCallback(() => { // Memoized with useCallback
    return connections.map(conn => {
      const fromShape = shapes.find(s => s.id === conn.from);
      const toShape = shapes.find(s => s.id === conn.to);
      
      if (fromShape && toShape) {
        const startPoint = getConnectionPoint(fromShape, conn.fromPoint || 'right');
        
        // Determine the "from" point for edge calculation
        // If there are anchors, use the last anchor; otherwise use the start point
        const lastPoint = conn.anchors && conn.anchors.length > 0 
          ? conn.anchors[conn.anchors.length - 1] 
          : startPoint;
        
        const endPoint = getShapeEdgePoint(lastPoint, toShape);
        
        return { ...conn, start: startPoint, end: endPoint };
      }
      return conn;
    }).filter(c => c.start && c.end);
  }, [connections, shapes]); // Dependencies for useCallback

  const getConnectionPoint = (shape, position) => {
    switch (position) {
      case 'top':
        return { x: shape.x + shape.width / 2, y: shape.y };
      case 'right':
        return { x: shape.x + shape.width, y: shape.y + shape.height / 2 };
      case 'bottom':
        return { x: shape.x + shape.width / 2, y: shape.y + shape.height };
      case 'left':
        return { x: shape.x, y: shape.y + shape.height / 2 };
      default:
        return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
    }
  };

  const handleShapeRightClick = (e, shapeId) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'shape',
      id: shapeId,
      onDelete: () => {
        updateShape(shapeId, null);
      },
      onDuplicate: () => {
        const shapeToClone = shapes.find(s => s.id === shapeId);
        if (shapeToClone) {
          const newShape = {
            ...shapeToClone,
            id: (Date.now() + Math.random()).toString(), // Ensure unique ID
            x: shapeToClone.x + 30, // Offset the duplicate
            y: shapeToClone.y + 30,
          };
          
          // Add the new shape using updateShape
          // Assuming updateShape can handle adding a new shape if the ID is new
          if (updateShape) {
            updateShape(newShape.id, newShape);
          }
        }
      }
    });
    setSelectedShapeId(shapeId);
    setSelectedConnectionId && setSelectedConnectionId(null);
  };

  const handleArrowRightClick = (e, connectionId) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'connection',
      id: connectionId,
      onDelete: () => {
        if (updateConnections) {
          const updatedConnections = connections.filter(c => c.id !== connectionId);
          updateConnections(updatedConnections);
        }
        setSelectedConnectionId && setSelectedConnectionId(null);
      },
      onAddAnchor: () => {
        const connection = connections.find(c => c.id === connectionId);
        if (connection && updateConnections) {
          // Calculate midpoint of the connection for the new anchor
          // Use the mouse position on canvas, not absolute
          const rect = canvasRef.current.getBoundingClientRect();
          const canvasX = (e.clientX - rect.left) / zoom; // Adjusted for zoom
          const canvasY = (e.clientY - rect.top) / zoom;  // Adjusted for zoom
          
          const newAnchor = {
            id: Date.now().toString(),
            x: canvasX,
            y: canvasY,
          };
          
          const updatedConnection = {
            ...connection,
            anchors: [...(connection.anchors || []), newAnchor]
          };
          
          const updatedConnections = connections.map(c => 
            c.id === connectionId ? updatedConnection : c
          );
          updateConnections(updatedConnections);
        }
        setSelectedConnectionId && setSelectedConnectionId(connectionId);
      },
      onAddText: () => {
        const connection = connections.find(c => c.id === connectionId);
        if (connection && updateConnections) {
          const updatedConnection = {
            ...connection,
            text: connection.text || 'Label', // Add default text if not present
            textPosition: connection.textPosition === undefined ? 0.5 : connection.textPosition // Default to midpoint if not set
          };
          
          const updatedConnections = connections.map(c => 
            c.id === connectionId ? updatedConnection : c
          );
          updateConnections(updatedConnections);
        }
        setSelectedConnectionId && setSelectedConnectionId(connectionId);
      }
    });
    setSelectedConnectionId && setSelectedConnectionId(connectionId);
    setSelectedShapeId(null);
  };

  const handleAnchorUpdate = (connectionId, anchorId, newAnchor) => {
    if (updateConnections) {
      const updatedConnections = connections.map(conn => {
        if (conn.id === connectionId) {
          return {
            ...conn,
            anchors: conn.anchors.map(anchor => 
              anchor.id === anchorId ? newAnchor : anchor
            )
          };
        }
        return conn;
      });
      updateConnections(updatedConnections);
    }
  };

  const handleConnectionTextUpdate = (connectionId, updates) => {
    if (updateConnections) {
      const updatedConnections = connections.map(conn => 
        conn.id === connectionId ? { ...conn, ...updates } : conn
      );
      updateConnections(updatedConnections);
    }
  };

  const updatedConnections = getUpdatedConnections();

  return (
    <div 
      className="flex-1 w-full h-full bg-slate-50 overflow-auto relative"
      onClick={handleCanvasClick}
      onContextMenu={handleCanvasRightClick}
      onMouseMove={handleMouseMove}
      style={{ cursor: isConnecting ? 'crosshair' : 'default' }}
    >
      <div 
        ref={canvasRef}
        className="relative w-[3000px] h-[3000px] bg-dotted-slate-300 flowchart-canvas"
        style={{ 
          transform: `scale(${zoom})`, 
          transformOrigin: 'top left',
          backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      >
        <svg 
          className="absolute top-0 left-0 w-full h-full"
          style={{ zIndex: 1, pointerEvents: 'none' }}
        >
          {/* Removed global markers as each Arrow component defines its own unique markers */}
          
          <g style={{ pointerEvents: 'all' }}>
            {updatedConnections.map((connection) => (
              <React.Fragment key={connection.id}>
                <Arrow
                  start={connection.start}
                  end={connection.end}
                  id={connection.id}
                  isSelected={selectedConnectionId === connection.id}
                  onSelect={(id) => {
                    setSelectedConnectionId && setSelectedConnectionId(id);
                    setSelectedShapeId(null);
                    setContextMenu(null);
                  }}
                  onRightClick={(e, id) => handleArrowRightClick(e, id)}
                  anchors={connection.anchors || []}
                  // These props are defined in the outline for Arrow, but Arrow itself doesn't use them.
                  // ArrowText component consumes the connection object directly.
                  // Keeping them here for consistency with the provided outline for Arrow component.
                  text={connection.text} 
                  textPosition={connection.textPosition}
                />
                
                {/* Render anchor points */}
                {(connection.anchors || []).map((anchor) => (
                  <AnchorPoint
                    key={anchor.id}
                    anchor={anchor}
                    isSelected={selectedConnectionId === connection.id}
                    onUpdate={(newAnchor) => handleAnchorUpdate(connection.id, anchor.id, newAnchor)}
                    zoom={zoom} // Passed zoom prop
                  />
                ))}

                {/* Render arrow text */}
                <ArrowText
                  connection={connection}
                  onUpdate={handleConnectionTextUpdate}
                  isSelected={selectedConnectionId === connection.id}
                  zoom={zoom} // Passed zoom prop
                />
              </React.Fragment>
            ))}
          </g>
          
          {tempConnection && (
            <line
              x1={tempConnection.start.x}
              y1={tempConnection.start.y}
              x2={tempConnection.end.x}
              y2={tempConnection.end.y}
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5,5"
              markerEnd="url(#arrowhead-selected)"
            />
          )}
        </svg>

        {shapes.map((shape) => (
          <FlowchartShape
            key={shape.id}
            shape={shape}
            onUpdate={updateShape}
            isSelected={shape.id === selectedShapeId}
            onSelect={handleShapeClick}
            zoom={zoom}
            onStartConnection={handleStartConnection}
            onRightClick={handleShapeRightClick}
            isConnecting={isConnecting}
            connectingFrom={connectingFrom}
          />
        ))}
      </div>

      <ContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu(null)}
        onDelete={contextMenu?.onDelete}
        onAddAnchor={contextMenu?.onAddAnchor}
        onAddText={contextMenu?.onAddText}
        onDuplicate={contextMenu?.onDuplicate}
      />
    </div>
  );
}
