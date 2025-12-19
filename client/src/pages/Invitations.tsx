import {
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const invites = [
  { email: "carlos@empresa.com", role: "Gestor", status: "Pendente" },
  { email: "luana@empresa.com", role: "Analista", status: "Enviado" },
  { email: "time.ops@empresa.com", role: "Leitor", status: "Aceito" },
];

export default function Invitations() {
  return (
    <Box sx={{ maxWidth: 1050, mx: "auto" }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4">Convites</Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Traga novos usuarios com permissoes claras desde o inicio.
          </Typography>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            border: "1px solid rgba(255,255,255,0.1)",
            backgroundColor: "rgba(15, 23, 32, 0.9)",
          }}
        >
          <Stack spacing={2.5}>
            <Typography variant="h6">Enviar convite</Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField label="Email" type="email" fullWidth />
              <TextField label="Papel" select fullWidth defaultValue="Gestor">
                {["Administrador", "Gestor", "Analista", "Leitor"].map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Mensagem personalizada"
                fullWidth
                multiline
                minRows={3}
                sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}
              />
            </Box>
            <Button variant="contained" size="large" sx={{ alignSelf: "flex-start" }}>
              Enviar convite
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            border: "1px solid rgba(255,255,255,0.1)",
            backgroundColor: "rgba(15, 23, 32, 0.9)",
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h6">Convites recentes</Typography>
            {invites.map((invite, index) => (
              <Box key={invite.email}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {invite.email}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Papel: {invite.role}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={invite.status}
                      color={invite.status === "Aceito" ? "primary" : "default"}
                      size="small"
                    />
                    <Button variant="text" size="small">
                      Reenviar
                    </Button>
                  </Stack>
                </Box>
                {index !== invites.length - 1 && (
                  <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 2 }} />
                )}
              </Box>
            ))}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
