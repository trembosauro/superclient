import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

const faqItems = [
  {
    title: "Como recuperar minha senha?",
    content:
      "Use a opcao de esqueci minha senha na tela de login. Voce recebera um link para redefinir.",
  },
  {
    title: "Posso alterar meu email?",
    content:
      "Sim. No perfil, atualize o email e salve as alteracoes. Se o email ja existir, o sistema avisa.",
  },
  {
    title: "Quanto tempo fico conectado?",
    content:
      "A sessao fica ativa por 1 semana. Depois disso, sera necessario entrar novamente.",
  },
  {
    title: "O que acontece se eu logar em outro dispositivo?",
    content:
      "Por seguranca, as sessoes sao encerradas e voce precisara entrar novamente.",
  },
];

const whatsappUrl =
  "https://wa.me/5500000000000?text=Ola%2C%20preciso%20de%20suporte%20no%20Superclient.";

export default function Support() {
  const [query, setQuery] = useState("");
  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return faqItems;
    }
    return faqItems.filter((item) => {
      const haystack = `${item.title} ${item.content}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [query]);

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Suporte
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Encontre respostas rapidas ou fale com o time de suporte.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(15, 23, 32, 0.8)",
          }}
        >
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Buscar duvida"
              placeholder="Digite palavra-chave"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />

            <Stack spacing={1.5}>
              {filteredItems.length ? (
                filteredItems.map((item) => (
                  <Accordion
                    key={item.title}
                    elevation={0}
                    disableGutters
                    sx={{
                      backgroundColor: "transparent",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      "&:before": { display: "none" },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={
                        <Box component="span" sx={{ fontWeight: 700 }}>
                          +
                        </Box>
                      }
                      sx={{
                        px: 0,
                        "& .MuiAccordionSummary-content": { my: 0.5 },
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {item.title}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0, pt: 0 }}>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {item.content}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Nenhuma duvida encontrada.
                </Typography>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Box>
          <Button
            component="a"
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            variant="contained"
            color="success"
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Tirar duvidas pelo WhatsApp
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
