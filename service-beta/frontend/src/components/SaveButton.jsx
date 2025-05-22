import {Button} from "@mui/material";

export default function SaveButton({disabled, onClick, sx}) {
    return (
        <Button
            variant="contained"
            startIcon={
                <span className="material-icons">

        </span>
            }
            onClick={onClick}
            disabled={disabled}
            sx={{
                ...sx
            }}
        >
            Сохранить изображение
        </Button>
    );
}