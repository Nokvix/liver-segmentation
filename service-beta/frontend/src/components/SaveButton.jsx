import { Button } from "@mui/material";

export default function SaveButton({ disabled, onClick }) {
  return (
    <Button variant="contained" startIcon={<span className="material-icons"></span>} onClick={onClick} disabled={disabled}>
      Сохранить изображение
    </Button>
  );
}