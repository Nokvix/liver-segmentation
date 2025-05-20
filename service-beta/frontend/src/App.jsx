import {useState} from "react";
import {Box, Button, Stack, ToggleButtonGroup, ToggleButton} from "@mui/material";
import FileUploader from "./components/FileUploader";
import SliceSelector from "./components/SliceSelector";
import MaskViewer from "./components/MaskViewer";
import {segmentSlice} from "./api";

export default function App() {
    const [file, setFile] = useState(null);
    const [maxSlice, setMaxSlice] = useState(0);
    const [sliceData, setSliceData] = useState(null);
    const [sliceIdx, setSliceIdx] = useState(0);

    const handleFileUpload = async f => {
        if (!f) return;
        setFile(f);

        // Делаю запрос по 0 индексу, чтобы получить число срезов в файле
        const {data: meta} =  await segmentSlice(f, 0);
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

    return (
        <Stack spacing={2} sx={{p: 3, color: "#fff"}}>
            <FileUploader onLoad={handleFileUpload}/>
            <SliceSelector
                value={sliceIdx}
                max={maxSlice}
                onChange={setSliceIdx}
            />
            <Button disabled={!file} variant="contained" onClick={runSegmentation}>
                Сегментировать
            </Button>
            <MaskViewer slice={sliceData}/>

            {/*<Box>*/}
            {/*    <Button*/}
            {/*        variant="contained"*/}
            {/*        onClick={runSegmentation}*/}
            {/*        disabled={!file}*/}
            {/*    >*/}
            {/*        Сегментировать*/}
            {/*    </Button>*/}
            {/*</Box>*/}
        </Stack>
    );
}
