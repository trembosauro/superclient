import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  Avatar,
  Box,
  Button,
  CssBaseline,
  Breadcrumbs,
  IconButton,
  Link,
  Menu,
  MenuItem,
  Stack,
  Typography,
  Badge,
  Snackbar,
  Alert,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import { Link as RouterLink, Route, Switch, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import theme from "./theme";
import { APP_RADIUS } from "./designTokens";
import api from "./api";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import AccessManagement from "./pages/AccessManagement";
import NotFound from "./pages/NotFound";
import Support from "./pages/Support";
import PipelineData from "./pages/PipelineData";
import Pipeline from "./pages/Pipeline";
import Financas from "./pages/Financas";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Notifications from "./pages/Notifications";
import Calendar from "./pages/Calendar";
import CalendarCompleted from "./pages/CalendarCompleted";
import Notes from "./pages/Notes";
import { PageActionsProvider, usePageActionsContext } from "./contexts/PageActionsContext";

// Keys para tradução - os labels serão traduzidos no render
const navItems = [
  { labelKey: "nav.home", href: "/home" },
  { labelKey: "nav.calendar", href: "/calendario" },
  { labelKey: "nav.notes", href: "/notas" },
  { labelKey: "nav.finances", href: "/financas" },
  { labelKey: "nav.contacts", href: "/contatos" },
  { labelKey: "nav.pipeline", href: "/pipeline" },
];

function App() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [mobileAnchorEl, setMobileAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [moduleAccess, setModuleAccess] = useState({
    pipeline: true,
    finance: true,
    contacts: true,
    calendar: true,
    notes: true,
  });
  const [language, setLanguage] = useState("pt-BR");
  const [hasNotifications, setHasNotifications] = useState(false);
  const [switchNotice, setSwitchNotice] = useState("");
  const [switchSnackbarOpen, setSwitchSnackbarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const syncAuth = async () => {
      try {
        const response = await api.get("/api/auth/me");
        const name = response?.data?.user?.name;
        setIsLoggedIn(true);
        setUserName(typeof name === "string" ? name : "");
        if (response?.data?.user?.email) {
          window.localStorage.setItem(
            "sc_user",
            JSON.stringify({
              name: response.data.user.name || "",
              email: response.data.user.email,
            })
          );
        }
        try {
          const prefsResponse = await api.get("/api/profile");
          const prefs = prefsResponse?.data?.preferences;
          if (prefs) {
            const nextPrefs = {
              modulePipeline: Boolean(prefs.modulePipeline ?? true),
              moduleFinance: Boolean(prefs.moduleFinance ?? true),
              moduleContacts: Boolean(prefs.moduleContacts ?? true),
              moduleCalendar: Boolean(prefs.moduleCalendar ?? true),
              moduleNotes: Boolean(prefs.moduleNotes ?? true),
              language:
                typeof prefs.language === "string" ? prefs.language : "pt-BR",
            };
            window.localStorage.setItem("sc_prefs", JSON.stringify(nextPrefs));
            setModuleAccess({
              pipeline: nextPrefs.modulePipeline,
              finance: nextPrefs.moduleFinance,
              contacts: nextPrefs.moduleContacts,
              calendar: nextPrefs.moduleCalendar,
              notes: nextPrefs.moduleNotes,
            });
            setLanguage(nextPrefs.language);
            document.documentElement.lang = nextPrefs.language;
          }
        } catch {
          // Keep stored preferences if profile fetch fails.
        }
      } catch {
        const stored = window.localStorage.getItem("sc_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as { name?: string };
            setIsLoggedIn(false);
            setUserName(parsed?.name || "");
          } catch {
            window.localStorage.removeItem("sc_user");
          }
        }
        setIsLoggedIn(false);
        setUserName("");
        setModuleAccess({
          pipeline: true,
          finance: true,
          contacts: true,
          calendar: true,
          notes: true,
        });
      }
    };

    void syncAuth();
    const handleAuthChange = () => void syncAuth();
    window.addEventListener("auth-change", handleAuthChange);
    const handlePrefsChange = () => {
      const storedPrefs = window.localStorage.getItem("sc_prefs");
      if (!storedPrefs) {
        return;
      }
      try {
        const parsed = JSON.parse(storedPrefs) as {
          modulePipeline?: boolean;
          moduleFinance?: boolean;
          moduleContacts?: boolean;
          moduleCalendar?: boolean;
          moduleNotes?: boolean;
          language?: string;
        };
        setModuleAccess({
          pipeline: Boolean(parsed.modulePipeline ?? true),
          finance: Boolean(parsed.moduleFinance ?? true),
          contacts: Boolean(parsed.moduleContacts ?? true),
          calendar: Boolean(parsed.moduleCalendar ?? true),
          notes: Boolean(parsed.moduleNotes ?? true),
        });
        const nextLanguage =
          typeof parsed.language === "string" ? parsed.language : "pt-BR";
        setLanguage(nextLanguage);
        document.documentElement.lang = nextLanguage;
      } catch {
        window.localStorage.removeItem("sc_prefs");
      }
    };
    window.addEventListener("prefs-change", handlePrefsChange);
    handlePrefsChange();
    const handleContactsChange = () => computeNotifications();
    window.addEventListener("contacts-change", handleContactsChange);
    computeNotifications();

    const handleSwitchAccount = () => {
      const notice = window.localStorage.getItem("sc_switch_notice");
      if (notice) {
        setSwitchNotice(notice);
        setSwitchSnackbarOpen(true);
        window.localStorage.removeItem("sc_switch_notice");
      }
    };
    window.addEventListener("switch-account", handleSwitchAccount);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
      window.removeEventListener("prefs-change", handlePrefsChange);
      window.removeEventListener("contacts-change", handleContactsChange);
      window.removeEventListener("switch-account", handleSwitchAccount);
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn && ["/", "/login", "/signup"].includes(location)) {
      setLocation("/home");
    }
  }, [isLoggedIn, location, setLocation]);

  useEffect(() => {
    if (isLoggedIn) {
      return;
    }
    if (!["/", "/login", "/signup", "/support"].includes(location)) {
      setLocation("/login");
    }
  }, [isLoggedIn, location, setLocation]);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }
    if (
      !moduleAccess.pipeline &&
      (location === "/pipeline" || location === "/pipeline/dados")
    ) {
      setLocation("/profile");
      return;
    }
    if (!moduleAccess.finance && location === "/financas") {
      setLocation("/profile");
    }
    if (!moduleAccess.contacts && location === "/contatos") {
      setLocation("/profile");
    }
    if (
      !moduleAccess.calendar &&
      (location === "/calendario" || location === "/calendario/concluidas")
    ) {
      setLocation("/profile");
    }
    if (!moduleAccess.notes && location.startsWith("/notas")) {
      setLocation("/profile");
    }
  }, [isLoggedIn, location, moduleAccess, setLocation]);

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    if (href === "/login") {
      return location === "/login" || location === "/signup";
    }
    if (href === "/home") {
      return location === "/home";
    }
    if (href === "/pipeline") {
      return location === "/pipeline" || location === "/pipeline/dados";
    }
    if (href === "/notas") {
      return location.startsWith("/notas");
    }
    return location === href;
  };

  const visibleNavItems = isLoggedIn
    ? navItems.filter(item => {
        if (item.href === "/pipeline") {
          return moduleAccess.pipeline;
        }
        if (item.href === "/financas") {
          return moduleAccess.finance;
        }
        if (item.href === "/contatos") {
          return moduleAccess.contacts;
        }
        if (item.href === "/calendario") {
          return moduleAccess.calendar;
        }
        if (item.href === "/notas") {
          return moduleAccess.notes;
        }
        return true;
      })
    : [
        { labelKey: "nav.home", href: "/" },
      ];

  const breadcrumbMap: Record<string, string> = {
    "/home": t("nav.home"),
    "/profile": t("profile.title"),
    "/access": t("nav.access"),
    "/support": t("nav.support"),
    "/pipeline": t("nav.pipeline"),
    "/pipeline/dados": t("common.details"),
    "/financas": t("nav.finances"),
    "/contatos": t("nav.contacts"),
    "/calendario": t("nav.calendar"),
    "/calendario/concluidas": t("calendar.completedTasks"),
    "/notas": t("nav.notes"),
    "/notas/arquivo": t("notes.archive"),
    "/notifications": t("nav.notifications"),
  };

  const normalizeBreadcrumbLabel = (value: string) =>
    value.replace(/\s+/g, " ").trim();

  const showBreadcrumbs =
    isLoggedIn && !["/", "/login", "/signup"].includes(location);
  const currentLabel = normalizeBreadcrumbLabel(
    breadcrumbMap[location] ?? t("common.title")
  );
  const notesBreadcrumb = (() => {
    if (!location.startsWith("/notas/")) {
      return null;
    }
    const isArchive = location.startsWith("/notas/arquivo");
    const noteId = isArchive ? location.split("/")[3] : location.split("/")[2];
    if (!noteId) {
      return null;
    }
    try {
      const stored =
        window.localStorage.getItem("notes_v2") ||
        window.localStorage.getItem("notes_v1");
      if (!stored) {
        return null;
      }
      const parsed = JSON.parse(stored) as Array<{
        id: string;
        title?: string;
        parentId?: string;
      }>;
      const current = parsed.find(note => note.id === noteId);
      if (!current) {
        return null;
      }
      const parent = current.parentId
        ? parsed.find(note => note.id === current.parentId)
        : null;
      const crumbs = [
        <Link
          key="notas"
          component={RouterLink}
          href="/notas"
          underline="hover"
          color="inherit"
        >
          Notas
        </Link>,
      ];
      if (isArchive) {
        crumbs.push(
          <Link
            key="notas-arquivo"
            component={RouterLink}
            href="/notas/arquivo"
            underline="hover"
            color="inherit"
          >
            Arquivo
          </Link>
        );
      }
      if (parent) {
        crumbs.push(
          <Link
            key="nota-parent"
            component={RouterLink}
            href={`/notas/${parent.id}`}
            underline="hover"
            color="inherit"
          >
            {normalizeBreadcrumbLabel(parent.title || "Nota")}
          </Link>
        );
      }
      crumbs.push(
        <Typography key="nota-current" color="text.primary">
          {normalizeBreadcrumbLabel(current.title || "Nota")}
        </Typography>
      );
      return crumbs;
    } catch {
      return null;
    }
  })();

  const breadcrumbItems =
    location === "/home"
      ? [
          <Typography key="home" color="text.primary">
            Home
          </Typography>,
        ]
      : location === "/access"
        ? [
            <Link
              key="profile"
              component={RouterLink}
              href="/profile"
              underline="hover"
              color="inherit"
            >
              {t("profile.title")}
            </Link>,
            <Typography key="access" color="text.primary">
              {t("nav.access")}
            </Typography>,
          ]
      : location === "/pipeline/dados"
        ? [
            <Link
              key="pipeline"
              component={RouterLink}
              href="/pipeline"
              underline="hover"
              color="inherit"
            >
              Pipeline
            </Link>,
            <Typography key="dados" color="text.primary">
              Dados
            </Typography>,
          ]
        : location === "/calendario/concluidas"
          ? [
              <Link
                key="calendario"
                component={RouterLink}
                href="/calendario"
                underline="hover"
                color="inherit"
              >
                Calendário
              </Link>,
              <Typography key="concluidas" color="text.primary">
                Tarefas feitas
              </Typography>,
            ]
          : location === "/notas/arquivo"
            ? [
                <Link
                  key="notas"
                  component={RouterLink}
                  href="/notas"
                  underline="hover"
                  color="inherit"
                >
                  Notas
                </Link>,
                <Typography key="arquivo" color="text.primary">
                  Arquivo
                </Typography>,
              ]
            : notesBreadcrumb
              ? notesBreadcrumb
              : [
                  <Link
                    key="home"
                    component={RouterLink}
                    href="/home"
                    underline="hover"
                    color="inherit"
                  >
                    Home
                  </Link>,
                  <Typography key="current" color="text.primary">
                    {currentLabel}
                  </Typography>,
                ];
  const avatarInitial = userName.trim().charAt(0).toUpperCase() || "U";
  const mobileMenuOpen = Boolean(mobileAnchorEl);

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    (event.currentTarget as HTMLElement).blur();
    setMobileAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileAnchorEl(null);
  };

  const computeNotifications = () => {
    const stored = window.localStorage.getItem("contacts_v1");
    if (!stored) {
      setHasNotifications(false);
      return;
    }
    try {
      const contacts = JSON.parse(stored) as Array<{ birthday?: string }>;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = contacts.filter(contact => {
        if (!contact.birthday) {
          return false;
        }
        const parts = contact.birthday.split("-").map(Number);
        if (parts.length < 3) {
          return false;
        }
        const [, month, day] = parts;
        if (!month || !day) {
          return false;
        }
        const target = new Date(today.getFullYear(), month - 1, day);
        if (target < today) {
          target.setFullYear(today.getFullYear() + 1);
        }
        const diffDays =
          (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      });
      const seenAtRaw = window.localStorage.getItem("notifications_seen_at");
      const seenAt = seenAtRaw ? new Date(seenAtRaw) : null;
      const hasNew = upcoming.length > 0 && (!seenAt || seenAt < today);
      setHasNotifications(hasNew);
    } catch {
      window.localStorage.removeItem("contacts_v1");
      setHasNotifications(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PageActionsProvider>
        <Box
          sx={{
            minHeight: "100vh",
            position: "relative",
            overflow: "hidden",
            background:
              "radial-gradient(circle at top, #13202c 0%, #0b0f14 45%, #07090d 100%)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              opacity: 0.7,
              background:
                "radial-gradient(circle at 20% 20%, rgba(45, 212, 191, 0.18) 0%, transparent 45%), radial-gradient(circle at 80% 10%, rgba(244, 114, 182, 0.12) 0%, transparent 42%)",
              pointerEvents: "none",
            }}
          />
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
            }}
          >
          <Box
            component="header"
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(16px)",
              backgroundColor: "rgba(7, 9, 13, 0.75)",
            }}
          >
            <Box
              sx={{
                px: { xs: 2, md: 6 },
                py: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Button
                component={RouterLink}
                href={isLoggedIn ? "/home" : "/"}
                variant="text"
                color="inherit"
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  px: 0,
                  minWidth: "auto",
                  color: "text.primary",
                  "&:hover": {
                    backgroundColor: "transparent",
                    color: "primary.main",
                  },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <AutoGraphRoundedIcon fontSize="small" />
                  <Box component="span">Superclient</Box>
                </Stack>
              </Button>
              <Box
                sx={{
                  flex: 1,
                  display: { xs: "none", md: "flex" },
                  justifyContent: "center",
                }}
              >
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  {visibleNavItems.map(item => (
                    <Box
                      key={item.href}
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <Button
                        component={RouterLink}
                        href={item.href}
                        variant="text"
                        color="inherit"
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          color: isActive(item.href)
                            ? "primary.main"
                            : "text.secondary",
                          backgroundColor: isActive(item.href)
                            ? "rgba(34, 201, 166, 0.12)"
                            : "transparent",
                          "&:hover": {
                            color: "primary.main",
                            backgroundColor: "rgba(34, 201, 166, 0.08)",
                          },
                        }}
                      >
                        {t(item.labelKey)}
                      </Button>
                    </Box>
                  ))}
                </Stack>
              </Box>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ display: { xs: "none", md: "flex" } }}
              >
                {isLoggedIn ? (
                  <IconButton
                    component={RouterLink}
                    href="/notifications"
                    sx={{
                      color: "rgba(34, 201, 166, 0.7)",
                      border: isActive("/notifications")
                        ? "1px solid rgba(34, 201, 166, 0.6)"
                        : "1px solid transparent",
                      backgroundColor: isActive("/notifications")
                        ? "rgba(34, 201, 166, 0.12)"
                        : "transparent",
                      p: 0.5,
                      "&:hover": {
                        backgroundColor: "rgba(34, 201, 166, 0.12)",
                      },
                      "&:active": {
                        backgroundColor: "rgba(34, 201, 166, 0.28)",
                        color: "rgba(34, 201, 166, 0.9)",
                      },
                    }}
                  >
                    <Badge
                      variant="dot"
                      color="error"
                      invisible={!hasNotifications}
                    >
                      <NotificationsNoneRoundedIcon />
                    </Badge>
                  </IconButton>
                ) : null}
                {isLoggedIn ? (
                  <Button
                    component={RouterLink}
                    href="/profile"
                    variant="text"
                    color="inherit"
                    sx={theme => ({
                      minWidth: 0,
                      p: 0,
                      borderRadius: APP_RADIUS,
                      border: isActive("/profile")
                        ? "1px solid rgba(34, 201, 166, 0.6)"
                        : "1px solid transparent",
                      backgroundColor: isActive("/profile")
                        ? "rgba(34, 201, 166, 0.12)"
                        : "transparent",
                    })}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: 14,
                        bgcolor: "rgba(34, 201, 166, 0.18)",
                        color: "text.primary",
                      }}
                    >
                      {avatarInitial}
                    </Avatar>
                  </Button>
                ) : null}
              </Stack>
              <Box sx={{ display: { xs: "flex", md: "none" } }}>
                {isLoggedIn ? (
                  <IconButton
                    component={RouterLink}
                    href="/notifications"
                    sx={{
                      color: "rgba(34, 201, 166, 0.7)",
                      mr: 1,
                      border: isActive("/notifications")
                        ? "1px solid rgba(34, 201, 166, 0.6)"
                        : "1px solid transparent",
                      backgroundColor: isActive("/notifications")
                        ? "rgba(34, 201, 166, 0.12)"
                        : "transparent",
                      p: 0.5,
                      "&:hover": {
                        backgroundColor: "rgba(34, 201, 166, 0.12)",
                      },
                      "&:active": {
                        backgroundColor: "rgba(34, 201, 166, 0.28)",
                        color: "rgba(34, 201, 166, 0.9)",
                      },
                    }}
                  >
                    <Badge
                      variant="dot"
                      color="error"
                      invisible={!hasNotifications}
                    >
                      <NotificationsNoneRoundedIcon />
                    </Badge>
                  </IconButton>
                ) : null}
                <IconButton
                  aria-label="Abrir menu"
                  onClick={handleMobileMenuOpen}
                  sx={{
                    color: "text.primary",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backgroundColor: "rgba(7, 9, 13, 0.45)",
                    "&:hover": {
                      backgroundColor: "rgba(7, 9, 13, 0.6)",
                    },
                  }}
                >
                  <MenuIcon fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={mobileAnchorEl}
                  open={mobileMenuOpen}
                  onClose={handleMobileMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 200,
                      border: "1px solid rgba(255,255,255,0.12)",
                      backgroundColor: "rgba(12, 18, 26, 0.98)",
                    },
                  }}
                >
                  {visibleNavItems.map(item => (
                    <MenuItem
                      key={item.href}
                      onClick={() => {
                        setLocation(item.href);
                        handleMobileMenuClose();
                      }}
                      sx={{
                        fontWeight: 600,
                        ...(isActive(item.href)
                          ? { backgroundColor: "action.selected" }
                          : null),
                      }}
                    >
                      {t(item.labelKey)}
                    </MenuItem>
                  ))}
                  {isLoggedIn ? (
                    <MenuItem
                      onClick={() => {
                        setLocation("/profile");
                        handleMobileMenuClose();
                      }}
                      sx={{
                        fontWeight: 600,
                        ...(isActive("/profile")
                          ? { backgroundColor: "action.selected" }
                          : null),
                      }}
                    >
                      {t("profile.title")}
                    </MenuItem>
                  ) : null}
                </Menu>
              </Box>
            </Box>
          </Box>

          <Box
            component="main"
            sx={{
              flex: 1,
              px: { xs: 2, md: 3 },
              pt: { xs: 3, sm: 4, md: 6 },
              pb: { xs: 4, md: 6 },
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            {showBreadcrumbs ? (
              <AppBreadcrumbRow breadcrumbItems={breadcrumbItems} />
            ) : null}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Switch>
                <Route path="/" component={Login} />
                <Route path="/login" component={Login} />
                <Route path="/signup" component={Login} />
                <Route path="/home" component={Dashboard} />
                <Route path="/profile" component={Profile} />
                <Route path="/access" component={AccessManagement} />
                <Route path="/support" component={Support} />
                <Route path="/pipeline/dados" component={PipelineData} />
                <Route path="/pipeline" component={Pipeline} />
                <Route path="/financas" component={Financas} />
                <Route path="/contatos" component={Contacts} />
                <Route
                  path="/calendario/concluidas"
                  component={CalendarCompleted}
                />
                <Route path="/calendario" component={Calendar} />
                <Route path="/notas/arquivo/:noteId" component={Notes} />
                <Route path="/notas/arquivo" component={Notes} />
                <Route path="/notas/:noteId" component={Notes} />
                <Route path="/notas" component={Notes} />
                <Route path="/notifications" component={Notifications} />
                <Route>
                  <NotFound />
                </Route>
              </Switch>
            </Box>
          </Box>

          <Box
            component="footer"
            sx={{
              px: { xs: 2, md: 6 },
              py: 4,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "rgba(7, 9, 13, 0.75)",
              backdropFilter: "blur(16px)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Superclient © {new Date().getFullYear()}
              </Typography>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                {visibleNavItems.map(item => (
                  <Link
                    key={item.href}
                    component={RouterLink}
                    href={item.href}
                    underline="hover"
                    color="text.secondary"
                  >
                    {t(item.labelKey)}
                  </Link>
                ))}
                <Link
                  component={RouterLink}
                  href="/support"
                  underline="hover"
                  color="text.secondary"
                >
                  {t("nav.support")}
                </Link>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={switchSnackbarOpen}
        autoHideDuration={2500}
        onClose={() => setSwitchSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          onClose={() => setSwitchSnackbarOpen(false)}
          sx={{ width: "100%" }}
        >
          {switchNotice}
        </Alert>
      </Snackbar>
    </PageActionsProvider>
    </ThemeProvider>
  );
}

function AppBreadcrumbRow({ breadcrumbItems }: { breadcrumbItems: ReactNode }) {
  const { actions } = usePageActionsContext();

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
        width: "100%",
        display: { xs: "block", md: "flex" },
        alignItems: { md: "center" },
        justifyContent: { md: "space-between" },
        gap: { md: 2 },
        mb: 1,
      }}
    >
      <Breadcrumbs
        aria-label="breadcrumb"
        separator="›"
        sx={{
          color: "text.secondary",
          display: "flex",
          width: { xs: "100%", md: "auto" },
          flex: { md: "1 1 auto" },
          minWidth: 0,
          justifyContent: "flex-start",
          alignItems: "center",
          flexWrap: "nowrap",
          whiteSpace: "nowrap",
          "& .MuiBreadcrumbs-ol": {
            flexWrap: "nowrap",
            alignItems: "center",
            minWidth: 0,
          },
          "& .MuiBreadcrumbs-li": {
            display: "inline-flex",
            minWidth: 0,
          },
          "& .MuiBreadcrumbs-separator": {
            mx: 1,
            color: "text.secondary",
          },
        }}
      >
        {breadcrumbItems}
      </Breadcrumbs>

      {actions ? (
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "nowrap",
            minWidth: 0,
            flex: "0 0 auto",
          }}
        >
          {actions}
        </Box>
      ) : null}
    </Box>
  );
}

export default App;
