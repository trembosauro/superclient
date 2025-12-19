import {
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "wouter";

const plans = [
  {
    title: "Start",
    description: "Para squads pequenos que querem agilidade.",
    detail: "Ate 10 usuarios ativos.",
  },
  {
    title: "Scale",
    description: "Para times em crescimento com governanca.",
    detail: "Ate 100 usuarios ativos.",
  },
];

export default function Signup() {
  return (
    <Box
      sx={{
        maxWidth: 1100,
        mx: "auto",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "0.95fr 1.05fr" },
        gap: { xs: 4, md: 6 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          border: "1px solid rgba(255,255,255,0.1)",
          backgroundColor: "rgba(15, 23, 32, 0.9)",
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="h5">Criacao de conta</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Ative seu workspace e convide o time em minutos.
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <TextField label="Nome completo" fullWidth />
            <TextField label="Email" type="email" fullWidth />
            <TextField label="Senha" type="password" fullWidth />
            <TextField label="Confirmar senha" type="password" fullWidth />
          </Stack>

          <Button variant="contained" size="large" fullWidth>
            Criar conta
          </Button>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

          <Button
            component={RouterLink}
            href="/login"
            variant="outlined"
            size="large"
            fullWidth
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Entrar
          </Button>
        </Stack>
      </Paper>

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Escolha um ritmo de crescimento
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Configure seu ambiente com os recursos de acesso e convites certos
            para o momento do seu time.
          </Typography>
        </Box>

        <Stack spacing={2}>
          {plans.map((plan) => (
            <Paper
              key={plan.title}
              elevation={0}
              sx={{
                p: 3,
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(135deg, rgba(34, 201, 166, 0.14), rgba(15, 23, 32, 0.9))",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {plan.title}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                {plan.description}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {plan.detail}
              </Typography>
            </Paper>
          ))}
        </Stack>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(15, 23, 32, 0.85)",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Pronto para governanca
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Controle perfis, acesso por modulo e convites por papel com fluxos
            auditaveis.
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
