import { Switch, Typography, Stack } from "@mui/material";

export default function EditToggle({ checked, onChange }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography color="white">Просмотр</Typography>
      <Switch checked={checked} onChange={e => onChange(e.target.checked)} />
      <Typography color="white">Редактирование</Typography>
    </Stack>
  );
}