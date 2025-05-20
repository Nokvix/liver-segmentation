import { Stage, Layer, Image as KonvaImage, Line } from "react-konva";
import useImage from "use-image";

export default function MaskViewer({ slice, stageRef }) {
  const [bg] = useImage(slice?.image ?? undefined);

  const renderContours = () =>
    (slice?.contours ?? []).map((contour, idx) => {
      const pts = contour.flat();      // превращаем [[x,y]…] → [x,y,x,y…]
      return (
        <Line
          key={idx}
          points={pts}
          stroke="red"
          strokeWidth={2}
          closed
          listening={false}
        />
      );
    });

  return (
     // привязываем наш ref к Stage
    <Stage ref={stageRef} width={256} height={256} style={{ border: "1px solid #777" }}>
      <Layer>
        {bg && <KonvaImage image={bg} width={256} height={256} listening={false} />}
        {renderContours()}
      </Layer>
    </Stage>
  );
}
