import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useLocation } from "wouter";
import api from "../api";

type StoredAccount = {
  name: string;
  email: string;
  lastUsed: number;
  token?: string;
};

const ACCOUNT_STORAGE_KEY = "sc_accounts";

export default function Profile() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferences, setPreferences] = useState({
    email: true,
    singleSession: false,
    modulePipeline: true,
    moduleFinance: true,
  });
  const [moduleDialog, setModuleDialog] = useState<{
    key: "modulePipeline" | "moduleFinance";
    nextValue: boolean;
  } | null>(null);
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [switchAccounts, setSwitchAccounts] = useState<StoredAccount[]>([]);
  const [switchEmail, setSwitchEmail] = useState("");
  const [switchPassword, setSwitchPassword] = useState("");
  const [switchError, setSwitchError] = useState("");
  const [switchLoading, setSwitchLoading] = useState(false);
  const isLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);

  const loadAccounts = () => {
    const stored = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    try {
      const parsed = JSON.parse(stored) as StoredAccount[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      window.localStorage.removeItem(ACCOUNT_STORAGE_KEY);
      return [];
    }
  };

  const persistAccount = (
    user?: { name?: string | null; email?: string },
    token?: string
  ) => {
    if (!user?.email) {
      return;
    }
    const existingAccounts = loadAccounts();
    const existing = existingAccounts.find((account) => account.email === user.email);
    const nextAccount = {
      name: user.name || "",
      email: user.email,
      lastUsed: Date.now(),
      token: token || existing?.token,
    };
    const deduped = existingAccounts.filter((account) => account.email !== user.email);
    const nextAccounts = [nextAccount, ...deduped].slice(0, 3);
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(nextAccounts));
    setSwitchAccounts(nextAccounts);
  };

  useEffect(() => {
    const stored = window.localStorage.getItem("sc_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { name?: string; email?: string };
        if (parsed?.name) {
          setName(parsed.name);
        }
        if (parsed?.email) {
          setEmail(parsed.email);
        }
      } catch {
        window.localStorage.removeItem("sc_user");
      }
    }
    const syncProfile = async () => {
      try {
        const response = await api.get("/api/profile");
        const user = response?.data?.user;
        const profile = response?.data?.profile;
        const prefs = response?.data?.preferences;
        setName(user?.name || "");
        setEmail(user?.email || "");
        setPhone(profile?.phone || "");
        setPreferences({
          email: Boolean(prefs?.emailNotifications),
          singleSession: Boolean(prefs?.singleSession),
          modulePipeline: Boolean(prefs?.modulePipeline ?? true),
          moduleFinance: Boolean(prefs?.moduleFinance ?? true),
        });
        window.localStorage.setItem(
          "sc_prefs",
          JSON.stringify({
            modulePipeline: Boolean(prefs?.modulePipeline ?? true),
            moduleFinance: Boolean(prefs?.moduleFinance ?? true),
          })
        );
        window.dispatchEvent(new Event("prefs-change"));
        if (user?.email) {
          window.localStorage.setItem(
            "sc_user",
            JSON.stringify({ name: user.name || "", email: user.email })
          );
          persistAccount(user);
        }
      } catch {
        // Keep local values if the session is unavailable.
      } finally {
        isLoadedRef.current = true;
      }
    };
    void syncProfile();
  }, []);

  const handleLogout = () => {
    void api.post("/api/auth/logout").finally(() => {
      window.localStorage.removeItem("sc_user");
      window.localStorage.removeItem("sc_active_session");
      window.dispatchEvent(new Event("auth-change"));
      setLocation("/login");
    });
  };

  const handleSwitchAccount = () => {
    setSwitchAccounts(loadAccounts());
    setSwitchEmail("");
    setSwitchPassword("");
    setSwitchError("");
    setSwitchDialogOpen(true);
  };

  const handleSwitchLogin = async (nextEmail?: string) => {
    setSwitchError("");
    const targetEmail = (nextEmail || switchEmail).trim().toLowerCase();
    if (!targetEmail || !switchPassword) {
      setSwitchError("Informe email e senha.");
      return;
    }
    setSwitchLoading(true);
    try {
      const response = await api.post("/api/auth/login", {
        email: targetEmail,
        password: switchPassword,
      });
      const user = response?.data?.user;
      const token = response?.data?.token;
      if (user?.email) {
        window.localStorage.setItem(
          "sc_user",
          JSON.stringify({ name: user.name || "", email: user.email })
        );
      }
      if (token) {
        window.localStorage.setItem("sc_active_session", token);
      }
      persistAccount(user, token);
      window.dispatchEvent(new Event("auth-change"));
      window.localStorage.setItem(
        "sc_switch_notice",
        `Conta alterada: ${user?.email || targetEmail}`
      );
      window.dispatchEvent(new Event("switch-account"));
      setSwitchDialogOpen(false);
      setSwitchPassword("");
      setSwitchEmail("");
      setLocation("/home");
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { error?: string } } })
        ?.response;
      const code = response?.data?.error;
      if (code === "session_conflict") {
        setSwitchError(
          "Sua conta foi usada em outro lugar. Todas as sessoes foram encerradas. Entre novamente."
        );
      } else {
        setSwitchError("Email ou senha invalidos.");
      }
    } finally {
      setSwitchLoading(false);
    }
  };

  const saveProfile = () => {
    void api
      .put("/api/profile", {
        name,
        email,
        phone,
        preferences: {
          emailNotifications: preferences.email,
          singleSession: preferences.singleSession,
          modulePipeline: preferences.modulePipeline,
          moduleFinance: preferences.moduleFinance,
        },
      })
      .then((response) => {
        const user = response?.data?.user;
        if (user?.email) {
          window.localStorage.setItem(
            "sc_user",
            JSON.stringify({ name: user.name || "", email: user.email })
          );
        }
      })
      .catch(() => {
        // No-op for now.
      });
  };

  useEffect(() => {
    if (!isLoadedRef.current) {
      return;
    }
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      window.localStorage.setItem(
        "sc_prefs",
        JSON.stringify({
          modulePipeline: preferences.modulePipeline,
          moduleFinance: preferences.moduleFinance,
        })
      );
      window.dispatchEvent(new Event("prefs-change"));
      saveProfile();
    }, 600);
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [name, email, phone, preferences]);

  const requestModuleToggle = (
    key: "modulePipeline" | "moduleFinance",
    nextValue: boolean
  ) => {
    setModuleDialog({ key, nextValue });
  };

  const confirmModuleToggle = () => {
    if (!moduleDialog) {
      return;
    }
    setPreferences((prev) => ({ ...prev, [moduleDialog.key]: moduleDialog.nextValue }));
    setModuleDialog(null);
  };

  const moduleLabels = {
    modulePipeline: {
      title: "Pipeline",
      price: "R$ 89/mes",
      description: "Gestao de oportunidades e tasks.",
    },
    moduleFinance: {
      title: "Financas",
      price: "R$ 79/mes",
      description: "Controle de gastos e categorias.",
    },
  };

  return (
    <Box sx={{ maxWidth: 980, mx: "auto" }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4">Perfil</Typography>
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
              <TextField
                label="Nome completo"
                fullWidth
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <TextField
                label="Email"
                fullWidth
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <TextField
                label="Telefone"
                fullWidth
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </Box>
            <Button
              variant="outlined"
              size="large"
              onClick={saveProfile}
              sx={{ alignSelf: "flex-start" }}
            >
              Salvar alteracoes
            </Button>
          </Stack>
        </Paper>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
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
              <Button
                variant="outlined"
                size="large"
                sx={{ alignSelf: "flex-start" }}
              >
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
            <Stack spacing={2}>
              <Typography variant="h6">Conta</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  color="error"
                  variant="contained"
                  size="large"
                  onClick={handleLogout}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Sair
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleSwitchAccount}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Trocar de conta
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>

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
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <Paper
                elevation={0}
                onClick={() =>
                  setPreferences((prev) => ({ ...prev, email: !prev.email }))
                }
                sx={{
                  p: 2.5,
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(15, 23, 32, 0.9)",
                  cursor: "pointer",
                }}
              >
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Notificacoes por email
                    </Typography>
                    <Switch
                      checked={preferences.email}
                      onChange={(event) =>
                        setPreferences((prev) => ({
                          ...prev,
                          email: event.target.checked,
                        }))
                      }
                      onClick={(event) => event.stopPropagation()}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Receba alertas sobre acessos e convites.
                  </Typography>
                </Stack>
              </Paper>
              <Paper
                elevation={0}
                onClick={() =>
                  setPreferences((prev) => ({
                    ...prev,
                    singleSession: !prev.singleSession,
                  }))
                }
                sx={{
                  p: 2.5,
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(15, 23, 32, 0.9)",
                  cursor: "pointer",
                }}
              >
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Sessao unica
                    </Typography>
                    <Switch
                      checked={preferences.singleSession}
                      onChange={(event) =>
                        setPreferences((prev) => ({
                          ...prev,
                          singleSession: event.target.checked,
                        }))
                      }
                      onClick={(event) => event.stopPropagation()}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Desconecte outras sessoes ao entrar novamente.
                  </Typography>
                </Stack>
              </Paper>
            </Box>
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
            <Typography variant="h6">Modulos pagos</Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              {(Object.keys(moduleLabels) as Array<"modulePipeline" | "moduleFinance">).map(
                (key) => (
                  <Paper
                    key={key}
                    elevation={0}
                    onClick={() => requestModuleToggle(key, !preferences[key])}
                    sx={{
                      p: 2.5,
                      border: "1px solid rgba(255,255,255,0.08)",
                      backgroundColor: "rgba(15, 23, 32, 0.9)",
                      cursor: "pointer",
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 2,
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {moduleLabels[key].title}
                        </Typography>
                        <Switch
                          checked={preferences[key]}
                          onClick={(event) => {
                            event.stopPropagation();
                            requestModuleToggle(key, !preferences[key]);
                          }}
                          onChange={() => {}}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {moduleLabels[key].description}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {moduleLabels[key].price}
                      </Typography>
                    </Stack>
                  </Paper>
                )
              )}
            </Box>
          </Stack>
        </Paper>

      </Stack>

      <Dialog open={Boolean(moduleDialog)} onClose={() => setModuleDialog(null)} maxWidth="xs" fullWidth>
        <DialogContent>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6">
                {moduleDialog
                  ? moduleDialog.nextValue
                    ? "Ativar modulo"
                    : "Desativar modulo"
                  : "Modulo"}
              </Typography>
              <IconButton onClick={() => setModuleDialog(null)} sx={{ color: "text.secondary" }}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            {moduleDialog ? (
              <Stack spacing={1.5}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {moduleDialog.nextValue
                    ? `Voce confirma a ativacao do modulo ${moduleLabels[moduleDialog.key].title}?`
                    : `Voce confirma a desativacao do modulo ${moduleLabels[moduleDialog.key].title}?`}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {moduleLabels[moduleDialog.key].price} por modulo.
                </Typography>
              </Stack>
            ) : null}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => setModuleDialog(null)}>
                Cancelar
              </Button>
              <Button variant="contained" onClick={confirmModuleToggle}>
                Confirmar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={switchDialogOpen}
        onClose={() => setSwitchDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent>
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6">Trocar de conta</Typography>
              <IconButton onClick={() => setSwitchDialogOpen(false)} sx={{ color: "text.secondary" }}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            {switchAccounts.length ? (
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                  Contas recentes
                </Typography>
                <Stack spacing={1}>
                  {switchAccounts.map((account) => (
                    <Paper
                      key={account.email}
                      elevation={0}
                      onClick={() => {
                        if (account.email === email) {
                          setSwitchDialogOpen(false);
                          return;
                        }
                        if (account.token) {
                          window.localStorage.setItem("sc_active_session", account.token);
                          window.localStorage.setItem(
                            "sc_user",
                            JSON.stringify({
                              name: account.name || "",
                              email: account.email,
                            })
                          );
                          window.dispatchEvent(new Event("auth-change"));
                          window.localStorage.setItem(
                            "sc_switch_notice",
                            `Conta alterada: ${account.email}`
                          );
                          window.dispatchEvent(new Event("switch-account"));
                          setSwitchDialogOpen(false);
                          setLocation("/home");
                          return;
                        }
                        setSwitchEmail(account.email);
                        setSwitchError("");
                      }}
                      sx={{
                        p: 1.5,
                        border:
                          account.email === email
                            ? "1px solid rgba(34, 201, 166, 0.6)"
                            : "1px solid rgba(255,255,255,0.08)",
                        backgroundColor:
                          account.email === email
                            ? "rgba(34, 201, 166, 0.12)"
                            : "rgba(15, 23, 32, 0.9)",
                        cursor: "pointer",
                      }}
                    >
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {account.name || "Conta"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {account.email}
                        </Typography>
                        {account.email === email ? (
                          <Typography variant="caption" sx={{ color: "primary.main" }}>
                            Conta ativa
                          </Typography>
                        ) : null}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            ) : null}
            <Stack spacing={2}>
              <Typography variant="subtitle2">Entrar em outra conta</Typography>
              <TextField
                label="Email"
                fullWidth
                value={switchEmail}
                onChange={(event) => setSwitchEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleSwitchLogin();
                  }
                }}
              />
              <TextField
                label="Senha"
                type="password"
                fullWidth
                value={switchPassword}
                onChange={(event) => setSwitchPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleSwitchLogin();
                  }
                }}
              />
              {switchError ? (
                <Typography variant="body2" sx={{ color: "error.main" }}>
                  {switchError}
                </Typography>
              ) : null}
            </Stack>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => setSwitchDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="contained"
                onClick={() => void handleSwitchLogin()}
                disabled={switchLoading}
              >
                Entrar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

    </Box>
  );
}
