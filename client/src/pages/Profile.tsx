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

export default function Profile() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [team, setTeam] = useState("");
  const [role, setRole] = useState("");
  const [timezone, setTimezone] = useState("");
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
  const isLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);

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
        setTeam(profile?.team || "");
        setRole(profile?.role || "");
        setTimezone(profile?.timezone || "");
        setPreferences({
          email: Boolean(prefs?.emailNotifications),
          singleSession: Boolean(prefs?.singleSession),
          modulePipeline: Boolean(prefs?.modulePipeline ?? true),
          moduleFinance: Boolean(prefs?.moduleFinance ?? true),
        });
        if (user?.email) {
          window.localStorage.setItem(
            "sc_user",
            JSON.stringify({ name: user.name || "", email: user.email })
          );
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
      window.dispatchEvent(new Event("auth-change"));
      setLocation("/login");
    });
  };

  const handleSwitchAccount = () => {
    void api.post("/api/auth/logout").finally(() => {
      window.localStorage.removeItem("sc_user");
      window.dispatchEvent(new Event("auth-change"));
      setLocation("/login");
    });
  };

  const saveProfile = () => {
    void api
      .put("/api/profile", {
        name,
        email,
        phone,
        team,
        role,
        timezone,
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
      saveProfile();
    }, 600);
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [name, email, phone, team, role, timezone, preferences]);

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
              <TextField
                label="Time"
                fullWidth
                value={team}
                onChange={(event) => setTeam(event.target.value)}
              />
              <TextField
                label="Cargo"
                fullWidth
                value={role}
                onChange={(event) => setRole(event.target.value)}
              />
              <TextField
                label="Fuso horario"
                fullWidth
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
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
                  background:
                    "linear-gradient(135deg, rgba(15, 23, 32, 0.9), rgba(34, 201, 166, 0.08))",
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
                  background:
                    "linear-gradient(135deg, rgba(15, 23, 32, 0.9), rgba(34, 201, 166, 0.08))",
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
                      background:
                        "linear-gradient(135deg, rgba(15, 23, 32, 0.9), rgba(34, 201, 166, 0.08))",
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
    </Box>
  );
}
