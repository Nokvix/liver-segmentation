import React, {useRef, useState, useEffect} from "react";
import {Stage, Layer, Image as KonvaImage, Line, Circle} from "react-konva";
import useImage from "use-image";

export default function MaskViewer({slice, stageRef, editing}) {
    const origSize = 256; // Размер исходного изображения (256×256)
    const viewSize = 512; // Размер области просмотра (512×512)
    const baseScale = viewSize / origSize; // Базовый зум, чтобы сразу заполнить 512×512

    // 1) Подстраиваем фон
    const [bg] = useImage(slice?.image ?? undefined);

    // 2) Контуры в локальном стейте (flat-массивы точек)
    const [contours, setContours] = useState([]);

    // 3) Позиция и масштаб Stage
    const [stageScale, setStageScale] = useState(baseScale);
    const [stagePosition, setStagePosition] = useState({x: 0, y: 0});

    // 4) Инициализируем contours при каждом новом slice
    useEffect(() => {
        if (!slice?.contours) {
            setContours([]);
            return;
        }
        setContours(slice.contours.map(c => c.flat(2)));
        // Сбрасываем зум/пан при переключении тома (по желанию):
        setStageScale(baseScale);
        setStagePosition({x: 0, y: 0});
    }, [slice]);

    // 5) Обновление одной вершины
    const moveVertex = (ci, vi) => e => {
        const {x, y} = e.target.position();
        const origX = x / stageScale;
        const origY = y / stageScale;
        setContours(prev => {
            const next = prev.map(arr => arr.slice());
            next[ci][2 * vi] = x;
            next[ci][2 * vi + 1] = y;
            return next;
        });
    };

    // 6) Обработчик колеса (зум)
    const handleWheel = e => {
        e.evt.preventDefault();

        const stage = e.target.getStage();
        const oldScale = stageScale;
        // коэффициент зума: при прокрутке вверх <1.1, вниз >0.9
        const scaleBy = 1.05;
        const pointer = stage.getPointerPosition();

        // вычисляем новый масштаб
        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

        // ограничиваем масштаб между baseScale и 10*baseScale
        const clamped = Math.max(baseScale, Math.min(10 * baseScale, newScale));

        // чтобы зум был «от» указателя мыши, корректируем позицию сцены
        const mousePointTo = {
            x: (pointer.x - stagePosition.x) / oldScale,
            y: (pointer.y - stagePosition.y) / oldScale,
        };

        const newPos = {
            x: pointer.x - mousePointTo.x * clamped,
            y: pointer.y - mousePointTo.y * clamped,
        };

        setStageScale(clamped);
        setStagePosition(newPos);
    };

    const handleContextMenu = (ci, vi) => e => {
        e.evt.preventDefault();
        setContours(prev => {
            const next = prev.map(arr => arr.slice());
            // удаляем пару координат [x,y] на позициях 2*vi, 2*vi+1
            next[ci].splice(2 * vi, 2);
            return next;
        });
    };

    return (
        <Stage
            ref={stageRef}
            width={viewSize}
            height={viewSize}
            tabIndex={0} // чтобы Stage мог ловить фокус
            onFocus={e => e.target.getStage().container().focus()}
            style={{border: "1px solid #777", cursor: editing ? "default" : "grab"}}
            draggable={editing}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePosition.x}
            y={stagePosition.y}
            onWheel={handleWheel}
            onDragEnd={e => {
                setStagePosition({
                    x: e.target.x(),
                    y: e.target.y(),
                });
            }}
        >
            <Layer>
                {/* фон */}
                {bg && (
                    <KonvaImage
                        image={bg}
                        width={origSize}
                        height={origSize}
                        listening={false}
                    />
                )}

                {/* линии рисуем только когда НЕ в режиме редактирования */}

                {!editing && contours.map((pts, ci) => (
                    <Line
                        key={ci}
                        points={pts}
                        stroke="red"
                        strokeWidth={2}
                        closed
                        listening={false}
                    />
                ))}

                {/* вершины (только в режиме редактирования) */}
                {editing &&
                    contours.map((pts, ci) => {
                        const verts = [];
                        for (let i = 0; i < pts.length; i += 2) {
                            verts.push([pts[i], pts[i + 1]]);
                        }
                        return verts.map(([x, y], vi) => (
                            <Circle
                                key={`${ci}-${vi}`}
                                x={x}
                                y={y}
                                radius={1}
                                fill="red"
                                stroke=""
                                strokeWidth={1}
                                draggable
                                onDragStart={e => {
                                    // предотвращаем начало «панорамирования» сцены
                                    e.cancelBubble = true;
                                }}
                                onDragMove={moveVertex(ci, vi)}
                                onDragEnd={e => {
                                    // тоже не даём сцене обновить своё положение в этот момент
                                    e.cancelBubble = true;
                                }}
                                onContextMenu={handleContextMenu(ci, vi)} // правый клик удаляет точку
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
