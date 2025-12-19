import { ThemeProvider } from "@mui/material/styles";
import {
  Box,
  Button,
  CssBaseline,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, Route, Switch } from "wouter";
import theme from "./theme";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import AccessManagement from "./pages/AccessManagement";
import Invitations from "./pages/Invitations";
import NotFound from "./pages/NotFound";

const navItems = [
  { label: "Login", href: "/login" },
  { label: "Criacao de conta", href: "/signup" },
  { label: "Perfil", href: "/profile" },
  { label: "Gestao de acessos", href: "/access" },
  { label: "Convites", href: "/invites" },
];

function App() {
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
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Acesso e operacoes em um so lugar
                </Typography>
              </Stack>
              <Stack
                direction="row"
                spacing={1}
                sx={{ display: { xs: "none", md: "flex" }, flexWrap: "wrap" }}
              >
                {navItems.map((item) => (
                  <Button
                    key={item.href}
                    component={RouterLink}
                    href={item.href}
                    variant="text"
                    color="inherit"
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      color: "text.secondary",
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>
              <Button
                component={RouterLink}
                href="/signup"
                variant="contained"
                color="primary"
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Criar conta
              </Button>
            </Box>
          </Box>

          <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 6 }, py: 6 }}>
            <Switch>
              <Route path="/" component={Login} />
              <Route path="/login" component={Login} />
              <Route path="/signup" component={Signup} />
              <Route path="/profile" component={Profile} />
              <Route path="/access" component={AccessManagement} />
              <Route path="/invites" component={Invitations} />
              <Route>
                <NotFound />
              </Route>
            </Switch>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
