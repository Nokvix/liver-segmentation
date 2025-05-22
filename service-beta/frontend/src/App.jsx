import {useState, useRef} from "react";
import {Box, Button, Stack, ToggleButtonGroup, ToggleButton} from "@mui/material";
import FileUploader from "./components/FileUploader";
import SliceSelector from "./components/SliceSelector";
import MaskViewer from "./components/MaskViewer";
import SaveButton from "./components/SaveButton";
import EditToggle from "./components/EditToggle";
import {segmentSlice} from "./api";

const VIEW_SIZE = 512;

export default function App() {
    const [file, setFile] = useState(null);
    const [maxSlice, setMaxSlice] = useState(0);
    const [sliceData, setSliceData] = useState(null);
    const [sliceIdx, setSliceIdx] = useState(0);
    const [isEditing, setIsEditing] = useState(false);

    const stageRef = useRef(null);

    const handleFileUpload = async f => {
        if (!f) return;

        if (isEditing) {
            setIsEditing(false);
        }
        setFile(f);

        // Делаю запрос по 0 индексу, чтобы получить число срезов в файле
        const {data: meta} = await segmentSlice(f, 0);
        const depth = meta.depth;
        const max = depth - 1;
        const middle = Math.floor(depth / 2);

        setMaxSlice(max);
        setSliceIdx(middle);

        // Делаю запрос по серединному срезу, чтобы пользователь сразу видел предикт
        const {data: middleSlice} = await segmentSlice(f, middle)
        setSliceData(middleSlice)
    };

    const runSegmentation = async () => {
        if (!file) return;

        if (isEditing) {
            setIsEditing(false);
        }
        try {
            const {data} = await segmentSlice(file, sliceIdx);
            setSliceData(data);

            // число срезов обновляем постоянно
            if (data.depth) { // (!maxSlice && data.depth) {
                setMaxSlice(data.depth - 1);
            }
        } catch (err) {
            console.error(err);
            alert("Ошибка сегментации (см. консоль).");
        }
    };

    // функция сохранения
    const handleSave = () => {
        if (isEditing) {
            setIsEditing(false);
        }
        if (!stageRef.current) return;
        setTimeout(() => {
            // получаем Data URL всего Stage (слои + контуры)
            const uri = stageRef.current.toDataURL({pixelRatio: 1});

            // создаём ссылку и «кликаем» по ней
            const a = document.createElement("a");
            a.href = uri;
            a.download = `slice_${sliceIdx}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }, 0)
    };

    return (
        <Stack spacing={2} sx={{p: 3, color: "#fff", width: "100%"}}>
            <FileUploader
                onLoad={handleFileUpload}
            />

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                    gap: 2,
                }}
            >
                <SliceSelector
                    value={sliceIdx}
                    max={maxSlice}
                    onChange={setSliceIdx}
                />

                <EditToggle
                    checked={isEditing}
                    onChange={setIsEditing}
                />
            </Box>

            <Box
                sx={{
                    position: "relative",   // для вложенных absolute
                    width: "100%",
                    height: VIEW_SIZE,      // чтобы parent имел высоту
                }}
            >
                <Box
                    sx={{
                        width: VIEW_SIZE,
                        height: VIEW_SIZE,
                        margin: "0 auto",      // центрирует контейнер с картинкой
                    }}
                >

                    <MaskViewer
                        slice={sliceData}
                        stageRef={stageRef}
                        editing={isEditing}
                    />
                </Box>

                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",            // по вертикали середина родителя
                        // 50% от ширины родителя + половина VIEW_SIZE + небольшой отступ
                        left: `calc(50% + ${VIEW_SIZE / 2}px + 16px)`,
                        transform: "translateY(-50%)", // компенсируем смещение по top:50%

                    }}
                >
                    <Stack spacing={2}>
                        <Button
                            disabled={!file}
                            variant="contained"
                            onClick={runSegmentation}
                        >
                            Сегментировать
                        </Button>

                        <SaveButton
                            variant="contained"
                            onClick={handleSave}
                            disabled={!sliceData}
                        />
                    </Stack>
                </Box>
            </Box>
        </Stack>
    );
}
