import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useMemo, useState } from "react";

const faqItems = [
  {
    title: "Login e recuperacao de senha",
    content:
      "Tela de login permite entrar com email e senha. Em recuperar senha, voce solicita o link por email e define uma nova senha.",
  },
  {
    title: "Criacao de conta",
    content:
      "Crie seu workspace com nome, email e senha. Depois de criar, voce entra automaticamente.",
  },
  {
    title: "Home (dashboard)",
    content:
      "Mostra uma visao geral do pipeline, financas e gestao com indicadores principais e atalhos.",
  },
  {
    title: "Pipeline",
    content:
      "Organize tarefas em colunas, arraste cards entre etapas e visualize detalhes. Clique em adicionar tarefa para abrir o modal de edicao.",
  },
  {
    title: "Dados da pipeline",
    content:
      "Painel com metricas de tarefas por etapa e graficos. As metricas de valor aparecem apenas quando o campo de valor esta ativo.",
  },
  {
    title: "Financas",
    content:
      "Registre gastos, filtre por categorias e visualize graficos. Ao clicar em um gasto, voce abre a visualizacao e pode editar.",
  },
  {
    title: "Categorias (pipeline, financas e contatos)",
    content:
      "Cada area tem suas proprias categorias. Voce pode criar, editar cor/nome e remover categorias sem misturar os contextos.",
  },
  {
    title: "Contatos",
    content:
      "Cadastre pessoas com multiplos telefones, emails, enderecos e comentarios. Copie dados com um clique e organize por categorias.",
  },
  {
    title: "Notificacoes",
    content:
      "Mostra alertas como aniversarios proximos e permite marcar como visto. O sino indica quando ha novidades.",
  },
  {
    title: "Gestao de acessos",
    content:
      "Controle papeis, permissoes e modulos pagos. Edite permissoes por papel e ative/desative modulos.",
  },
  {
    title: "Perfil",
    content:
      "Atualize dados pessoais, altere preferencias e faca logout. Em trocar de conta, selecione contas recentes ou faca login em outra.",
  },
  {
    title: "Sessao e seguranca",
    content:
      "A sessao dura 1 semana. Se logar em outro dispositivo, as sessoes anteriores podem ser encerradas por seguranca.",
  },
];

const supportCategories = [
  { value: "duvidas", label: "Duvidas" },
  { value: "sugestoes", label: "Sugestoes" },
  { value: "problemas_financeiros", label: "Problemas financeiros" },
  { value: "suporte_tecnico", label: "Suporte tecnico" },
  { value: "cobranca", label: "Cobranca" },
  { value: "outros", label: "Outros" },
];

export default function Support() {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | false>(false);
  const [contactExpanded, setContactExpanded] = useState(false);
  const [supportEmail, setSupportEmail] = useState("");
  const [supportCategory, setSupportCategory] = useState("duvidas");
  const [supportMessage, setSupportMessage] = useState("");
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
        </Box>

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Buscar duvida"
              placeholder="Digite palavra-chave"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              InputProps={{
                endAdornment: query ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setQuery("")}
                      aria-label="Limpar busca"
                    >
                      <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />

            <Stack spacing={1.5}>
              {filteredItems.length ? (
                filteredItems.map((item) => (
                  <Accordion
                    key={item.title}
                    expanded={expanded === item.title}
                    onChange={(_, isExpanded) =>
                      setExpanded(isExpanded ? item.title : false)
                    }
                  >
                    <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {item.title}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {item.content}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Nenhum artigo encontrado.
                </Typography>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Accordion
          expanded={contactExpanded}
          onChange={(_, isExpanded) => setContactExpanded(isExpanded)}
        >
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Typography variant="h6">Fale com o suporte</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <TextField
                label="Email para contato"
                fullWidth
                value={supportEmail}
                onChange={(event) => setSupportEmail(event.target.value)}
              />
              <TextField
                select
                label="Categoria"
                fullWidth
                value={supportCategory}
                onChange={(event) => setSupportCategory(event.target.value)}
              >
                {supportCategories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Mensagem"
                fullWidth
                multiline
                minRows={4}
                value={supportMessage}
                onChange={(event) => setSupportMessage(event.target.value)}
              />
              <Button variant="contained" sx={{ alignSelf: "flex-start" }}>
                Enviar mensagem
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Box>
  );
}
