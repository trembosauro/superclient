import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField as MuiTextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "wouter";
import PageContainer from "../components/layout/PageContainer";
import PageStack from "../components/layout/PageStack";
import AppAccordion from "../components/layout/AppAccordion";
import CardSection from "../components/layout/CardSection";
import api from "../api";
import { TextField } from "../ui/TextField";
import { SearchField } from "../ui/SearchField";

const faqItems = [
  // Autenticação e Acesso
  {
    title: "Criar uma conta",
    content:
      "Acesse a página inicial e clique em 'Criar conta'. Preencha nome, email e senha. Após criar, você já entra logado e pode começar a usar o sistema imediatamente com dados de exemplo para testar os fluxos.",
  },
  {
    title: "Fazer login",
    content:
      "Na página inicial, clique em 'Entrar', informe seu email e senha. Você pode marcar 'Manter conectado' para não precisar logar novamente. Se esquecer a senha, clique em 'Recuperar senha' para receber um código no email.",
  },
  {
    title: "Recuperar senha",
    content:
      "Clique em 'Recuperar senha' na tela de login, informe seu email e clique em 'Enviar código'. Você receberá um código por email. Insira o código e defina uma nova senha. O código expira em 1 hora.",
  },
  {
    title: "Trocar de conta",
    content:
      "Em Perfil, na seção 'Conta', você verá suas contas recentes. Clique em uma conta para alternar ou use 'Entrar em outra conta' para adicionar um novo login. Você pode ter até 3 contas salvas.",
  },
  {
    title: "Duração da sessão",
    content:
      "A sessão dura 1 semana. Se você logar em outro dispositivo, a sessão anterior pode ser encerrada por segurança. Use 'Sessão única' nas preferências para garantir que só um dispositivo fique logado por vez.",
  },
  // Dashboard
  {
    title: "Home (dashboard)",
    content:
      "A Home é seu painel central com visão geral do pipeline (total de cards, valor total, ticket médio), finanças (gastos totais, categoria em destaque) e gestão (papéis ativos, módulos). Você pode configurar quais seções e indicadores aparecem.",
  },
  {
    title: "Configurar a Home",
    content:
      "Clique no ícone de engrenagem na Home. Você pode ativar/desativar seções (Pipeline, Finanças, Gestão), escolher quais indicadores mostrar em cada seção, e configurar os links rápidos para navegação.",
  },
  // Pipeline
  {
    title: "Usar o Pipeline",
    content:
      "O Pipeline organiza suas tarefas/oportunidades em colunas (etapas). Arraste cards entre colunas para mudar o status. Clique em um card para ver detalhes ou editar. Use o botão '+' em cada coluna para criar novas tarefas.",
  },
  {
    title: "Criar e editar tarefas no Pipeline",
    content:
      "Clique em '+' na coluna desejada para criar uma tarefa. Preencha título, valor, responsáveis, categorias e descrição. Para editar, clique no card e depois em 'Editar'. Você pode duplicar tarefas e definir prioridade, data de entrega, checklist e labels.",
  },
  {
    title: "Colunas e categorias no Pipeline",
    content:
      "Nas configurações do Pipeline, você pode criar novas colunas, renomear, reordenar (arrastando) e arquivar. Cada tarefa pode ter múltiplas categorias com cores. Crie categorias personalizadas nas configurações.",
  },
  {
    title: "Sprints e Backlog",
    content:
      "Ative Sprints nas configurações para organizar trabalho em ciclos. Tarefas no backlog aguardam uma sprint. Inicie uma sprint para mover tarefas para o board. Ao finalizar, o histórico fica salvo e você pode reabrir sprints anteriores.",
  },
  {
    title: "Métricas do Pipeline",
    content:
      "Acesse Pipeline > Dados. Veja gráficos de distribuição por etapa, evolução ao longo do tempo e métricas de valor. Ative o campo 'valor' nas configurações da tarefa para ver métricas financeiras.",
  },
  // Finanças
  {
    title: "Registrar gastos",
    content:
      "Em Finanças, clique em 'Adicionar gasto'. Preencha título, valor, categoria e comentário. Você também pode associar contatos ao gasto. Para editar, clique em um item na tabela.",
  },
  {
    title: "Relatórios financeiros",
    content:
      "A página de Finanças mostra gráficos de gastos por categoria (pizza) e evolução mensal (barras). Use os filtros de busca e categoria para refinar a visualização. Configure quais colunas aparecem na tabela.",
  },
  {
    title: "Categorias financeiras",
    content:
      "Nas configurações de Finanças, você pode criar, editar e remover categorias. Cada categoria tem nome e cor. As categorias são independentes das categorias de Pipeline e Contatos.",
  },
  // Calendário
  {
    title: "Criar tarefas no Calendário",
    content:
      "Clique em um dia no calendário ou use 'Nova tarefa'. Defina nome, data, horário (início e fim), local, lembrete, repetição e visibilidade. Você pode marcar como 'Dia inteiro' e adicionar descrição rica com formatação.",
  },
  {
    title: "Múltiplos calendários",
    content:
      "Crie calendários separados (Pessoal, Trabalho, Equipe, Finanças) nas configurações. Cada calendário tem uma cor. Ative/desative calendários no painel lateral para filtrar a visualização.",
  },
  {
    title: "Lembretes e repetições",
    content:
      "Cada tarefa pode ter um lembrete (sem, 5min, 15min, 30min, 1h, 1 dia antes). A repetição pode ser: não repetir, diária, semanal, mensal ou anual. Tarefas repetidas aparecem automaticamente nas datas futuras.",
  },
  {
    title: "Ver tarefas concluídas",
    content:
      "Acesse Calendário > Concluídas. Veja o histórico de todas as tarefas marcadas como feitas, organizadas por data. Use filtros de busca e categoria para encontrar tarefas específicas.",
  },
  // Contatos
  {
    title: "Cadastrar contatos",
    content:
      "Em Contatos, clique em 'Adicionar contato'. Preencha nome, data de nascimento, telefones (múltiplos), emails (múltiplos), endereços e comentários. Associe categorias para organizar.",
  },
  {
    title: "Organizar contatos por categorias",
    content:
      "Crie categorias como Cliente, Fornecedor, Família, VIP nas configurações. Cada contato pode ter múltiplas categorias. Use o filtro para ver apenas contatos de categorias específicas.",
  },
  {
    title: "Ações rápidas em contatos",
    content:
      "Na lista ou detalhes do contato, clique no ícone de telefone para abrir WhatsApp, no envelope para enviar email. Use o ícone de cópia para copiar qualquer informação para a área de transferência.",
  },
  // Notas
  {
    title: "Criar e organizar notas",
    content:
      "Em Notas, clique em 'Nova nota'. Use o editor rico para formatar texto (negrito, itálico, listas, títulos). Organize por categorias e use a busca para encontrar rapidamente.",
  },
  {
    title: "Notas: subnotas (arrastar e soltar)",
    content:
      "Você pode organizar notas em níveis (nota dentro de nota). Em lista ou grade, arraste uma nota e solte em cima de outra para criar uma subnota. Para desfazer, mova a nota de volta para o nível principal.",
  },
  {
    title: "Arquivar notas",
    content:
      "Clique em uma nota e use a opção 'Arquivar'. Notas arquivadas vão para Notas > Arquivo. Você pode restaurar notas arquivadas a qualquer momento.",
  },
  {
    title: "Lixeira de notas",
    content:
      "Ao excluir uma nota, ela vai para Notas > Lixeira. De lá você pode restaurar ou remover definitivamente. Isso ajuda a evitar perdas acidentais.",
  },
  {
    title: "Duplicar e importar notas",
    content:
      "Em Notas, você pode duplicar uma nota para reaproveitar uma estrutura. Também é possível importar notas para acelerar a migração e começar a usar o app com conteúdo real.",
  },
  // Tarefas (agenda)
  {
    title: "Tarefas (agenda)",
    content:
      "Em Tarefas, você organiza sua rotina em uma visão de agenda com foco no dia. Crie tarefas, marque como concluídas e acompanhe o volume diário. Use categorias e busca para encontrar o que precisa rápido.",
  },
  // Gestão e Configurações
  {
    title: "Papéis e permissões",
    content:
      "Em Gestão de Acessos, crie papéis (Administrador, Gestor, Analista, Leitor). Configure permissões específicas para cada papel: visualizar/editar pipeline, visualizar/editar finanças, gerenciar acessos.",
  },
  {
    title: "Módulos pagos",
    content:
      "Em Gestão de Acessos > Módulos, ative ou desative módulos conforme seu plano. Módulos desativados ficam ocultos na navegação. Alguns módulos podem exigir upgrade de plano.",
  },
  {
    title: "Convidar membros",
    content:
      "Em Gestão de Acessos > Convites, adicione o email do novo membro e selecione o papel. O convite fica pendente até ser aceito. Você pode cancelar convites pendentes.",
  },
  // Perfil e Preferências
  {
    title: "Editar perfil",
    content:
      "Em Perfil, atualize seu nome e adicione emails secundários para login. Configure preferências como tema, idioma e módulos ativos. Use 'Sair' para fazer logout ou 'Trocar de conta' para alternar entre contas.",
  },
  {
    title: "Mudar idioma",
    content:
      "Em Perfil > Preferências, selecione o idioma desejado (Português, English, Español). A mudança é aplicada imediatamente. Você pode desfazer a alteração se mudar por engano.",
  },
  {
    title: "Tema escuro",
    content:
      "O Superclient usa tema escuro por padrão para reduzir cansaço visual. As cores foram otimizadas para boa legibilidade e contraste em ambientes com pouca luz.",
  },
  // Notificações
  {
    title: "Notificações",
    content:
      "O sino no menu mostra notificações como aniversários próximos de contatos, lembretes de tarefas e alertas do sistema. Clique em uma notificação para ir direto ao item relacionado.",
  },
  {
    title: "Notificações do navegador (Chrome)",
    content:
      "Você pode ativar notificações do navegador para receber alertas na área de trabalho quando marcar uma tarefa como concluída. Para ativar, vá em Calendário > Configurações (ícone de engrenagem) > Notificações do navegador e clique em 'Ativar notificações'. O navegador pedirá permissão - clique em 'Permitir'. Se você bloqueou as notificações anteriormente, será necessário alterar nas configurações do navegador.",
  },
  {
    title: "Tarefas concluídas nas notificações",
    content:
      "Quando você marca uma tarefa do calendário como concluída, ela aparece automaticamente na tela de Notificações na seção 'Tarefas concluídas'. Lá você pode ver todas as tarefas finalizadas recentemente com a informação de quando foram concluídas. Use os botões 'Marcar como visto' para limpar o indicador de novas notificações ou 'Limpar' para remover o histórico de tarefas concluídas.",
  },
  // Home e Dashboard
  {
    title: "Links rápidos na Home",
    content:
      "Os links rápidos são atalhos de navegação exibidos apenas na versão mobile do sistema. Eles foram projetados para agilizar a navegação em dispositivos móveis, permitindo acesso rápido aos principais módulos (Pipeline, Finanças, Contatos, Calendário, Notas, Gestão) com um único toque. No desktop, a navegação pelo menu lateral é mais prática, por isso os links rápidos ficam ocultos.",
  },
  // Dúvidas Gerais
  {
    title: "Salvamento automático",
    content:
      "Sim, todas as alterações são salvas automaticamente em tempo real. Você não precisa clicar em 'Salvar' - basta fazer a alteração e ela já está persistida.",
  },
  {
    title: "Acesso em vários dispositivos",
    content:
      "Sim, acesse de qualquer navegador. Seus dados são sincronizados. Por segurança, ao logar em um novo dispositivo, sessões anteriores podem ser encerradas (configurável em Preferências).",
  },
  {
    title: "Busca global",
    content:
      "Use o campo de busca em cada módulo para filtrar itens. A busca considera título, descrição, categorias e outros campos relevantes. Combine com filtros de categoria para refinar resultados.",
  },
];

