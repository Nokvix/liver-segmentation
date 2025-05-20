import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Circle } from "react-konva";
import useImage from "use-image";

export default function MaskViewer({ slice, stageRef, editing }) {
  // Загружаем фон
  const [bg] = useImage(slice?.image ?? undefined);

  // Локальный стейт для плоских массивов точек каждого контура
  const [contours, setContours] = useState([]);

  // При смене slice преобразуем contours в [[x,y,x,y,…],…]
  useEffect(() => {
    if (!slice?.contours) {
      setContours([]);
      return;
    }
    const normalized = slice.contours.map(c => c.flat(2));
    setContours(normalized);
  }, [slice]);

  // Хэлпер: обновить одну вершину в конкретном контуре
  const moveVertex = (contourIdx, pointIdx) => e => {
    const { x, y } = e.target.position();
    setContours(prev => {
      const copy = prev.map(arr => arr.slice());
      copy[contourIdx][2 * pointIdx] = x;
      copy[contourIdx][2 * pointIdx + 1] = y;
      return copy;
    });
  };

  return (
    <Stage
      ref={stageRef}
      width={256}
      height={256}
      style={{ border: "1px solid #777", cursor: editing ? "default" : "auto" }}
    >
      <Layer>
         {/*1) Фоновой срез */}
        {bg && (
          <KonvaImage
            image={bg}
            width={256}
            height={256}
            listening={false}
          />
        )}

        {/* 2) Сам контур (линия) — всегда не draggable */}
        {contours.map((pts, ci) => (
          <Line
            key={`line-${ci}`}
            points={pts}
            stroke="red"
            strokeWidth={2}
            closed
            listening={false}
          />
        ))}

        {/* 3) Точки-«вершины» — рендерим только в режиме редактирования */}
        {editing &&
          contours.map((pts, ci) => {
            // конвертим [x,y,x,y,…] → [[x,y],[x,y],…]
            const verts = [];
            for (let i = 0; i < pts.length; i += 2) {
              verts.push([pts[i], pts[i + 1]]);
            }
            return verts.map(([x, y], vi) => (
              <Circle
                key={`vertex-${ci}-${vi}`}
                x={x}
                y={y}
                radius={4}
                fill="white"
                stroke="red"
                strokeWidth={1}
                draggable
                onDragMove={moveVertex(ci, vi)}
                // визуальный подсказчик взаимодействия
                onMouseEnter={e => {
                  e.target.getStage().container().style.cursor = "move";
                }}
                onMouseLeave={e => {
                  e.target.getStage().container().style.cursor = "default";
                }}
              />
            ));
          })}
      </Layer>
    </Stage>
  );
}
