import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Divider,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import api from "../api";
import ToggleCheckbox from "../components/ToggleCheckbox";
import { interactiveCardSx } from "../styles/interactiveCard";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

type RolePermissionKey =
  | "pipeline_view"
  | "pipeline_edit_tasks"
  | "pipeline_edit_columns"
  | "finance_view"
  | "finance_edit";

type RolePermissionMap = Record<RolePermissionKey, boolean>;

type AccessUser = {
  id: number;
  name: string | null;
  email: string;
};

const ROLE_PERMISSION_STORAGE_KEY = "sc_role_permissions";
const USER_ROLE_STORAGE_KEY = "sc_user_roles";

const roles = [
  { name: "Administrador", members: 4, color: "default" },
  { name: "Gestor", members: 12, color: "default" },
  { name: "Analista", members: 18, color: "default" },
  { name: "Leitor", members: 36, color: "default" },
];

const rolePermissionItems: Array<{
  key: RolePermissionKey;
  title: string;
  description: string;
}> = [
  {
    key: "pipeline_view",
    title: "Ver pipeline",
    description: "Permite visualizar colunas e tarefas.",
  },
  {
    key: "pipeline_edit_tasks",
    title: "Criar e editar tarefas",
    description: "Permite criar, editar e mover tarefas.",
  },
  {
    key: "pipeline_edit_columns",
    title: "Editar colunas",
    description: "Permite criar, renomear e reorganizar colunas.",
  },
  {
    key: "finance_view",
    title: "Ver financas",
    description: "Permite visualizar gastos e categorias.",
  },
  {
    key: "finance_edit",
    title: "Criar e editar gastos",
    description: "Permite adicionar, editar e remover gastos.",
  },
];

const modules = [
  { name: "Dashboard executivo", description: "KPIs e indicadores de acesso." },
  { name: "Gestão de usuários", description: "Perfis, roles e permissão." },
  { name: "Convites e onboarding", description: "Fluxos de entrada." },
  { name: "Relatórios", description: "Exportação e auditoria." },
];

const invites = [
  { email: "carlos@empresa.com", role: "Gestor", status: "Pendente" },
  { email: "luana@empresa.com", role: "Analista", status: "Enviado" },
  { email: "time.ops@empresa.com", role: "Leitor", status: "Aceito" },
];

