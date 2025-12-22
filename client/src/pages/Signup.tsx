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
        variant="outlined"
        sx={{
          p: { xs: 3, md: 4 },
          backgroundColor: "background.paper",
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="h5">Criação de conta</Typography>
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

          <Divider />

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
        </Box>

        <Stack spacing={2}>
          {plans.map((plan) => (
            <Paper
              key={plan.title}
              elevation={0}
              variant="outlined"
              sx={{
                p: 3,
                backgroundColor: "background.paper",
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
          variant="outlined"
          sx={{
            p: 3,
            backgroundColor: "background.paper",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Pronto para governanca
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Controle perfis, acesso por módulo e convites por papel com fluxos
            auditaveis.
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
