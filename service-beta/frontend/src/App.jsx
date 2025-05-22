import React, {useState, useRef} from "react";
import {Box, Button, Stack, Typography, Slider, ToggleButtonGroup, ToggleButton} from "@mui/material";
import FileUploader from "./components/FileUploader";
import SliceSelector from "./components/SliceSelector";
import MaskViewer from "./components/MaskViewer";
import SaveButton from "./components/SaveButton";
import EditToggle from "./components/EditToggle";
import {segmentSlice} from "./api";
import {styled} from "@mui/material/styles";

const CustomSlider = styled(Slider)(({theme}) => ({
    color: "#FF0000",
    height: 6,
    "& .MuiSlider-rail": {backgroundColor: "#1d1d1d", opacity: 1},
    "& .MuiSlider-thumb": {
        height: 16,
        width: 16,
        backgroundColor: "#FF0000",
        "&:hover, &.Mui-focusVisible, &.Mui-active": {
            boxShadow: "none",
        },
    },
    "& .MuiSlider-mark": {
        backgroundColor: "#fff",
        height: 0,
        width: 0,
    },
    "& .MuiSlider-markLabel": {
        color: "#fff",
        top: 24,
    },
    "& .MuiSlider-valueLabel": {
        color: "#fff",
        backgroundColor: "transparent",
        fontSize: "1rem",
        top: 0,
        "& *": {background: "transparent", color: "#fff"},
    },
}));

export const VIEW_SIZE = 450;
export const ORIG_SIZE = 256;
const BASE_SCALE = VIEW_SIZE / ORIG_SIZE;

export default function App() {
    const [file, setFile] = useState(null);
    const [maxSlice, setMaxSlice] = useState(0);
    const [sliceData, setSliceData] = useState(null);
    const [sliceIdx, setSliceIdx] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [zoomPct, setZoomPct] = useState(100);

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

    const sliderMarks = maxSlice > 0
        ? [
            {value: 0, label: "0"},
            {value: maxSlice, label: String(maxSlice)}
        ]
        : [];

    return (
        <Stack spacing={2} sx={{p: 3, color: "#fff", width: "100%"}}>
            <Box
                display="flex"
                justifyContent="center"
                sx={{mb: 0, width: "100%"}}
            >
                <FileUploader
                    onLoad={handleFileUpload}
                    sx={{
                        width: VIEW_SIZE + 100,  // 612px
                        maxWidth: "90%",
                        borderRadius: 12
                    }}
                />
            </Box>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                    gap: 0,
                }}
            >
                <Box sx={{
                    width: VIEW_SIZE,
                    maxWidth: "90%",
                    mx: "auto",
                    textAlign: "center",
                    color: "#fff"
                }}>
                    <Typography
                        variant="h6"
                        gutterBottom={false}
                        sx={{mb: 4}}
                    >
                        Выберите срез
                    </Typography>

                    <CustomSlider
                        value={sliceIdx}
                        min={0}
                        max={maxSlice}
                        onChange={(e, value) => setSliceIdx(value)} // контролируемо меняем
                        valueLabelDisplay="on"
                        marks={sliderMarks}
                    />
                </Box>

                <EditToggle
                    checked={isEditing}
                    onChange={setIsEditing}
                />

                {/* Подсказка для режима редактирования */}
                {isEditing && (
                    <Typography
                        variant="caption"
                        sx={{
                            mt: 1,
                            mx: "auto",
                            color: "rgba(255,255,255,0.8)",
                            textAlign: "center",
                            maxWidth: VIEW_SIZE,      // чтобы не растягивалась
                        }}
                    >
                        Перетаскивайте красные точки левой кнопкой мыши;<br/>
                        Нажатие правой кнопкой мыши по точке - удалить точку;<br/>
                        Используйте колёсико мыши для приближения или отдаления.
                    </Typography>
                )}
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
                        position: "relative",
                        width: VIEW_SIZE,
                        height: VIEW_SIZE,
                        margin: "0 auto",      // центрирует контейнер с картинкой
                    }}
                >

                    <MaskViewer
                        slice={sliceData}
                        stageRef={stageRef}
                        editing={isEditing}
                        onZoomChange={scale => {
                            setZoomPct(Math.round((scale / BASE_SCALE) * 100));
                        }}
                    />

                    {/* Индикатор масштаба */}
                    <Typography
                        variant="body2"
                        sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            background: "rgba(0,0,0,0.5)",
                            color: "#fff",
                            px: 1,
                            borderRadius: 1,
                            fontSize: "0.875rem",
                        }}
                    >
                        Масштаб: {zoomPct}% {/*выводим процент*/}
                    </Typography>
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
                            sx={{
                                backgroundColor: '#fff',
                                color: '#000',
                                borderRadius: '999px',
                                '&:hover': {
                                    backgroundColor: '#aaaaaa',     // чуть другой оттенок при hover
                                },
                            }}
                        >
                            Сегментировать
                        </Button>

                        <SaveButton
                            variant="contained"
                            onClick={handleSave}
                            disabled={!sliceData}
                            sx={{
                                backgroundColor: '#fff',
                                color: '#000',
                                borderRadius: '999px',
                                '&:hover': {
                                    backgroundColor: '#aaaaaa',     // чуть другой оттенок при hover
                                },
                            }}
                        />
                    </Stack>
                </Box>
            </Box>
        </Stack>
    );
}
