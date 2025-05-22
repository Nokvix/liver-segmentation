import {useCallback} from "react";
import {useDropzone} from "react-dropzone";
import {Box, Typography} from "@mui/material";

export default function FileUploader({onLoad, sx}) {
    const onDrop = useCallback(
        (accepted) => {
            if (accepted && accepted.length) {
                onLoad?.(accepted[0]);        // <- вызываем только если функция
            }
        },
        [onLoad]
    );

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            "application/nii": [".nii", ".nii.gz"],
        },
    });

    return (
        <Box
            {...getRootProps()}
            sx={{
                border: "2px dashed #999",
                p: 2,
                textAlign: "center",
                cursor: "pointer",
                ...sx,
            }}
        >
            <input {...getInputProps()} />
            <Typography>
                {isDragActive ? "Отпустите для загрузки…" : "Перетащите .nii сюда или кликните и выберите нужный файл"}
            </Typography>
        </Box>
    );
}
