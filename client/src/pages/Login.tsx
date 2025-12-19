import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "wouter";

const highlights = [
  "Controle de acessos com trilhas por time",
  "Convites em segundos com expiracao automatica",
  "Perfil unificado para apps e integrações",
];

export default function Login() {
  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
        gap: { xs: 4, md: 6 },
      }}
    >
      <Box sx={{ pr: { md: 4 } }}>
        <Stack spacing={2.5}>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            Centralize acesso, perfil e convites em um fluxo leve.
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", fontSize: 18 }}>
            O Superclient conecta autenticacao, gestao de acessos e onboarding
            para equipes que nao podem parar.
          </Typography>
          <Box
            sx={{
              mt: 2,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            {highlights.map((item) => (
              <Paper
                key={item}
                elevation={0}
                sx={{
                  p: 2.5,
                  background: "linear-gradient(140deg, #0f1b24 0%, #101720 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {item}
                </Typography>
              </Paper>
            ))}
          </Box>
          <Box
            sx={{
              mt: 3,
              p: 3,
              background:
                "linear-gradient(120deg, rgba(34, 201, 166, 0.16), rgba(245, 158, 11, 0.12))",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              O que sua equipe ganha
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                - Fluxos padronizados de login e criacao de conta.
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                - Perfis prontos para auditoria e compliance.
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                - Convites com controle de tempo e permissao.
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          border: "1px solid rgba(255,255,255,0.1)",
          backgroundColor: "rgba(15, 23, 32, 0.9)",
          backdropFilter: "blur(18px)",
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="h5">Entrar</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Use seu email e senha para continuar.
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <TextField
              label="Email corporativo"
              type="email"
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Senha"
              type="password"
              fullWidth
              variant="outlined"
            />
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <FormControlLabel
                control={<Checkbox size="small" />}
                label="Manter conectado"
              />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Esqueceu a senha?
              </Typography>
            </Stack>
          </Stack>

          <Button variant="contained" size="large" fullWidth>
            Entrar
          </Button>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

          <Button variant="outlined" size="large" fullWidth color="secondary">
            Entrar com SSO
          </Button>

          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Ainda nao tem conta?{" "}
            <Button
              component={RouterLink}
              href="/signup"
              variant="text"
              size="small"
              sx={{ textTransform: "none", fontWeight: 600, px: 0.5 }}
            >
              Criar agora
            </Button>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
