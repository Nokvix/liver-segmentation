import { Slider, Stack, Typography } from "@mui/material";

export default function SliceSelector({ value, max, onChange }) {
  return (
    <Stack spacing={1} sx={{ width: 300 }}>
      <Typography color="#fff">
        {value} / {max}
      </Typography>
      <Slider
        min={0}
        max={max}
        value={value}
        onChange={(_, v) => onChange(v)}
        sx={{ color: "red" }}
      />
    </Stack>
  );
}
