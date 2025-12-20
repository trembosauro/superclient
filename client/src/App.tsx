import { useEffect, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  Avatar,
  Box,
  Button,
  CssBaseline,
  Breadcrumbs,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, Route, Switch, useLocation } from "wouter";
import theme from "./theme";
import api from "./api";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import AccessManagement from "./pages/AccessManagement";
import NotFound from "./pages/NotFound";
import Support from "./pages/Support";
import PipelineData from "./pages/PipelineData";
import Pipeline from "./pages/Pipeline";
import Financas from "./pages/Financas";

const navItems = [
  { label: "Home", href: "/login" },
  { label: "Pipeline", href: "/pipeline" },
  { label: "Financas", href: "/financas" },
  { label: "Gestao", href: "/access" },
];

function App() {
  const [location, setLocation] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string>("");

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
      } catch {
        const stored = window.localStorage.getItem("sc_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as { name?: string };
            setIsLoggedIn(true);
            setUserName(parsed?.name || "");
            return;
          } catch {
            window.localStorage.removeItem("sc_user");
          }
        }
        setIsLoggedIn(false);
        setUserName("");
      }
    };

    void syncAuth();
    const handleAuthChange = () => void syncAuth();
    window.addEventListener("auth-change", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn && ["/", "/login", "/signup"].includes(location)) {
      setLocation("/pipeline");
    }
  }, [isLoggedIn, location, setLocation]);

  const isActive = (href: string) => {
    if (href === "/login") {
      return location === "/" || location === "/login" || location === "/signup";
    }
    if (href === "/pipeline") {
      return location === "/pipeline" || location === "/pipeline/dados";
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
    "/pipeline": "Pipeline",
    "/pipeline/dados": "Dados",
    "/financas": "Financas",
  };
  const showBreadcrumbs = !["/", "/login", "/signup"].includes(location);
  const currentLabel = breadcrumbMap[location] ?? "Pagina";
  const avatarInitial = userName.trim().charAt(0).toUpperCase() || "U";


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
                  <Box key={item.href} sx={{ display: "flex", alignItems: "center" }}>
                    <Button
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
                  </Box>
                ))}
                {isLoggedIn ? (
                  <Button
                    component={RouterLink}
                    href="/profile"
                    variant="text"
                    color="inherit"
                    sx={{
                      minWidth: 0,
                      p: 0,
                      borderRadius: "999px",
                      border: isActive("/profile")
                        ? "1px solid rgba(34, 201, 166, 0.6)"
                        : "1px solid transparent",
                      backgroundColor: isActive("/profile")
                        ? "rgba(34, 201, 166, 0.12)"
                        : "transparent",
                    }}
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
              <Route path="/pipeline/dados" component={PipelineData} />
              <Route path="/pipeline" component={Pipeline} />
              <Route path="/financas" component={Financas} />
              <Route>
                <NotFound />
              </Route>
            </Switch>
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
              <Stack direction="row" spacing={2} alignItems="center">
                <Link
                  component={RouterLink}
                  href="/support"
                  underline="hover"
                  color="text.secondary"
                >
                  Suporte
                </Link>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Box>

    </ThemeProvider>
  );
}

export default App;
