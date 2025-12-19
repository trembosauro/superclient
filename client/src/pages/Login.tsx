import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import api from "../api";

const highlights = [
  "Controle de acessos com trilhas por time",
  "Convites em segundos com expiracao automatica",
  "Perfil unificado para apps e integrações",
];

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

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");

  const handleLogin = async () => {
    setLoginError("");
    if (!loginEmail || !loginPassword) {
      setLoginError("Informe email e senha.");
      return;
    }
    try {
      await api.post("/api/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });
      window.dispatchEvent(new Event("auth-change"));
    } catch {
      setLoginError("Email ou senha invalidos.");
    }
  };

  const handleSignup = async () => {
    setSignupError("");
    if (!signupName || !signupEmail || !signupPassword || !signupConfirm) {
      setSignupError("Preencha todos os campos.");
      return;
    }
    if (signupPassword !== signupConfirm) {
      setSignupError("As senhas nao conferem.");
      return;
    }
    try {
      await api.post("/api/auth/signup", {
        name: signupName,
        email: signupEmail,
        password: signupPassword,
      });
      window.dispatchEvent(new Event("auth-change"));
    } catch (error) {
      if ((error as { response?: { status?: number } })?.response?.status === 409) {
        setSignupError("Email ja cadastrado.");
        return;
      }
      setSignupError("Nao foi possivel criar a conta.");
    }
  };

  const handleOauth = (provider: string) => {
    setLoginError(`${provider} ainda nao configurado.`);
  };

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
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              Planos para cada ritmo
            </Typography>
            <Stack spacing={2}>
              {plans.map((plan) => (
                <Paper
                  key={plan.title}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background:
                      "linear-gradient(135deg, rgba(34, 201, 166, 0.14), rgba(15, 23, 32, 0.9))",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
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
          <Tabs
            value={mode}
            onChange={(_, value) => {
              setMode(value);
              setLoginError("");
              setSignupError("");
            }}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Entrar" value="login" />
            <Tab label="Criar conta" value="signup" />
          </Tabs>

          {mode === "login" ? (
            <>
              <Stack spacing={1}>
                <Typography variant="h5">Entrar</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Use seu email e senha para continuar.
                </Typography>
              </Stack>

              <Stack spacing={2}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  variant="outlined"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                />
                <TextField
                  label="Senha"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
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

              <Button variant="contained" size="large" fullWidth onClick={handleLogin}>
                Entrar
              </Button>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

              <Button
                variant="outlined"
                size="large"
                fullWidth
                color="secondary"
                onClick={() => handleOauth("SSO")}
              >
                Entrar com SSO
              </Button>

              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={() => handleOauth("Google")}
              >
                Entrar com Google
              </Button>

              {loginError ? (
                <Typography variant="caption" color="error">
                  {loginError}
                </Typography>
              ) : null}

              <Button
                variant="text"
                size="large"
                onClick={() => setMode("signup")}
                fullWidth
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Criar conta
              </Button>
            </>
          ) : (
            <>
              <Stack spacing={1}>
                <Typography variant="h5">Criacao de conta</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Ative seu workspace e convide o time em minutos.
                </Typography>
              </Stack>

              <Stack spacing={2}>
                <TextField
                  label="Nome completo"
                  fullWidth
                  value={signupName}
                  onChange={(event) => setSignupName(event.target.value)}
                />
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={signupEmail}
                  onChange={(event) => setSignupEmail(event.target.value)}
                />
                <TextField
                  label="Senha"
                  type="password"
                  fullWidth
                  value={signupPassword}
                  onChange={(event) => setSignupPassword(event.target.value)}
                />
                <TextField
                  label="Confirmar senha"
                  type="password"
                  fullWidth
                  value={signupConfirm}
                  onChange={(event) => setSignupConfirm(event.target.value)}
                />
              </Stack>

              <Button variant="contained" size="large" fullWidth onClick={handleSignup}>
                Criar conta
              </Button>

              {signupError ? (
                <Typography variant="caption" color="error">
                  {signupError}
                </Typography>
              ) : null}

              <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={() => setMode("login")}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Entrar
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
