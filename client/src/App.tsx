import { useEffect, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  Box,
  Button,
  CssBaseline,
  Breadcrumbs,
  Dialog,
  DialogContent,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Link as RouterLink, Route, Switch, useLocation } from "wouter";
import theme from "./theme";
import api from "./api";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import AccessManagement from "./pages/AccessManagement";
import NotFound from "./pages/NotFound";
import Support from "./pages/Support";

const navItems = [
  { label: "Home", href: "/login" },
  { label: "Gestao", href: "/access" },
  { label: "Perfil", href: "/profile" },
  { label: "Suporte", href: "/support" },
];

function App() {
  const [location, setLocation] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    const syncAuth = async () => {
      try {
        await api.get("/api/auth/me");
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }
    };

    void syncAuth();
    const handleAuthChange = () => void syncAuth();
    window.addEventListener("auth-change", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);
  const isActive = (href: string) => {
    if (href === "/login") {
      return location === "/" || location === "/login" || location === "/signup";
    }
    return location === href;
  };

  const visibleNavItems = isLoggedIn
    ? navItems.filter((item) => item.href !== "/login")
    : navItems.filter((item) => item.href === "/login");

  const breadcrumbMap: Record<string, string> = {
    "/profile": "Perfil",
    "/access": "Gestao",
    "/support": "Suporte",
  };
  const showBreadcrumbs = !["/", "/login", "/signup"].includes(location);
  const currentLabel = breadcrumbMap[location] ?? "Pagina";

  const handleLogout = () => {
    void api.post("/api/auth/logout").finally(() => {
      window.dispatchEvent(new Event("auth-change"));
      setLocation("/login");
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
              <Stack spacing={0.2}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Superclient
                </Typography>
              </Stack>
              <Stack
                direction="row"
                spacing={1}
                sx={{ display: { xs: "none", md: "flex" }, flexWrap: "wrap" }}
              >
                {visibleNavItems.map((item) => (
                  <Button
                    key={item.href}
                    component={RouterLink}
                    href={item.href}
                    variant="text"
                    color="inherit"
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      color: isActive(item.href) ? "primary.main" : "text.secondary",
                      backgroundColor: isActive(item.href)
                        ? "rgba(34, 201, 166, 0.12)"
                        : "transparent",
                      "&:hover": {
                        color: "primary.main",
                        backgroundColor: "rgba(34, 201, 166, 0.08)",
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
                {isLoggedIn ? (
                  <Button
                    variant="text"
                    color="inherit"
                    onClick={() => setLogoutOpen(true)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      color: "text.secondary",
                    }}
                  >
                    Sair
                  </Button>
                ) : null}
              </Stack>
            </Box>
          </Box>

          <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 6 }, py: 6 }}>
            {showBreadcrumbs ? (
              <Breadcrumbs
                aria-label="breadcrumb"
                sx={{ mb: 3, color: "text.secondary" }}
              >
                <Link
                  component={RouterLink}
                  href="/login"
                  underline="hover"
                  color="inherit"
                >
                  Home
                </Link>
                <Typography color="text.primary">{currentLabel}</Typography>
              </Breadcrumbs>
            ) : null}
            <Switch>
              <Route path="/" component={Login} />
              <Route path="/login" component={Login} />
              <Route path="/signup" component={Login} />
              <Route path="/profile" component={Profile} />
              <Route path="/access" component={AccessManagement} />
              <Route path="/support" component={Support} />
              <Route>
                <NotFound />
              </Route>
            </Switch>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h6">Confirmar logout</Typography>
            <IconButton
              type="button"
              onClick={() => setLogoutOpen(false)}
              aria-label="Fechar"
              sx={{ color: "text.secondary" }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            Voce quer sair da sua conta agora?
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button
              color="error"
              variant="contained"
              onClick={() => {
                setLogoutOpen(false);
                handleLogout();
              }}
            >
              Logout
            </Button>
            <Button
              variant="outlined"
              onClick={() => setLogoutOpen(false)}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Manter conectado
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
