import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Dialog,
  DialogContent,
  FormControlLabel,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useLocation } from "wouter";
import api from "../api";

const highlights = [
  "Calendário com agenda diária e lembretes",
  "Pipeline com tarefas por etapa e visao em tempo real",
  "Finanças com categorias, filtros e indicadores",
  "Suporte com FAQ e contato rapido",
];

const plans = [
  {
    title: "Start",
    description: "Para times pequenos que querem velocidade.",
    detail: "Ate 10 usuarios ativos.",
  },
  {
    title: "Scale",
    description: "Para operacoes em crescimento.",
    detail: "Ate 100 usuarios ativos.",
  },
  {
    title: "Enterprise",
    description: "Para empresas com fluxo complexo.",
    detail: "Suporte dedicado e governanca avancada.",
  },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<"request" | "reset">("request");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryConfirm, setRecoveryConfirm] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryNotice, setRecoveryNotice] = useState("");

  const persistUser = (
    user?: { name?: string | null; email?: string },
    token?: string
  ) => {
    if (!user?.email) {
      return;
    }
    window.localStorage.setItem(
      "sc_user",
      JSON.stringify({ name: user.name || "", email: user.email })
    );
    if (token) {
      window.localStorage.setItem("sc_active_session", token);
    }
    const stored = window.localStorage.getItem("sc_accounts");
    const nextAccount = {
      name: user.name || "",
      email: user.email,
      lastUsed: Date.now(),
      token: token || "",
    };
    try {
      const parsed = stored ? (JSON.parse(stored) as typeof nextAccount[]) : [];
      const deduped = parsed.filter((account) => account.email !== user.email);
      const nextAccounts = [nextAccount, ...deduped].slice(0, 3);
      window.localStorage.setItem("sc_accounts", JSON.stringify(nextAccounts));
    } catch {
      window.localStorage.setItem("sc_accounts", JSON.stringify([nextAccount]));
    }
  };

  const getErrorDetails = (
    error: unknown
  ): { status?: number; code?: string } => {
    const response = (error as { response?: { status?: number; data?: { error?: string } } })
      ?.response;
    return { status: response?.status, code: response?.data?.error };
  };

  const handleLogin = async () => {
    setLoginError("");
    if (!loginEmail || !loginPassword) {
      setLoginError("Informe email e senha.");
      return;
    }
    try {
      const response = await api.post("/api/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });
      persistUser(response?.data?.user, response?.data?.token);
      window.dispatchEvent(new Event("auth-change"));
      setLocation("/profile");
    } catch (error) {
      const { code } = getErrorDetails(error);
      if (code === "session_conflict") {
        setLoginError(
          "Sua conta foi usada em outro lugar. Todas as sessoes foram encerradas. Entre novamente ou redefina a senha."
        );
        return;
      }
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
      const response = await api.post("/api/auth/signup", {
        name: signupName,
        email: signupEmail,
        password: signupPassword,
      });
      persistUser(response?.data?.user, response?.data?.token);
      window.dispatchEvent(new Event("auth-change"));
      setLocation("/profile");
    } catch (error) {
      const { status } = getErrorDetails(error);
      if (status === 409) {
        try {
          const response = await api.post("/api/auth/login", {
            email: signupEmail,
            password: signupPassword,
          });
          persistUser(response?.data?.user, response?.data?.token);
          window.dispatchEvent(new Event("auth-change"));
          setLocation("/profile");
          return;
        } catch (loginError) {
          const { code } = getErrorDetails(loginError);
          if (code === "session_conflict") {
            setSignupError(
              "Sua conta foi usada em outro lugar. Todas as sessoes foram encerradas. Entre novamente ou redefina a senha."
            );
            return;
          }
          setSignupError("Email ja cadastrado.");
          return;
        }
      }
      setSignupError("Nao foi possivel criar a conta.");
    }
  };

  const handleRecoveryOpen = () => {
    setRecoveryOpen(true);
    setRecoveryStep("request");
    setRecoveryEmail(loginEmail);
    setRecoveryToken("");
    setRecoveryPassword("");
    setRecoveryConfirm("");
    setRecoveryError("");
    setRecoveryNotice("");
  };

  const handleRecoveryClose = () => {
    setRecoveryOpen(false);
    setRecoveryError("");
    setRecoveryNotice("");
  };

  const handleRecoveryRequest = async () => {
    setRecoveryError("");
    setRecoveryNotice("");
    if (!recoveryEmail) {
      setRecoveryError("Informe o email da conta.");
      return;
    }
    try {
      const response = await api.post("/api/auth/forgot-password", {
        email: recoveryEmail,
      });
      const token = response?.data?.resetToken;
      if (token) {
        setRecoveryToken(token);
        setRecoveryNotice("Use o codigo enviado para definir uma nova senha.");
        setRecoveryStep("reset");
      } else {
        setRecoveryNotice("Se o email existir, voce recebera um codigo.");
      }
    } catch {
      setRecoveryError("Não foi possível iniciar a recuperação.");
    }
  };

  const handleRecoveryReset = async () => {
    setRecoveryError("");
    setRecoveryNotice("");
    if (!recoveryToken || !recoveryPassword || !recoveryConfirm) {
      setRecoveryError("Preencha codigo e nova senha.");
      return;
    }
    if (recoveryPassword !== recoveryConfirm) {
      setRecoveryError("As senhas nao conferem.");
      return;
    }
    try {
      await api.post("/api/auth/reset-password", {
        token: recoveryToken,
        password: recoveryPassword,
      });
      setRecoveryNotice("Senha atualizada. Você já pode entrar.");
      setRecoveryStep("request");
      setRecoveryOpen(false);
    } catch {
      setRecoveryError("Codigo invalido ou expirado.");
    }
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
            Centralize agenda, tarefas, finanças e suporte em um unico lugar.
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", fontSize: 18 }}>
            O Superclient conecta calendario, pipeline e gestao com visao clara do que
            acontece no dia a dia e o que vem a seguir.
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
                variant="outlined"
                sx={{
                  p: 2.5,
                  backgroundColor: "background.paper",
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
              backgroundColor: "background.paper",
              border: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Por que times escolhem o Superclient
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                - Agenda integrada com lembretes e repeticoes.
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                - Controle total do trabalho com colunas, filtros e categorias.
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                - Permissões por papel e módulos sob demanda.
              </Typography>
            </Stack>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              Comece agora e evolua quando precisar
            </Typography>
            <Stack spacing={2}>
              {plans.map((plan) => (
                <Paper
                  key={plan.title}
                  elevation={0}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    backgroundColor: "background.paper",
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
        variant="outlined"
        sx={{
          p: { xs: 3, md: 4 },
          backgroundColor: "background.paper",
        }}
      >
        <Stack
          spacing={3}
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            if (mode === "login") {
              void handleLogin();
              return;
            }
            void handleSignup();
          }}
        >
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
                    control={
                      <Checkbox
                        size="small"
                        checked={rememberMe}
                        onChange={(event) => setRememberMe(event.target.checked)}
                      />
                    }
                    label="Manter conectado"
                  />
                  <Button
                    type="button"
                    variant="text"
                    size="small"
                    onClick={handleRecoveryOpen}
                    sx={{ textTransform: "none", fontWeight: 600, color: "text.secondary" }}
                  >
                    Recuperar senha
                  </Button>
                </Stack>
              </Stack>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                onClick={handleLogin}
              >
                Entrar
              </Button>

              {loginError ? (
                <Typography variant="caption" color="error">
                  {loginError}
                </Typography>
              ) : null}

              <Button
                type="button"
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
                <Typography variant="h5">Criação de conta</Typography>
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

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                onClick={handleSignup}
              >
                Criar conta
              </Button>

              {signupError ? (
                <Typography variant="caption" color="error">
                  {signupError}
                </Typography>
              ) : null}

              <Divider />

              <Button
                type="button"
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

      <Dialog open={recoveryOpen} onClose={handleRecoveryClose} maxWidth="xs" fullWidth>
        <DialogContent>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6">Recuperar senha</Typography>
              <Button
                variant="text"
                onClick={handleRecoveryClose}
                sx={{ minWidth: 0, px: 1, color: "text.secondary" }}
              >
                x
              </Button>
            </Box>
            {recoveryStep === "request" ? (
              <>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Informe seu email para receber o código de recuperação.
                </Typography>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={recoveryEmail}
                  onChange={(event) => setRecoveryEmail(event.target.value)}
                />
                {recoveryError ? (
                  <Typography variant="caption" color="error">
                    {recoveryError}
                  </Typography>
                ) : null}
                {recoveryNotice ? (
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {recoveryNotice}
                  </Typography>
                ) : null}
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button variant="outlined" onClick={handleRecoveryClose}>
                    Cancelar
                  </Button>
                  <Button variant="contained" onClick={handleRecoveryRequest}>
                    Enviar codigo
                  </Button>
                </Stack>
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Informe o codigo recebido e escolha uma nova senha.
                </Typography>
                <TextField
                  label="Codigo"
                  fullWidth
                  value={recoveryToken}
                  onChange={(event) => setRecoveryToken(event.target.value)}
                />
                <TextField
                  label="Nova senha"
                  type="password"
                  fullWidth
                  value={recoveryPassword}
                  onChange={(event) => setRecoveryPassword(event.target.value)}
                />
                <TextField
                  label="Confirmar senha"
                  type="password"
                  fullWidth
                  value={recoveryConfirm}
                  onChange={(event) => setRecoveryConfirm(event.target.value)}
                />
                {recoveryError ? (
                  <Typography variant="caption" color="error">
                    {recoveryError}
                  </Typography>
                ) : null}
                {recoveryNotice ? (
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {recoveryNotice}
                  </Typography>
                ) : null}
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button variant="outlined" onClick={handleRecoveryClose}>
                    Cancelar
                  </Button>
                  <Button variant="contained" onClick={handleRecoveryReset}>
                    Atualizar senha
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