export default function AccessManagement() {
  const [moduleStates, setModuleStates] = useState(() => modules.map(() => true));
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [moduleConfirm, setModuleConfirm] = useState<{
    index: number;
    nextValue: boolean;
  } | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<
    "users" | "modules" | "invites" | "recent" | false
  >("users");
  const [rolePermissions, setRolePermissions] = useState<Record<string, RolePermissionMap>>({});
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [userFilter, setUserFilter] = useState("");
  const toggleModule = (index: number) => {
    setModuleStates((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const defaultRolePermissions = useMemo(() => {
    const defaultMap: Record<string, RolePermissionMap> = {};
    roles.forEach((role) => {
      const permissions = rolePermissionItems.reduce((acc, item) => {
        acc[item.key] = true;
        return acc;
      }, {} as RolePermissionMap);
      defaultMap[role.name] = permissions;
    });
    return defaultMap;
  }, []);

  useEffect(() => {
    const storedRoles = window.localStorage.getItem(ROLE_PERMISSION_STORAGE_KEY);
    if (storedRoles) {
      try {
        const parsed = JSON.parse(storedRoles) as Record<string, RolePermissionMap>;
        if (parsed) {
          setRolePermissions({ ...defaultRolePermissions, ...parsed });
        }
      } catch {
        window.localStorage.removeItem(ROLE_PERMISSION_STORAGE_KEY);
        setRolePermissions(defaultRolePermissions);
      }
    } else {
      setRolePermissions(defaultRolePermissions);
    }

    const storedUserRoles = window.localStorage.getItem(USER_ROLE_STORAGE_KEY);
    if (storedUserRoles) {
      try {
        const parsed = JSON.parse(storedUserRoles) as Record<string, string>;
        if (parsed) {
          setUserRoles(parsed);
        }
      } catch {
        window.localStorage.removeItem(USER_ROLE_STORAGE_KEY);
      }
    }
  }, [defaultRolePermissions]);

  useEffect(() => {
    window.localStorage.setItem(
      ROLE_PERMISSION_STORAGE_KEY,
      JSON.stringify(rolePermissions)
    );
    window.dispatchEvent(new Event("roles-change"));
  }, [rolePermissions]);

  useEffect(() => {
    window.localStorage.setItem(USER_ROLE_STORAGE_KEY, JSON.stringify(userRoles));
    window.dispatchEvent(new Event("roles-change"));
  }, [userRoles]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await api.get("/api/access/users");
        const nextUsers = response?.data?.users;
        if (Array.isArray(nextUsers)) {
          setUsers(nextUsers);
        }
      } catch {
        setUsers([]);
      }
    };
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = userFilter.trim().toLowerCase();
    if (!term) {
      return users;
    }
    return users.filter((user) => {
      const name = user.name?.toLowerCase() || "";
      return name.includes(term) || user.email.toLowerCase().includes(term);
    });
  }, [users, userFilter]);

  const requestModuleToggle = (index: number) => {
    setModuleConfirm({ index, nextValue: !moduleStates[index] });
  };

  const confirmModuleToggle = () => {
    if (!moduleConfirm) {
      return;
    }
    toggleModule(moduleConfirm.index);
    setModuleConfirm(null);
  };

  const openRolePermissions = (roleName: string) => {
    setActiveRole(roleName);
    setPermissionDialogOpen(true);
  };

  const toggleRolePermission = (index: number) => {
    if (!activeRole) {
      return;
    }
    setRolePermissions((prev) => {
      const current = prev[activeRole] || defaultRolePermissions[activeRole];
      if (!current) {
        return prev;
      }
      const key = rolePermissionItems[index]?.key;
      if (!key) {
        return prev;
      }
      return {
        ...prev,
        [activeRole]: {
          ...current,
          [key]: !current[key],
        },
      };
    });
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
        <Typography variant="h4">Gestão de acessos e convites</Typography>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            border: 1,
                      borderColor: "divider",
            backgroundColor: "background.paper",
          }}
        >
          <Stack spacing={2.5}>
            <Typography variant="h6">Papéis do workspace</Typography>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              useFlexGap
              sx={{ flexWrap: "wrap" }}
            >
              {roles.map((role) => (
                <Paper
                  key={role.name}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    border: 1,
                      borderColor: "divider",
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
                      size="medium"
                      sx={{ fontSize: 20, height: 36 }}
                    />
                    <Button
                      variant="text"
                      onClick={() => openRolePermissions(role.name)}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Editar permissoes
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        </Paper>

        <Accordion
          expanded={expandedAccordion === "users"}
          onChange={(_, isExpanded) =>
            setExpandedAccordion(isExpanded ? "users" : false)
          }
        >
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Typography variant="h6">Usuários e papéis</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2.5}>
              <TextField
                label="Buscar usuario"
                fullWidth
                value={userFilter}
                onChange={(event) => setUserFilter(event.target.value)}
                InputProps={{
                  endAdornment: userFilter ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setUserFilter("")}
                        aria-label="Limpar busca"
                      >
                        <CloseRoundedIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
              {filteredUsers.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Nenhum usuario encontrado.
                </Typography>
              ) : (
                <Stack spacing={1.5} sx={{ maxHeight: 360, overflowY: "auto", pr: 1 }}>
                  {filteredUsers.map((user) => (
                    <Paper
                      key={user.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: "divider",
                        backgroundColor: "background.paper",
                      }}
                    >
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                        alignItems={{ xs: "flex-start", md: "center" }}
                        justifyContent="space-between"
                      >
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {user.name || "Usuário"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {user.email}
                          </Typography>
                        </Box>
                        <TextField
                          select
                          label="Papel"
                          value={userRoles[user.email] || "Administrador"}
                          onChange={(event) =>
                            setUserRoles((prev) => ({
                              ...prev,
                              [user.email]: event.target.value,
                            }))
                          }
                          sx={{ minWidth: 200 }}
                        >
                          {roles.map((role) => (
                            <MenuItem key={role.name} value={role.name}>
                              {role.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expandedAccordion === "modules"}
          onChange={(_, isExpanded) =>
            setExpandedAccordion(isExpanded ? "modules" : false)
          }
        >
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Typography variant="h6">Permissões por módulo</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              {modules.map((module, index) => (
                <Paper
                  key={module.name}
                  elevation={0}
                  onClick={() => requestModuleToggle(index)}
                  sx={(theme) => ({
                    p: 2.5,
                    border: 1,
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                    cursor: "pointer",
                    ...interactiveCardSx(theme),
                  })}
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
                        {module.name}
                      </Typography>
                      <ToggleCheckbox
                        checked={moduleStates[index]}
                        onChange={() => requestModuleToggle(index)}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {module.description}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Dialog
          open={permissionDialogOpen}
          onClose={() => {
            setPermissionDialogOpen(false);
            setActiveRole(null);
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: "background.paper",
              border: 1,
                      borderColor: "divider",
            },
          }}
        >
          <DialogContent>
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="h6">Editar permissões</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {activeRole ? `Papel: ${activeRole}` : "Selecione um papel."}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => {
                    setPermissionDialogOpen(false);
                    setActiveRole(null);
                  }}
                  aria-label="Fechar"
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                {rolePermissionItems.map((permission, index) => (
                  <Paper
                    key={permission.key}
                    elevation={0}
                    onClick={() => toggleRolePermission(index)}
                    sx={(theme) => ({
                      p: 2.5,
                      border: 1,
                      borderColor: "divider",
                      backgroundColor: "background.paper",
                      cursor: "pointer",
                      ...interactiveCardSx(theme),
                    })}
                  >
                    <Stack spacing={1}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 2,
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {permission.title}
                        </Typography>
                        <ToggleCheckbox
                          checked={
                            activeRole
                              ? rolePermissions[activeRole]?.[permission.key] ?? true
                              : true
                          }
                          onChange={() => toggleRolePermission(index)}
                          onClick={(event) => event.stopPropagation()}
                          disabled={!activeRole}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {permission.description}
                      </Typography>
                    </Stack>
                  </Paper>
                ))}
              </Box>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => {
                    setPermissionDialogOpen(false);
                    setActiveRole(null);
                  }}
                >
                  Fechar
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
        </Dialog>

        <Accordion
          expanded={expandedAccordion === "invites"}
          onChange={(_, isExpanded) =>
            setExpandedAccordion(isExpanded ? "invites" : false)
          }
        >
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Typography variant="h6">Enviar convite</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2.5}>
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
              <Button variant="outlined" size="large" sx={{ alignSelf: "flex-start" }}>
                Enviar convite
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Dialog open={Boolean(moduleConfirm)} onClose={() => setModuleConfirm(null)} maxWidth="xs" fullWidth>
          <DialogContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6">
                  {moduleConfirm?.nextValue ? "Ativar módulo" : "Desativar módulo"}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {moduleConfirm
                    ? `Você confirma a ${
                        moduleConfirm.nextValue ? "ativação" : "desativação"
                      } do módulo ${modules[moduleConfirm.index].name}?`
                    : ""}
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => setModuleConfirm(null)}>
                  Cancelar
                </Button>
                <Button variant="contained" onClick={confirmModuleToggle}>
                  Confirmar
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
        </Dialog>

        <Accordion
          expanded={expandedAccordion === "recent"}
          onChange={(_, isExpanded) =>
            setExpandedAccordion(isExpanded ? "recent" : false)
          }
        >
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Typography variant="h6">Convites recentes</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
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
                        color={invite.status === "Aceito" ? "secondary" : "default"}
                        size="small"
                      />
                      <Button variant="text" size="small">
                        Reenviar
                      </Button>
                    </Stack>
                  </Box>
                  {index !== invites.length - 1 && <Divider sx={{ my: 2 }} />}
                </Box>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Box>
  );
}
