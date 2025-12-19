import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";

const roles = [
  { name: "Administrador", members: 4, color: "primary" },
  { name: "Gestor", members: 12, color: "secondary" },
  { name: "Analista", members: 18, color: "default" },
  { name: "Leitor", members: 36, color: "default" },
];

const modules = [
  { name: "Dashboard executivo", description: "KPIs e indicadores de acesso." },
  { name: "Gestao de usuarios", description: "Perfis, roles e permissao." },
  { name: "Convites e onboarding", description: "Fluxos de entrada." },
  { name: "Relatorios", description: "Exportacao e auditoria." },
];

export default function AccessManagement() {
  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4">Gestao de acessos</Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Defina papeis, niveis e modulos ativos por time.
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
            <Typography variant="h6">Papeis do workspace</Typography>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{ flexWrap: "wrap" }}
            >
              {roles.map((role) => (
                <Paper
                  key={role.name}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    border: "1px solid rgba(255,255,255,0.08)",
                    minWidth: 200,
                  }}
                >
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {role.name}
                    </Typography>
                    <Chip
                      label={`${role.members} membros`}
                      color={role.color as "primary" | "secondary" | "default"}
                      size="small"
                    />
                    <Button variant="text" sx={{ alignSelf: "flex-start" }}>
                      Editar permissoes
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
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
          <Stack spacing={2.5}>
            <Typography variant="h6">Permissoes por modulo</Typography>
            <Stack spacing={2}>
              {modules.map((module) => (
                <Box key={module.name}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {module.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {module.description}
                      </Typography>
                    </Box>
                    <Switch defaultChecked />
                  </Box>
                  <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 2 }} />
                </Box>
              ))}
            </Stack>
            <Button variant="contained" size="large" sx={{ alignSelf: "flex-start" }}>
              Salvar ajustes
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
