import {
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

export default function Profile() {
  return (
    <Box sx={{ maxWidth: 980, mx: "auto" }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4">Perfil</Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Atualize seus dados e preferencias pessoais.
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
          <Stack spacing={3}>
            <Typography variant="h6">Dados principais</Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField label="Nome completo" fullWidth defaultValue="Ana Lima" />
              <TextField label="Email" fullWidth defaultValue="ana@empresa.com" />
              <TextField label="Telefone" fullWidth defaultValue="+55 11 99999-1234" />
              <TextField label="Time" fullWidth defaultValue="Operacoes" />
              <TextField label="Cargo" fullWidth defaultValue="Gerente de Conta" />
              <TextField label="Fuso horario" fullWidth defaultValue="America/Sao_Paulo" />
            </Box>
            <Button variant="contained" size="large" sx={{ alignSelf: "flex-start" }}>
              Salvar alteracoes
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
          <Stack spacing={3}>
            <Typography variant="h6">Seguranca</Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField label="Senha atual" type="password" fullWidth />
              <TextField label="Nova senha" type="password" fullWidth />
            </Box>
            <Button variant="outlined" size="large" sx={{ alignSelf: "flex-start" }}>
              Atualizar senha
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
          <Stack spacing={2.5}>
            <Typography variant="h6">Preferencias</Typography>
            <Stack spacing={2}>
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
                    Notificacoes por email
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Receba alertas sobre acessos e convites.
                  </Typography>
                </Box>
                <Switch defaultChecked />
              </Box>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
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
                    Sessao unica
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Desconecte outras sessoes ao entrar novamente.
                  </Typography>
                </Box>
                <Switch />
              </Box>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
