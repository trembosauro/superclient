import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import api from "../api";
import ToggleCheckbox from "../components/ToggleCheckbox";
import { interactiveCardSx } from "../styles/interactiveCard";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AppAccordion from "../components/layout/AppAccordion";
import CardSection from "../components/layout/CardSection";
import SettingsIconButton from "../components/SettingsIconButton";
import { SearchField } from "../ui/SearchField/SearchField";

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

type AccessRole = {
  name: string;
};

const ROLE_PERMISSION_STORAGE_KEY = "sc_role_permissions";
const USER_ROLE_STORAGE_KEY = "sc_user_roles";

const ROLE_STORAGE_KEY = "sc_roles";

const seedRoles: AccessRole[] = [
  { name: "Administrador" },
  { name: "Gestor" },
  { name: "Analista" },
  { name: "Leitor" },
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
  const [roles, setRoles] = useState<AccessRole[]>(() => {
    const stored = window.localStorage.getItem(ROLE_STORAGE_KEY);
    if (!stored) {
      return seedRoles;
    }
    try {
      const parsed = JSON.parse(stored) as Array<{ name?: unknown }>;
      const normalized = Array.isArray(parsed)
        ? parsed
            .map(item => ({ name: String(item?.name || "").trim() }))
            .filter(role => Boolean(role.name))
        : [];
      const unique = Array.from(
        new Map(normalized.map(role => [role.name.toLowerCase(), role])).values()
      );
      return unique.length ? unique : seedRoles;
    } catch {
      window.localStorage.removeItem(ROLE_STORAGE_KEY);
      return seedRoles;
    }
  });
  const [moduleStates, setModuleStates] = useState(() =>
    modules.map(() => true)
  );
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [roleSettingsOpen, setRoleSettingsOpen] = useState(false);
  const [moduleConfirm, setModuleConfirm] = useState<{
    index: number;
    nextValue: boolean;
  } | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<
    "users" | "modules" | "invites" | "recent" | false
  >("users");
  const [rolePermissions, setRolePermissions] = useState<
    Record<string, RolePermissionMap>
  >({});
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [userFilter, setUserFilter] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleError, setNewRoleError] = useState("");
  const [roleNameDrafts, setRoleNameDrafts] = useState<Record<string, string>>(
    {}
  );
  const [roleDeleteConfirm, setRoleDeleteConfirm] = useState<string | null>(
    null
  );
  const toggleModule = (index: number) => {
    setModuleStates(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const defaultRolePermissions = useMemo(() => {
    const defaultMap: Record<string, RolePermissionMap> = {};
    roles.forEach(role => {
      const permissions = rolePermissionItems.reduce((acc, item) => {
        acc[item.key] = true;
        return acc;
      }, {} as RolePermissionMap);
      defaultMap[role.name] = permissions;
    });
    return defaultMap;
  }, []);

  const defaultRoleName = roles[0]?.name || "Administrador";

  const membersByRole = useMemo(() => {
    const counts = new Map<string, number>();
    users.forEach(user => {
      const roleName = userRoles[user.email] || defaultRoleName;
      counts.set(roleName, (counts.get(roleName) || 0) + 1);
    });
    return counts;
  }, [defaultRoleName, userRoles, users]);

  useEffect(() => {
    window.localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(roles));
    const storedRoles = window.localStorage.getItem(
      ROLE_PERMISSION_STORAGE_KEY
    );
    if (storedRoles) {
      try {
        const parsed = JSON.parse(storedRoles) as Record<
          string,
          RolePermissionMap
        >;
        if (parsed) {
          const merged = { ...defaultRolePermissions, ...parsed };
          const allowed = new Set(roles.map(role => role.name));
          const sanitized = Object.fromEntries(
            Object.entries(merged).filter(([roleName]) => allowed.has(roleName))
          ) as Record<string, RolePermissionMap>;
          setRolePermissions(sanitized);
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
    window.localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    window.localStorage.setItem(
      ROLE_PERMISSION_STORAGE_KEY,
      JSON.stringify(rolePermissions)
    );
    window.dispatchEvent(new Event("roles-change"));
  }, [rolePermissions]);

  useEffect(() => {
    window.localStorage.setItem(
      USER_ROLE_STORAGE_KEY,
      JSON.stringify(userRoles)
    );
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
    return users.filter(user => {
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

  const ensureUniqueRoleName = (raw: string, ignoreName?: string) => {
    const candidate = raw.trim();
    if (!candidate) {
      return { ok: false as const, name: "", error: "Informe um nome." };
    }
    const lower = candidate.toLowerCase();
    const ignoreLower = ignoreName?.toLowerCase();
    const exists = roles.some(role => {
      const roleLower = role.name.toLowerCase();
      if (ignoreLower && roleLower === ignoreLower) {
        return false;
      }
      return roleLower === lower;
    });
    if (exists) {
      return {
        ok: false as const,
        name: candidate,
        error: "Já existe um cargo com esse nome.",
      };
    }
    return { ok: true as const, name: candidate };
  };

  const handleCreateRole = () => {
    const next = ensureUniqueRoleName(newRoleName);
    if (!next.ok) {
      setNewRoleError(next.error);
      return;
    }
    setNewRoleError("");
    setRoles(prev => [...prev, { name: next.name }]);
    setRolePermissions(prev => {
      const defaults = rolePermissionItems.reduce((acc, item) => {
        acc[item.key] = true;
        return acc;
      }, {} as RolePermissionMap);
      return { ...prev, [next.name]: prev[next.name] ?? defaults };
    });
    setNewRoleName("");
  };

  const commitRoleRename = (from: string, toRaw: string) => {
    const next = ensureUniqueRoleName(toRaw, from);
    if (!next.ok) {
      setRoleNameDrafts(prev => ({ ...prev, [from]: from }));
      return;
    }
    const to = next.name;
    if (to === from) {
      return;
    }
    setRoles(prev => prev.map(role => (role.name === from ? { name: to } : role)));
    setRolePermissions(prev => {
      const existing = prev[from];
      const { [from]: _removed, ...rest } = prev;
      return existing ? { ...rest, [to]: existing } : rest;
    });
    setUserRoles(prev => {
      const nextMap: Record<string, string> = {};
      Object.entries(prev).forEach(([email, roleName]) => {
        nextMap[email] = roleName === from ? to : roleName;
      });
      return nextMap;
    });
    setRoleNameDrafts(prev => {
      const { [from]: _removed, ...rest } = prev;
      return { ...rest, [to]: to };
    });
    if (activeRole === from) {
      setActiveRole(to);
    }
  };

  const deleteRole = (roleName: string) => {
    if (roles.length <= 1) {
      return;
    }
    const fallback = roles.find(role => role.name !== roleName)?.name || defaultRoleName;
    setRoles(prev => prev.filter(role => role.name !== roleName));
    setRolePermissions(prev => {
      const { [roleName]: _removed, ...rest } = prev;
      return rest;
    });
    setUserRoles(prev => {
      const nextMap: Record<string, string> = {};
      Object.entries(prev).forEach(([email, assigned]) => {
        nextMap[email] = assigned === roleName ? fallback : assigned;
      });
      return nextMap;
    });
    if (activeRole === roleName) {
      setPermissionDialogOpen(false);
      setActiveRole(null);
    }
  };

  const requestRoleDelete = (roleName: string) => {
    if (roles.length <= 1) {
      return;
    }
    setRoleDeleteConfirm(roleName);
  };

  const toggleRolePermission = (index: number) => {
    if (!activeRole) {
      return;
    }
    setRolePermissions(prev => {
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
    <Box sx={{ maxWidth: 1100, mx: "auto", width: "100%" }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
        </Stack>

        <CardSection size="lg">
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Typography variant="h6">Cargos</Typography>
              <SettingsIconButton
                title="Configurar cargos"
                onClick={() => setRoleSettingsOpen(true)}
              />
            </Stack>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              useFlexGap
              sx={{ flexWrap: "wrap" }}
            >
              {roles.map(role => (
                <CardSection
                  key={role.name}
                  size="flush"
                  sx={{ p: 2.5, minWidth: 200 }}
                >
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {role.name}
                    </Typography>
                    <Chip
                      label={`${membersByRole.get(role.name) || 0} membros`}
                      color={"default"}
                      size="medium"
                      sx={{ fontSize: 20, height: 36 }}
                    />
                    <Button
                      variant="text"
                      onClick={() => openRolePermissions(role.name)}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Editar permissões
                    </Button>
                  </Stack>
                </CardSection>
              ))}
            </Stack>
          </Stack>
        </CardSection>

        <Dialog
          open={roleSettingsOpen}
          onClose={() => {
            setRoleSettingsOpen(false);
            setNewRoleError("");
          }}
          disableScrollLock
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
                  <Typography variant="h6">Configurar cargos</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Crie, renomeie ou exclua cargos.
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => {
                    setRoleSettingsOpen(false);
                    setNewRoleError("");
                  }}
                  aria-label="Fechar"
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <TextField
                  label="Novo cargo"
                  value={newRoleName}
                  onChange={event => {
                    setNewRoleName(event.target.value);
                    setNewRoleError("");
                  }}
                  error={Boolean(newRoleError)}
                  helperText={newRoleError || ""}
                  size="small"
                  fullWidth
                />
                <Button
                  variant="outlined"
                  onClick={handleCreateRole}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  Criar
                </Button>
              </Stack>

              <Divider />

              <Stack spacing={1.5}>
                {roles.map(role => (
                  <CardSection key={`role-settings-${role.name}`} size="flush" sx={{ p: 2 }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                      alignItems={{ xs: "stretch", sm: "center" }}
                      justifyContent="space-between"
                    >
                      <TextField
                        label="Cargo"
                        value={roleNameDrafts[role.name] ?? role.name}
                        onChange={event =>
                          setRoleNameDrafts(prev => ({
                            ...prev,
                            [role.name]: event.target.value,
                          }))
                        }
                        onBlur={() =>
                          commitRoleRename(
                            role.name,
                            (roleNameDrafts[role.name] ?? role.name).trim()
                          )
                        }
                        onKeyDown={event => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            commitRoleRename(
                              role.name,
                              (roleNameDrafts[role.name] ?? role.name).trim()
                            );
                          }
                        }}
                        size="small"
                        fullWidth
                      />
                      <Button
                        variant="text"
                        color="error"
                        onClick={() => requestRoleDelete(role.name)}
                        disabled={roles.length <= 1}
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        Excluir
                      </Button>
                    </Stack>
                  </CardSection>
                ))}
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="flex-end"
              >
                <Button
                  variant="outlined"
                  onClick={() => {
                    setRoleSettingsOpen(false);
                    setNewRoleError("");
                  }}
                >
                  Fechar
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(roleDeleteConfirm)}
          onClose={() => setRoleDeleteConfirm(null)}
          disableScrollLock
          maxWidth="xs"
          fullWidth
        >
          <DialogContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6">Excluir cargo</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {roleDeleteConfirm
                    ? `Você confirma a exclusão do cargo ${roleDeleteConfirm}? Usuários nesse cargo serão movidos para ${
                        roles.find(role => role.name !== roleDeleteConfirm)?.name ||
                        defaultRoleName
                      }.`
                    : ""}
                </Typography>
              </Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="flex-end"
              >
                <Button variant="outlined" onClick={() => setRoleDeleteConfirm(null)}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    if (!roleDeleteConfirm) {
                      return;
                    }
                    const name = roleDeleteConfirm;
                    setRoleDeleteConfirm(null);
                    deleteRole(name);
                  }}
                >
                  Excluir
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
        </Dialog>

        <AppAccordion
          expanded={expandedAccordion === "users"}
          onChange={(_, isExpanded) =>
            setExpandedAccordion(isExpanded ? "users" : false)
          }
          title="Usuários e cargos"
        >
          <Stack spacing={2.5}>
            <SearchField
              placeholder="Buscar usuário"
              fullWidth
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              onClear={() => setUserFilter("")}
              ariaLabel="Buscar usuário"
            />
            {filteredUsers.length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Nenhum usuário encontrado.
              </Typography>
            ) : (
              <Stack
                spacing={1.5}
                sx={{ maxHeight: 360, overflowY: "auto", pr: 1 }}
              >
                {filteredUsers.map(user => (
                  <CardSection
                    key={user.id}
                    size="flush"
                    sx={{ p: 2 }}
                  >
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={2}
                      alignItems={{ xs: "flex-start", md: "center" }}
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          {user.name || "Usuário"}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          {user.email}
                        </Typography>
                      </Box>
                      <TextField
                        select
                        label="Cargo"
                        value={
                          roles.some(role => role.name === (userRoles[user.email] || defaultRoleName))
                            ? (userRoles[user.email] || defaultRoleName)
                            : defaultRoleName
                        }
                        onChange={event =>
                          setUserRoles(prev => ({
                            ...prev,
                            [user.email]: event.target.value,
                          }))
                        }
                        sx={{ minWidth: 200 }}
                      >
                        {roles.map(role => (
                          <MenuItem key={role.name} value={role.name}>
                            {role.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Stack>
                  </CardSection>
                ))}
              </Stack>
            )}
          </Stack>
        </AppAccordion>

        <AppAccordion
          expanded={expandedAccordion === "modules"}
          onChange={(_, isExpanded) =>
            setExpandedAccordion(isExpanded ? "modules" : false)
          }
          title="Permissões por módulo"
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            {modules.map((module, index) => (
              <CardSection
                key={module.name}
                onClick={() => requestModuleToggle(index)}
                size="flush"
                sx={theme => ({
                  p: 2.5,
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
                      onClick={event => event.stopPropagation()}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    {module.description}
                  </Typography>
                </Stack>
              </CardSection>
            ))}
          </Box>
        </AppAccordion>

        <Dialog
          open={permissionDialogOpen}
          onClose={() => {
            setPermissionDialogOpen(false);
            setActiveRole(null);
          }}
          disableScrollLock
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
          <DialogContent sx={{ scrollbarGutter: "stable" }}>
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
                    {activeRole
                      ? `Cargo: ${activeRole}`
                      : "Selecione um cargo."}
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
                  <CardSection
                    key={permission.key}
                    onClick={() => toggleRolePermission(index)}
                    size="flush"
                    sx={theme => ({
                      p: 2.5,
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
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          {permission.title}
                        </Typography>
                        <ToggleCheckbox
                          checked={
                            activeRole
                              ? (rolePermissions[activeRole]?.[
                                  permission.key
                                ] ?? true)
                              : true
                          }
                          onChange={() => toggleRolePermission(index)}
                          onClick={event => event.stopPropagation()}
                          disabled={!activeRole}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {permission.description}
                      </Typography>
                    </Stack>
                  </CardSection>
                ))}
              </Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="flex-end"
              >
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

        <AppAccordion
          expanded={expandedAccordion === "invites"}
          onChange={(_, isExpanded) =>
            setExpandedAccordion(isExpanded ? "invites" : false)
          }
          title="Enviar convite"
        >
          <Stack spacing={2.5}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField label="Email" type="email" fullWidth />
              <TextField
                label="Cargo"
                select
                fullWidth
                defaultValue={roles.some(role => role.name === "Gestor") ? "Gestor" : defaultRoleName}
              >
                {roles.map(role => (
                  <MenuItem key={role.name} value={role.name}>
                    {role.name}
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
            <Button
              variant="outlined"
              size="large"
              sx={{ alignSelf: "flex-start" }}
            >
              Enviar convite
            </Button>
          </Stack>
        </AppAccordion>

        <Dialog
          open={Boolean(moduleConfirm)}
          onClose={() => setModuleConfirm(null)}
          disableScrollLock
          maxWidth="xs"
          fullWidth
        >
          <DialogContent sx={{ scrollbarGutter: "stable" }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6">
                  {moduleConfirm?.nextValue
                    ? "Ativar módulo"
                    : "Desativar módulo"}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {moduleConfirm
                    ? `Você confirma a ${
                        moduleConfirm.nextValue ? "ativação" : "desativação"
                      } do módulo ${modules[moduleConfirm.index].name}?`
                    : ""}
                </Typography>
              </Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="flex-end"
              >
                <Button
                  variant="outlined"
                  onClick={() => setModuleConfirm(null)}
                >
                  Cancelar
                </Button>
                <Button variant="contained" onClick={confirmModuleToggle}>
                  Confirmar
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
        </Dialog>

        <AppAccordion
          expanded={expandedAccordion === "recent"}
          onChange={(_, isExpanded) =>
            setExpandedAccordion(isExpanded ? "recent" : false)
          }
          title="Convites recentes"
        >
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
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      Cargo: {invite.role}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={invite.status}
                      color={
                        invite.status === "Aceito" ? "secondary" : "default"
                      }
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
        </AppAccordion>
      </Stack>
    </Box>
  );
}