const supportCategories = [
  { value: "duvidas", label: "Dúvidas" },
  { value: "sugestoes", label: "Sugestões" },
  { value: "problemas_financeiros", label: "Problemas financeiros" },
  { value: "suporte_tecnico", label: "Suporte técnico" },
  { value: "cobranca", label: "Cobrança" },
  { value: "outros", label: "Outros" },
];

export default function Support() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [query, setQuery] = useState("");
  const [contactExpanded, setContactExpanded] = useState(false);
  const [supportEmail, setSupportEmail] = useState("");
  const [supportCategory, setSupportCategory] = useState("duvidas");
  const [supportMessage, setSupportMessage] = useState("");

  useEffect(() => {
    let active = true;
    api
      .get("/api/auth/me")
      .then(() => {
        if (active) {
          setIsLoggedIn(true);
        }
      })
      .catch(() => {
        if (active) {
          setIsLoggedIn(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return faqItems;
    }
    return faqItems.filter(item => {
      const haystack = `${item.title} ${item.content}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [query]);

  return (
    <PageContainer>
      <PageStack maxWidth={1200}>
        <Stack spacing={2}>
          {!isLoggedIn ? (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.25}
              sx={{ mt: 1 }}
            >
              <Button component={RouterLink} href="/signup" variant="contained">
                Criar conta
              </Button>
              <Button component={RouterLink} href="/login" variant="outlined">
                Entrar
              </Button>
            </Stack>
          ) : null}
        </Stack>

        <SearchField
          fullWidth
          placeholder="Buscar dúvida"
          value={query}
          onChange={event => setQuery(event.target.value)}
          onClear={() => setQuery("")}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 2,
          }}
        >
          {filteredItems.length ? (
            filteredItems.map(item => (
              <CardSection key={item.title} size="xs" sx={{ height: "100%" }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {item.content}
                  </Typography>
                </Stack>
              </CardSection>
            ))
          ) : (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Nenhum artigo encontrado.
            </Typography>
          )}
        </Box>

        <AppAccordion
            expanded={contactExpanded}
            onChange={(_, isExpanded) => setContactExpanded(isExpanded)}
            title="Fale com o suporte"
          >
            <Stack spacing={1.5}>
              <TextField
                label="Email para contato"
                type="email"
                value={supportEmail}
                onChange={event => setSupportEmail(event.target.value)}
              />
              <MuiTextField
                select
                label="Categoria"
                fullWidth
                value={supportCategory}
                onChange={event => setSupportCategory(event.target.value)}
              >
                {supportCategories.map(category => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </MuiTextField>
              <MuiTextField
                label="Mensagem"
                fullWidth
                multiline
                minRows={4}
                value={supportMessage}
                onChange={event => setSupportMessage(event.target.value)}
              />
              <Stack direction="row" justifyContent="flex-end">
                <Button variant="contained">Enviar mensagem</Button>
              </Stack>
            </Stack>
          </AppAccordion>
      </PageStack>
    </PageContainer>
  );
}
